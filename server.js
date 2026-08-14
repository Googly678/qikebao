import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import axios from 'axios'
import sqlite3 from 'sqlite3'
import { createCipheriv, createDecipheriv, randomBytes, createHmac } from 'crypto'

const app = express()
app.use(cors())
app.use(bodyParser.json())

const PORT = process.env.PORT || 3001

// Read shared key from environment for security. Fallback to a demo key but warn.
const SHARED_KEY_BASE64 = process.env.SHARED_KEY_BASE64 || 'w7v0u+v8x8n9r1s2t3u4v5w6x7y8z9A0B1C2D3E4F5G='
if (!process.env.SHARED_KEY_BASE64) {
  console.warn('WARNING: using fallback SHARED_KEY_BASE64. Set environment variable SHARED_KEY_BASE64 in production.')
}

function base64ToBuffer(b64) {
  return Buffer.from(b64, 'base64')
}

function bufferToBase64(buf) {
  return buf.toString('base64')
}

function encryptAesGcmBase64(plain, base64Key) {
  const key = base64ToBuffer(base64Key)
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const enc = Buffer.concat([cipher.update(Buffer.from(plain, 'utf8')), cipher.final()])
  const tag = cipher.getAuthTag()
  return bufferToBase64(Buffer.concat([iv, enc, tag]))
}

function decryptAesGcmBase64(b64, base64Key) {
  const raw = base64ToBuffer(b64)
  const iv = raw.slice(0, 12)
  const tag = raw.slice(raw.length - 16)
  const cipherText = raw.slice(12, raw.length - 16)
  const decipher = createDecipheriv('aes-256-gcm', base64ToBuffer(base64Key), iv)
  decipher.setAuthTag(tag)
  const res = Buffer.concat([decipher.update(cipherText), decipher.final()])
  return res.toString('utf8')
}

function hmacSha256Hex(message, base64Key) {
  return createHmac('sha256', base64ToBuffer(base64Key)).update(message).digest('hex')
}

function canonicalQuery(params) {
  return Object.keys(params)
    .sort()
    .map((k) => `${k}=${encodeURIComponent(String(params[k]))}`)
    .join('&')
}

// Ensure data directory
const dataDir = path.join(process.cwd(), 'data')
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
const dbFile = path.join(dataDir, 'orders.db')

// Initialize SQLite DB
const sqlite = sqlite3.verbose()
const db = new sqlite.Database(dbFile)

function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err)
      else resolve(this)
    })
  })
}

function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err)
      else resolve(row)
    })
  })
}

// Create orders table
await runAsync(
  `CREATE TABLE IF NOT EXISTS orders (
    order_no TEXT PRIMARY KEY,
    third_order_no TEXT,
    protocol_url TEXT,
    pay_time TEXT,
    pay_status TEXT,
    amount REAL,
    updated_at TEXT,
    callback_status TEXT,
    callback_attempts INTEGER DEFAULT 0,
    callback_last_error TEXT
  )`
)

async function saveOrUpdateOrder(o) {
  const sql = `INSERT INTO orders(order_no, third_order_no, protocol_url, pay_time, pay_status, amount, updated_at, callback_status, callback_attempts, callback_last_error)
    VALUES(?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(order_no) DO UPDATE SET
      third_order_no=excluded.third_order_no,
      protocol_url=excluded.protocol_url,
      pay_time=excluded.pay_time,
      pay_status=excluded.pay_status,
      amount=excluded.amount,
      updated_at=excluded.updated_at` // do not overwrite callback_status/attempts here
  await runAsync(sql, [o.order_no, o.third_order_no, o.protocol_url, o.pay_time, o.pay_status, o.amount || 0, o.updated_at || new Date().toISOString(), o.callback_status || null, o.callback_attempts || 0, o.callback_last_error || null])
}

async function getOrder(order_no) {
  return getAsync('SELECT * FROM orders WHERE order_no = ?', [order_no])
}

// Send protocol back to partner with retries and idempotency
async function sendCallback(order, callbackUrl) {
  if (!callbackUrl) {
    console.log('[sendCallback] no callbackUrl provided, skipping')
    return
  }

  const existing = await getOrder(order.order_no)
  if (existing && existing.callback_status === 'SUCCESS') {
    console.log('[sendCallback] callback already succeeded for', order.order_no)
    return
  }

  const maxAttempts = 3
  let attempt = existing?.callback_attempts || 0
  let lastError = null

  const payload = {
    order_no: order.order_no,
    third_order_no: order.third_order_no,
    protocol_url: order.protocol_url,
    sign_time: new Date().toISOString(),
    pay_time: order.pay_time,
    pay_status: order.pay_status,
    amount: order.amount || 0,
    timestamp: Date.now(),
  }
  // attach signature
  const qs = canonicalQuery(payload)
  payload.sign = hmacSha256Hex(qs, SHARED_KEY_BASE64)

  while (attempt < maxAttempts) {
    try {
      attempt++
      console.log(`[sendCallback] attempt ${attempt} to ${callbackUrl} for order ${order.order_no}`)
      const resp = await axios.post(callbackUrl, payload, { timeout: 5000 })
      if (resp.status === 200) {
        await runAsync('UPDATE orders SET callback_status = ?, callback_attempts = ?, callback_last_error = ? WHERE order_no = ?', ['SUCCESS', attempt, null, order.order_no])
        console.log('[sendCallback] callback succeeded for', order.order_no)
        return
      } else {
        lastError = `status ${resp.status}`
      }
    } catch (e) {
      lastError = e?.message || String(e)
      console.warn('[sendCallback] error', lastError)
    }
    // update attempts and last error
    await runAsync('UPDATE orders SET callback_attempts = ?, callback_last_error = ? WHERE order_no = ?', [attempt, lastError, order.order_no])
    // backoff
    await new Promise((r) => setTimeout(r, attempt * 1000))
  }

  // final failure
  await runAsync('UPDATE orders SET callback_status = ?, callback_attempts = ?, callback_last_error = ? WHERE order_no = ?', ['FAILED', attempt, lastError, order.order_no])
  console.error('[sendCallback] all attempts failed for', order.order_no, lastError)
}

// Endpoint to receive protocol return (from payment flow)
app.post('/api/protocol/return', async (req, res) => {
  const payload = req.body || {}
  console.log('[protocol/return] received', payload)
  const { order_no, third_order_no, protocol_url, pay_time, pay_status, amount, partner_callback_url } = payload
  if (!order_no) return res.status(400).json({ code: 400, message: 'missing order_no' })

  // 订单状态机（PRD 12.1）：PENDING → SIGNED → PAID / CANCELLED
  const status = ['PENDING', 'SIGNED', 'PAID', 'CANCELLED'].includes(pay_status) ? pay_status : 'PENDING'

  const order = {
    order_no,
    third_order_no: third_order_no || null,
    protocol_url: protocol_url || null,
    pay_time: status === 'PAID' ? (pay_time || new Date().toISOString()) : (pay_time || null),
    pay_status: status,
    amount: amount || 0,
    updated_at: new Date().toISOString(),
  }

  try {
    await saveOrUpdateOrder(order)
  } catch (e) {
    console.error('[protocol/return] db error', e)
    return res.status(500).json({ code: 500, message: 'db error' })
  }

  // Async: send back to partner callback URL (either provided or from env)
  const callbackUrl = partner_callback_url || process.env.PARTNER_CALLBACK_URL || null
  if (callbackUrl) {
    // fire and forget
    sendCallback(order, callbackUrl).catch((e) => console.error('[protocol/return] sendCallback error', e))
  } else {
    console.warn('[protocol/return] no partner callback URL provided. To enable push set partner_callback_url in payload or PARTNER_CALLBACK_URL env var')
  }

  res.json({ code: 200, message: 'ok' })
})

// Endpoint to generate redirect URL (server-side encryption & signing)
app.post('/api/generate-redirect', (req, res) => {
  const { vin, mobile, product_sku, channel_id } = req.body || {}
  if (!vin || !mobile || !product_sku) return res.status(400).json({ code: 400, message: 'missing params' })

  const timestamp = String(Date.now())
  const vinEnc = encryptAesGcmBase64(vin, SHARED_KEY_BASE64)
  const mobileEnc = encryptAesGcmBase64(mobile, SHARED_KEY_BASE64)
  const paramsForSign = { vin: vinEnc, mobile: mobileEnc, product_sku, channel_id: channel_id || 'channel-rc-001', timestamp }
  const qs = canonicalQuery(paramsForSign)
  const sign = hmacSha256Hex(qs, SHARED_KEY_BASE64)

  const query = `vin=${encodeURIComponent(vinEnc)}&mobile=${encodeURIComponent(mobileEnc)}&product_sku=${encodeURIComponent(product_sku)}&channel_id=${encodeURIComponent(paramsForSign.channel_id)}&timestamp=${encodeURIComponent(timestamp)}&sign=${encodeURIComponent(sign)}`

  res.json({ code: 200, redirect: `/partner/landing?${query}` })
})

// Endpoint to parse and validate redirect params (server-side verify & decrypt)
app.get('/api/parse-redirect', (req, res) => {
  const { vin: vinEnc, mobile: mobileEnc, product_sku, channel_id, timestamp, sign } = req.query || {}
  if (!vinEnc || !mobileEnc || !product_sku || !timestamp || !sign) return res.status(400).json({ code: 400, message: 'missing params' })

  const paramsForSign = { vin: String(vinEnc), mobile: String(mobileEnc), product_sku: String(product_sku), channel_id: String(channel_id || 'channel-rc-001'), timestamp: String(timestamp) }
  const qs = canonicalQuery(paramsForSign)
  const computed = hmacSha256Hex(qs, SHARED_KEY_BASE64)
  if (computed !== String(sign)) return res.status(400).json({ code: 400, message: 'sign invalid' })

  try {
    const vin = decryptAesGcmBase64(String(vinEnc), SHARED_KEY_BASE64)
    const mobile = decryptAesGcmBase64(String(mobileEnc), SHARED_KEY_BASE64)
    res.json({ code: 200, data: { vin, mobile, product_sku: paramsForSign.product_sku, channel_id: paramsForSign.channel_id } })
  } catch (e) {
    return res.status(400).json({ code: 400, message: 'decrypt failed' })
  }
})

// Read order status from DB
app.get('/api/order/status', async (req, res) => {
  const order_no = req.query.order_no
  if (!order_no) return res.status(400).json({ code: 400, message: 'missing order_no' })
  try {
    const o = await getOrder(String(order_no))
    if (!o) return res.status(404).json({ code: 404, message: 'not found' })
    res.json({ code: 200, data: { order_no: o.order_no, status: o.pay_status || 'PENDING', protocol_url: o.protocol_url, pay_time: o.pay_time, update_time: o.updated_at, callback_status: o.callback_status, callback_attempts: o.callback_attempts, callback_last_error: o.callback_last_error } })
  } catch (e) {
    console.error(e)
    res.status(500).json({ code: 500, message: 'db error' })
  }
})

app.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`)
})
