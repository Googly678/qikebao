/**
 * 后端服务封装（含 GitHub Pages 降级模式）
 * ------------------------------------------------
 * 真实后端（server.js，Node + express + sqlite3）可运行时走真实 API；
 * 部署到 GitHub Pages 等纯静态托管时后端不可用，自动降级为「纯前端模拟」：
 *   - 加密/解密/签名：Web Crypto（AES-GCM + HMAC-SHA256），与 server.js 格式一致
 *   - 订单落库：localStorage('orders')
 *
 * ⚠️ 注意：降级模式会把演示密钥暴露在浏览器中，仅用于静态托管演示；
 *    生产环境必须部署真实后端并将密钥移入环境变量。
 */
import { API_BASE, DEFAULT_CHANNEL_ID } from '../config'
import { canonicalQuery } from '../utils/crypto'

// 与 server.js 默认 SHARED_KEY_BASE64 保持一致（32 字节 AES-256 key）
const DEMO_KEY_BASE64 = 'w7v0u+v8x8n9r1s2t3u4v5w6x7y8z9A0B1C2D3E4F5G='

/* ───────────────────────── base64 <-> bytes ───────────────────────── */

function base64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const bin = atob(b64)
  const bytes = new Uint8Array(new ArrayBuffer(bin.length))
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin)
}

/* ───────────────────────── Web Crypto 工具 ───────────────────────── */

async function importAesKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', base64ToBytes(DEMO_KEY_BASE64), { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
}

async function importHmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', base64ToBytes(DEMO_KEY_BASE64), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
}

// 与 server.js encryptAesGcmBase64 同格式：iv(12) + ciphertext + tag(16)，整体 base64
async function encryptAesGcm(plain: string): Promise<string> {
  const key = await importAesKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const enc = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plain))
  const full = new Uint8Array(12 + enc.byteLength)
  full.set(iv, 0)
  full.set(new Uint8Array(enc), 12)
  return bytesToBase64(full)
}

async function decryptAesGcm(b64: string): Promise<string> {
  const raw = base64ToBytes(b64)
  const iv = raw.slice(0, 12)
  const data = raw.slice(12)
  const key = await importAesKey()
  const dec = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data)
  return new TextDecoder().decode(dec)
}

// 与 server.js hmacSha256Hex 同格式：小写 hex
async function hmacSignHex(message: string): Promise<string> {
  const key = await importHmacKey()
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

/* ─────────────────────── 降级订单存储（localStorage） ─────────────────────── */

const ORDER_STORAGE_KEY = 'orders'

function readOrders(): any[] {
  try {
    const raw = localStorage.getItem(ORDER_STORAGE_KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr : []
  } catch (e) {
    return []
  }
}

function upsertOrder(order: any) {
  const list = readOrders()
  const idx = list.findIndex((o) => o.order_no === order.order_no)
  if (idx >= 0) list[idx] = { ...list[idx], ...order, updated_at: new Date().toISOString() }
  else list.unshift({ ...order, updated_at: new Date().toISOString() })
  localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(list))
}

function readOrder(orderNo: string): any {
  return readOrders().find((o) => o.order_no === orderNo) ?? null
}

/* ───────────────────────── 对外接口 ───────────────────────── */

export interface RedirectParams {
  vin: string
  mobile: string
  product_sku: string
  channel_id?: string
}

export interface OrderPayload {
  order_no: string
  third_order_no: string
  protocol_url: string
  sign_time: string
  pay_time?: string
  pay_status: string
  amount: number
  timestamp: number
  partner_callback_url?: string
  product_id?: string
  productName?: string
  vehicle?: any
  mobile?: string
  [key: string]: unknown
}

/** 生成跳转参数（加密 VIN/手机号 + 签名），返回 /partner/landing?… */
export async function generateRedirect(params: RedirectParams): Promise<{ redirect: string }> {
  try {
    const resp = await fetch(`${API_BASE}/generate-redirect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    const body = await resp.json()
    if (resp.ok && body.code === 200 && body.redirect) return { redirect: body.redirect }
    throw new Error(body?.message || 'generate-redirect failed')
  } catch (e) {
    // ── 降级：前端加密 + 签名（与 server.js 相同格式） ──
    console.warn('[partner] backend unavailable, using frontend fallback for generateRedirect', e)
    const timestamp = String(Date.now())
    const channel_id = params.channel_id || DEFAULT_CHANNEL_ID
    const vinEnc = await encryptAesGcm(params.vin)
    const mobileEnc = await encryptAesGcm(params.mobile)
    const signParams = { vin: vinEnc, mobile: mobileEnc, product_sku: params.product_sku, channel_id, timestamp }
    const qs = canonicalQuery(signParams)
    const sign = await hmacSignHex(qs)
    const query = `vin=${encodeURIComponent(vinEnc)}&mobile=${encodeURIComponent(mobileEnc)}&product_sku=${encodeURIComponent(params.product_sku)}&channel_id=${encodeURIComponent(channel_id)}&timestamp=${encodeURIComponent(timestamp)}&sign=${encodeURIComponent(sign)}`
    return { redirect: `/partner/landing?${query}` }
  }
}

/** 解析跳转参数（验签 + 解密） */
export async function parseRedirect(qp: URLSearchParams): Promise<{ vin: string; mobile: string; product_sku: string; channel_id: string }> {
  const vinEnc = qp.get('vin') || ''
  const mobileEnc = qp.get('mobile') || ''
  const product_sku = qp.get('product_sku') || ''
  const channel_id = qp.get('channel_id') || DEFAULT_CHANNEL_ID
  const timestamp = qp.get('timestamp') || ''
  const sign = qp.get('sign') || ''

  try {
    const params = new URLSearchParams({ vin: vinEnc, mobile: mobileEnc, product_sku, channel_id, timestamp, sign })
    const resp = await fetch(`${API_BASE}/parse-redirect?${params.toString()}`)
    if (resp.ok) {
      const body = await resp.json()
      if (body.code === 200 && body.data) return body.data
    }
    throw new Error('parse-redirect failed')
  } catch (e) {
    // ── 降级：前端验签 + 解密 ──
    console.warn('[partner] backend unavailable, using frontend fallback for parseRedirect', e)
    const signParams = { vin: vinEnc, mobile: mobileEnc, product_sku, channel_id, timestamp }
    const computed = await hmacSignHex(canonicalQuery(signParams))
    if (computed !== sign) throw new Error('签名校验失败')
    const vin = await decryptAesGcm(vinEnc)
    const mobile = await decryptAesGcm(mobileEnc)
    return { vin, mobile, product_sku, channel_id }
  }
}

/** 保存订单（签约 SIGNED / 支付 PAID），后端不可用时写入 localStorage */
export async function saveOrder(order: OrderPayload): Promise<void> {
  try {
    const resp = await fetch(`${API_BASE}/protocol/return`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    })
    const body = await resp.json()
    if (resp.ok && body.code === 200) return
    throw new Error(body?.message || 'protocol/return failed')
  } catch (e) {
    // ── 降级：写 localStorage('orders') ──
    console.warn('[partner] backend unavailable, storing order in localStorage', e)
    upsertOrder(order)
  }
}

/** 查询订单状态（后端不可用时从 localStorage 读取） */
export async function getOrderStatus(orderNo: string): Promise<{ status: string; protocol_url?: string; pay_time?: string; update_time?: string } | null> {
  try {
    const resp = await fetch(`${API_BASE}/order/status?order_no=${encodeURIComponent(orderNo)}`)
    if (resp.ok) {
      const body = await resp.json()
      if (body.code === 200 && body.data) return body.data
    }
    throw new Error('order/status failed')
  } catch (e) {
    console.warn('[partner] backend unavailable, reading order from localStorage', e)
    const o = readOrder(orderNo)
    if (!o) return null
    return {
      status: o.pay_status || 'PENDING',
      protocol_url: o.protocol_url,
      pay_time: o.pay_time,
      update_time: o.updated_at,
    }
  }
}
