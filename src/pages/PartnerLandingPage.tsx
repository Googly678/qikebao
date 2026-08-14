import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import PageHeader from '../components/PageHeader/PageHeader'
import { DEFAULT_CHANNEL_ID } from '../config'
import { parseRedirect } from '../services/partner'
import styles from './PartnerLandingPage.module.css'

// This page simulates 我方平台签约落地页 which receives encrypted params from 人车行平台
export default function PartnerLandingPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const qp = new URLSearchParams(location.search)
        const vinEnc = qp.get('vin')
        const mobileEnc = qp.get('mobile')
        const product_sku = qp.get('product_sku')
        const channel_id = qp.get('channel_id') || DEFAULT_CHANNEL_ID
        const timestamp = qp.get('timestamp') || ''
        const sign = qp.get('sign') || ''

        if (!vinEnc || !mobileEnc || !product_sku || !timestamp || !sign) {
          setError('缺少必要参数')
          setLoading(false)
          return
        }

        // F-OP-001 参数解析：后端可用时服务端验签+解密；纯静态托管时前端降级
        const data = await parseRedirect(new URLSearchParams(location.search))
        const { vin, mobile } = data

        // 合并跳转前暂存的车辆信息（ConfirmVehiclePage 写入），供签约页预填展示
        let vehicle: any = null
        try {
          const raw = sessionStorage.getItem('prefill_order')
          if (raw) {
            const prev = JSON.parse(raw)
            if (prev && prev.vehicle) vehicle = prev.vehicle
          }
        } catch (e) {
          // ignore
        }

        // F-OP-001 参数解析 → F-OP-002 信息预填：落 sessionStorage 并带状态跳转
        const prefill = { vin, mobile, product_sku: String(product_sku), channel_id: String(channel_id), vehicle }
        sessionStorage.setItem('prefill_order', JSON.stringify(prefill))
        navigate(`/insurance/${product_sku}/contract-terms`, { state: { prefill } })
      } catch (e: any) {
        setError(e?.message || '处理参数失败')
      } finally {
        setLoading(false)
      }
    })()
  }, [location.search, navigate])

  return (
    <div className={styles.page}>
      <PageHeader title="签约落地页" showBack />
      <div className={styles.content}>
        {loading ? <div>正在验证跳转参数并准备签约页面…</div> : error ? <div className={styles.error}>{error}</div> : <div>正在跳转至签约页…</div>}
      </div>
    </div>
  )
}
