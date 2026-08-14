import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
// Read bound vehicles from localStorage rather than using repo mock data
import PageHeader from '../../components/PageHeader/PageHeader'
import { useAuthStore } from '../../store/auth'
import { useUIStore } from '../../store/ui'
import { API_BASE, DEFAULT_CHANNEL_ID } from '../../config'
import styles from './ConfirmVehiclePage.module.css'

export default function ConfirmVehiclePage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation(['insurance', 'mine'])
  const navigate = useNavigate()
  const userInfo = useAuthStore((s) => s.userInfo)
  const addToast = useUIStore((s) => s.addToast)
  const [submittingVin, setSubmittingVin] = useState<string | null>(null)
  const [vehicles, setVehicles] = useState<any[]>([])

  // 读取用户已绑定车辆（localStorage: 'boundVehicles'），为空时回退演示车辆
  useEffect(() => {
    let v: any[] = []
    try {
      const raw = localStorage.getItem('boundVehicles')
      if (raw) v = JSON.parse(raw)
    } catch (e) {
      console.warn('Failed to read boundVehicles from localStorage', e)
    }
    if (v.length === 0) {
      import('../../mocks/vehicles')
        .then(({ mockVehicles }) => {
          try {
            localStorage.setItem('boundVehicles', JSON.stringify(mockVehicles))
            setVehicles(mockVehicles)
          } catch (e) {
            setVehicles(mockVehicles)
          }
        })
        .catch((e) => console.warn('Failed to seed boundVehicles from mocks', e))
    } else {
      setVehicles(v)
    }
  }, [])

  const handleConfirm = async (v: any) => {
    setSubmittingVin(v.vin)
    try {
      // F-RC-004 跳转参数组装：VIN、车主手机号、产品SKU、渠道ID
      // 加密与签名由服务端完成（AES-256-GCM + HMAC-SHA256）
      const mobile = userInfo?.phone || ''
      const resp = await fetch(`${API_BASE}/generate-redirect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vin: v.vin, mobile, product_sku: id, channel_id: DEFAULT_CHANNEL_ID }),
      })
      const body = await resp.json()
      if (!resp.ok || body.code !== 200) {
        addToast(body?.message || t('insurance:confirmVehicle.redirectFailed', '生成跳转参数失败'), 'error')
        setSubmittingVin(null)
        return
      }
      // 预填信息先落 sessionStorage，落地页解析通过后会合并车辆信息
      sessionStorage.setItem('prefill_order', JSON.stringify({
        vin: v.vin,
        mobile,
        product_sku: id,
        channel_id: DEFAULT_CHANNEL_ID,
        vehicle: v,
      }))
      navigate(body.redirect)
    } catch (e: any) {
      addToast(e?.message || t('insurance:confirmVehicle.redirectFailed', '生成跳转参数失败'), 'error')
      setSubmittingVin(null)
    }
  }

  return (
    <div className={styles.page}>
      <PageHeader title={t('insurance:confirmVehicle.title', '确认车辆信息')} showBack />
      <div className={styles.list}>
        {vehicles.length === 0 ? (
          <div className={styles.empty}>{t('insurance:confirmVehicle.noVehicles', '暂无绑定车辆')}</div>
        ) : (
          vehicles.map((v) => (
            <div key={v.vin} className={styles.card}>
              <div className={styles.row}>
                <div>
                  <strong>{v.make} {v.model}</strong>
                  <div className={styles.sub}>{t('mine:vehicles.plate', '车牌')}: {v.plate}</div>
                </div>
                <div>
                  <button
                    className={styles.primary}
                    onClick={() => handleConfirm(v)}
                    disabled={submittingVin !== null}
                  >
                    {submittingVin === v.vin
                      ? t('common:buttons.loading', '跳转中…')
                      : t('common:buttons.confirm', '确认')}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
