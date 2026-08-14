import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import styles from './MockPaymentPage.module.css'
import { API_BASE } from '../../config'

export default function MockPaymentPage() {
  const { t } = useTranslation(['payment', 'common'])
  const navigate = useNavigate()
  const location = useLocation()
  const payload = (location.state as any) || {}
  const [processing, setProcessing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successPolicy, setSuccessPolicy] = useState<any>(null)

  const handlePay = async () => {
    setProcessing(true)
    try {
      // call server protocol return as demo
      const order_no = payload.order_no ?? `ORD-${Date.now()}`
      const third_order_no = payload.third_order_no ?? `THIRD-${Math.floor(Math.random() * 1000000)}`
      const pay_time = new Date().toISOString()
      const body = {
        order_no,
        third_order_no,
        protocol_url: payload.protocol_url || `${window.location.origin}/mock-documents/${order_no}.pdf`,
        sign_time: pay_time,
        pay_time: pay_time,
        pay_status: 'PAID',
        amount: payload.amount ?? 0,
        timestamp: Date.now(),
      }

      await fetch(`${API_BASE}/protocol/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      // Persist a demo policy entry to localStorage so the Policy page shows it
      let savedPolicy: any = null
      try {
        const existing = JSON.parse(localStorage.getItem('policies') || '[]') as any[]
        // derive product name from payload only; do not pull repo mock data into runtime UI
        let productName = payload.productName || payload.product_id || '延保产品'
        try {
          // If products are persisted in localStorage (e.g., seeded by admin), try to use that
          const rawProducts = localStorage.getItem('products')
          if (rawProducts) {
            const parsed = JSON.parse(rawProducts)
            if (Array.isArray(parsed) && payload.product_id) {
              const found = parsed.find((p: any) => p.id === payload.product_id)
              if (found && found.name) productName = found.name
            }
          }
        } catch (e) {
          // ignore
        }

        // generate stable unique ids (prefer crypto.randomUUID when available)
                const makeUUID = (): string => {
                  try {
                    // modern browsers
                    if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') return (crypto as any).randomUUID()
                  } catch (e) {}
                  // fallback uuid v4-ish
                  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    const r = (Math.random() * 16) | 0
                    const v = c === 'x' ? r : (r & 0x3) | 0x8
                    return v.toString(16)
                  })
                }

                let newId = makeUUID()
                let newPolicyNo = `P-${Date.now()}-${Math.floor(Math.random() * 10000)}`
                // ensure uniqueness against existing
                const existsSet = new Set(existing.map((p:any) => p.id))
                const policyNoSet = new Set(existing.map((p:any) => p.policyNo))
                while (existsSet.has(newId)) newId = makeUUID()
                while (policyNoSet.has(newPolicyNo)) newPolicyNo = `P-${Date.now()}-${Math.floor(Math.random() * 10000)}`

                const invoiceNo = `INV-${Date.now()}-${Math.floor(Math.random() * 10000)}`
                const newPol = {
                  id: newId,
                  productName,
                  policyNo: newPolicyNo,
                  insuredName: '示例客户',
                  startDate: new Date().toISOString().slice(0,10),
                  endDate: new Date(Date.now() + 365*24*3600*1000).toISOString().slice(0,10),
                  protocol_url: body.protocol_url,
                  order_no: body.order_no,
                  amount: body.amount ?? 0,
                  paidAt: pay_time,
                  invoiceNo,
                }

                // F-OP-006 支付后处理：自动生成电子发票，供 F-RC-006 在保单详情下载
                try {
                  const invExisting = JSON.parse(localStorage.getItem('invoices') || '[]')
                  const invList = Array.isArray(invExisting) ? invExisting : []
                  invList.unshift({
                    id: `inv-${Date.now()}`,
                    invoiceNo,
                    orderNo: body.order_no,
                    amount: body.amount ?? 0,
                    productName,
                    issuedAt: pay_time,
                    policyId: newId,
                  })
                  localStorage.setItem('invoices', JSON.stringify(invList))
                } catch (e) { /* ignore */ }

                // prepend and persist
                existing.unshift(newPol)
                // basic dedupe safety: keep only first occurrence of each id
                const deduped = [] as any[]
                const seen = new Set()
                for (const p of existing) {
                  if (!seen.has(p.id)) { seen.add(p.id); deduped.push(p) }
                }
                localStorage.setItem('policies', JSON.stringify(deduped))
                savedPolicy = newPol
      } catch (e) {
        // ignore storage errors
      }

      // Show confirmation modal instead of immediate redirect
      setProcessing(false)
      setShowSuccess(true)
      setSuccessPolicy(savedPolicy)
    } catch (err) {
      // ignore
      navigate('/policy')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className={styles.page}>
      <h1>{t('payment:pageTitle', '模拟支付')}</h1>
      <p>{t('payment:summary', '请在下面模拟一次支付以完成流程。')}</p>
      <div className={styles.card}>
        <div>
          <div>{t('payment:orderNo', '订单号')}</div>
          <strong>{payload.order_no ?? '—'}</strong>
        </div>
        <div>
          <div>{t('payment:amount', '金额')}</div>
          <strong>{payload.amount ?? '0'}</strong>
        </div>
      </div>
      <div className={styles.actions}>
        <button onClick={() => navigate(-1)} className={styles.secondary}>{t('common:buttons.cancel', '取消')}</button>
        <button onClick={handlePay} disabled={processing} className={styles.primary}>{processing ? '...' : t('common:buttons.pay', '支付')}</button>
      </div>

      {showSuccess && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>支付成功</h2>
            <p>支付已完成，是否查看保单？</p>
            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <button className={styles.secondary} onClick={() => { setShowSuccess(false); navigate('/') }}>返回首页</button>
              <button className={styles.primary} onClick={() => { setShowSuccess(false); navigate('/policy') }}>查看保单</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
