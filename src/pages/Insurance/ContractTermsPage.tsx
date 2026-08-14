import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PageHeader from '../../components/PageHeader/PageHeader'
import { useAuthStore } from '../../store/auth'
import { useUIStore } from '../../store/ui'
import { saveOrder } from '../../services/partner'
import styles from './ContractTermsPage.module.css'

type Prefill = {
  vin?: string
  mobile?: string
  product_sku?: string
  channel_id?: string
  vehicle?: any
}

type OrderPayload = {
  order_no: string
  third_order_no: string
  protocol_url: string
  sign_time: string
  pay_time: string
  pay_status: string
  amount: number
  timestamp: number
  product_id?: string
  vehicle?: any
  mobile?: string
  productName?: string
}

function PaymentMethodDrawer({ visible, onClose, onPick }: { visible: boolean; onClose: () => void; onPick: (m: string) => void }) {
  const { t } = useTranslation('insurance')
  if (!visible) return null
  return (
    <div className={styles.drawerOverlay} onClick={onClose}>
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        <h3>{t('contract.payMethod', '选择支付方式')}</h3>
        <div className={styles.methods}>
          <button onClick={() => onPick('card')} className={styles.method}>{t('contract.payCard', '银行卡')}</button>
          <button onClick={() => onPick('wechat')} className={styles.method}>{t('contract.payWechat', '微信')}</button>
          <button onClick={() => onPick('alipay')} className={styles.method}>{t('contract.payAlipay', '支付宝')}</button>
        </div>
        <button className={styles.close} onClick={onClose}>{t('contract.cancel', '取消')}</button>
      </div>
    </div>
  )
}

export default function ContractTermsPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation(['insurance', 'errors', 'common'])
  const addToast = useUIStore((s) => s.addToast)
  const userInfo = useAuthStore((s) => s.userInfo)
  const [visibleDrawer, setVisibleDrawer] = useState(false)
  const [canConfirm, setCanConfirm] = useState(false)
  const [signing, setSigning] = useState(false)
  const [lastOrder, setLastOrder] = useState<OrderPayload | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)

  // F-OP-002 信息预填：优先取落地页跳转带过来的 prefill，否则回退 sessionStorage
  const prefill = useMemo<Prefill>(() => {
    const fromState = (location.state as any)?.prefill as Prefill | undefined
    if (fromState) return fromState
    try {
      const raw = sessionStorage.getItem('prefill_order')
      if (raw) return JSON.parse(raw)
    } catch (e) {
      // ignore
    }
    return {}
  }, [location.state])

  const vehicle = useMemo<any>(() => {
    if (prefill.vehicle) return prefill.vehicle
    const fromState = (location.state as any)?.vehicle
    if (fromState) return fromState
    if (prefill.vin) {
      try {
        const list = JSON.parse(localStorage.getItem('boundVehicles') || '[]')
        const found = (Array.isArray(list) ? list : []).find((v: any) => v.vin === prefill.vin)
        if (found) return found
      } catch (e) {
        // ignore
      }
    }
    return null
  }, [prefill, location.state])

  // F-OP-003 产品信息：从 localStorage('products') 读取（支付流程前已 seed）
  const product = useMemo(() => {
    try {
      const raw = localStorage.getItem('products')
      if (!raw) return undefined
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return undefined
      return parsed.find((p: any) => p.id === id)
    } catch (e) {
      return undefined
    }
  }, [id])

  // 协议条款段落（i18n 三语，returnObjects）
  const contractSections = useMemo(() => {
    const arr = t('insurance:contract.sections', { returnObjects: true })
    return Array.isArray(arr) ? (arr as { title: string; body: string }[]) : []
  }, [t])

  useEffect(() => {
    const el = contentRef.current
    if (!el) return

    const onInnerScroll = () => {
      const reached = el.scrollTop + el.clientHeight >= el.scrollHeight - 20
      setCanConfirm(reached)
    }

    const onWindowScroll = () => {
      try {
        const rect = el.getBoundingClientRect()
        // if the bottom of the contract container is visible in the viewport, consider it read
        const reached = rect.bottom <= window.innerHeight - 20
        // once reached is true we keep it true
        setCanConfirm((prev) => prev || reached)
      } catch (e) {
        // ignore
      }
    }

    el.addEventListener('scroll', onInnerScroll)
    window.addEventListener('scroll', onWindowScroll, { passive: true })
    onInnerScroll()
    onWindowScroll()

    return () => {
      el.removeEventListener('scroll', onInnerScroll)
      window.removeEventListener('scroll', onWindowScroll)
    }
  }, [])

  // F-OP-004 电子签约：阅读完整条款后确认，落库订单（SIGNED）再选支付方式
  const handleConfirm = async () => {
    setSigning(true)
    try {
      const order_no = `ORD-${Date.now()}`
      const third_order_no = `THIRD-${Math.floor(Math.random() * 1000000)}`
      const sign_time = new Date().toISOString()
      const payload: OrderPayload = {
        order_no,
        third_order_no,
        protocol_url: `${window.location.origin}/mock-documents/${order_no}.pdf`,
        sign_time,
        pay_time: '',
        pay_status: 'SIGNED',
        amount: product?.priceFrom ?? 0,
        timestamp: Date.now(),
        product_id: id,
        productName: product?.name,
        vehicle,
        mobile: prefill.mobile || userInfo?.phone || '',
      }
      // 后端可用时落库订单（SIGNED）；纯静态托管时降级写 localStorage
      await saveOrder(payload)
      setLastOrder(payload)
      setVisibleDrawer(true)
    } catch (e) {
      addToast(t('errors:toast.networkError', '网络异常，请稍后重试'), 'error')
    } finally {
      setSigning(false)
    }
  }

  const handlePick = (method: string) => {
    if (!lastOrder) return
    setVisibleDrawer(false)
    navigate('/payment', { state: { ...lastOrder, payment_method: method } })
  }

  const ownerMobile = prefill.mobile || userInfo?.phone || '—'

  return (
    <div className={styles.page}>
      <PageHeader title={t('insurance:contract.title')} showBack />
      <div className={styles.hint}>{t('insurance:contract.hint')}</div>

      {/* F-OP-003 产品信息展示 */}
      {product && (
        <section className={styles.card}>
          <div className={styles.cardTitle}>{t('insurance:contract.product', '产品信息')}</div>
          <div className={styles.infoRow}>
            <span>{t('insurance:contract.productName', '产品名称')}</span>
            <strong>{product.name}</strong>
          </div>
          <div className={styles.infoRow}>
            <span>{t('insurance:contract.price', '价格')}</span>
            <strong>€{product.priceFrom} {t('insurance:contract.perYear', '/年')}</strong>
          </div>
          <div className={styles.infoRow}>
            <span>{t('insurance:contract.coverage', '保障范围')}</span>
            <strong>{product.minCoverage}-{product.maxCoverage} {t('insurance:card.coverageUnit')}</strong>
          </div>
        </section>
      )}

      {/* F-OP-002 车辆与车主信息预填确认 */}
      <section className={styles.card}>
        <div className={styles.cardTitle}>{t('insurance:contract.prefill', '车辆与车主信息')}</div>
        <div className={styles.infoRow}>
          <span>{t('insurance:contract.vehicle', '车辆')}</span>
          <strong>{vehicle ? `${vehicle.make} ${vehicle.model}` : '—'}</strong>
        </div>
        <div className={styles.infoRow}>
          <span>{t('insurance:contract.plate', '车牌')}</span>
          <strong>{vehicle?.plate ?? '—'}</strong>
        </div>
        <div className={styles.infoRow}>
          <span>{t('insurance:contract.vin', 'VIN码')}</span>
          <strong>{prefill.vin || vehicle?.vin || '—'}</strong>
        </div>
        <div className={styles.infoRow}>
          <span>{t('insurance:contract.ownerMobile', '车主手机号')}</span>
          <strong>{ownerMobile}</strong>
        </div>
      </section>

      <div className={styles.content} ref={contentRef}>
        {contractSections.length === 0 ? (
          <p>{t('insurance:contract.loading', '正在加载协议…')}</p>
        ) : (
          contractSections.map((s, i) => (
            <div key={i} className={styles.clause}>
              <h4>{s.title}</h4>
              <p>{s.body}</p>
            </div>
          ))
        )}
      </div>

      <div className={styles.footer}>
        <button onClick={() => navigate(-1)} className={styles.cancel}>{t('insurance:contract.back', '返回')}</button>
        <button disabled={!canConfirm || signing} className={styles.confirm} onClick={handleConfirm}>
          {signing
            ? t('insurance:contract.signing', '签署中…')
            : canConfirm
              ? t('insurance:contract.confirmPay', '确认并选择支付方式')
              : t('insurance:contract.readAll', '请阅读完整条款')}
        </button>
      </div>

      <PaymentMethodDrawer visible={visibleDrawer} onClose={() => setVisibleDrawer(false)} onPick={handlePick} />
    </div>
  )
}
