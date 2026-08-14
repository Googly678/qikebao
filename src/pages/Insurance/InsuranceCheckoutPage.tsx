import { useMemo, useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PageHeader from '../../components/PageHeader/PageHeader'
// Checkout should read product detail from persisted products (localStorage('products'))
import { useUIStore } from '../../store/ui'
import styles from './InsuranceCheckoutPage.module.css'

type FormState = {
  // Step 1 — 基本信息
  companyName: string
  employeeCount: string
  ownedVehicles: string
  lastYearRevenue: string
  estimatedRevenue: string
  maxClaimPerIncident: string
  startDate: string
  extColdChain: boolean
  extXinjiang: boolean
  extQinghai: boolean
  extTibet: boolean
  extOverload: boolean
  otherNeeds: string
  // Step 2 — 经营情况
  consignorOwner: boolean
  consignorLogistics: boolean
  consignorPlatform: boolean
  consigneeLogistics: boolean
  consigneeSubcontract: boolean
  consigneePlatformDriver: boolean
  consigneeSelfVehicle: boolean
  containerBizRatio: string
  goodsFragile: boolean
  goodsAutoParts: boolean
  goodsMachinery: boolean
  goodsSteel: boolean
  goodsFood: boolean
  goodsElectronics: boolean
  goodsSemiconductor: boolean
  routeYunnanGuizhou: boolean
  routeGansuNingxia: boolean
  routeInnerMongolia: boolean
  routeJilinHeilongjiang: boolean
  routeHainan: boolean
  routeSichuanChongqing: boolean
  // Step 3 — 出险情况
  policyNo2023: string
  insurer2023: string
  claimCount2023: string
  claimAmount2023: string
  policyNo2024: string
  insurer2024: string
  claimCount2024: string
  claimAmount2024: string
  policyNo2025: string
  insurer2025: string
  claimCount2025: string
  claimAmount2025: string
  useTMS: boolean
  useADAS: boolean
  declarationConfirmed: boolean
}

const initialForm: FormState = {
  companyName: '', employeeCount: '0', ownedVehicles: '0',
  lastYearRevenue: '0', estimatedRevenue: '0', maxClaimPerIncident: '0',
  startDate: new Date().toISOString().slice(0, 10),
  extColdChain: false, extXinjiang: false, extQinghai: false, extTibet: false, extOverload: false,
  otherNeeds: '',
  consignorOwner: false, consignorLogistics: false, consignorPlatform: false,
  consigneeLogistics: false, consigneeSubcontract: false, consigneePlatformDriver: false, consigneeSelfVehicle: false,
  containerBizRatio: '0',
  goodsFragile: false, goodsAutoParts: false, goodsMachinery: false, goodsSteel: false,
  goodsFood: false, goodsElectronics: false, goodsSemiconductor: false,
  routeYunnanGuizhou: false, routeGansuNingxia: false, routeInnerMongolia: false,
  routeJilinHeilongjiang: false, routeHainan: false, routeSichuanChongqing: false,
  policyNo2023: '', insurer2023: '', claimCount2023: '0', claimAmount2023: '0',
  policyNo2024: '', insurer2024: '', claimCount2024: '0', claimAmount2024: '0',
  policyNo2025: '', insurer2025: '', claimCount2025: '0', claimAmount2025: '0',
  useTMS: false, useADAS: false, declarationConfirmed: false,
}

export default function InsuranceCheckoutPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation(['insurance', 'errors', 'common'])
  const addToast = useUIStore((s) => s.addToast)
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

  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormState>(initialForm)
  const [prefill, setPrefill] = useState<{ vin?: string; mobile?: string; product_sku?: string; channel_id?: string } | null>(null)

  // load prefill set by PartnerLandingPage
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('prefill_order')
      if (raw) {
        const obj = JSON.parse(raw)
        setPrefill(obj)
      }
    } catch (e) {
      // ignore
    }
  }, [])

  if (!product) return <div>{t('errors:toast.productNotFound')}</div>

  const set = (key: keyof FormState, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const toggle = (key: keyof FormState) =>
    setForm((prev) => ({ ...prev, [key]: !prev[key] }))

  const handleNext = async () => {
    if (step < 3) {
      setStep(step + 1)
      window.scrollTo({ top: 0 })
      return
    }

    if (!form.declarationConfirmed) {
      addToast(t('errors:toast.checkoutDeclarationMissing'), 'error')
      return
    }

    // Prepare payment payload and redirect to a simulated payment page
    addToast(t('errors:toast.checkoutSubmitted'), 'info')
    try {
      const order_no = `ORD-${Date.now()}`
      const third_order_no = `THIRD-${Math.floor(Math.random() * 1000000)}`
      const pay_time = new Date().toISOString()
      const protocol_url = `${window.location.origin}/mock-documents/${order_no}.pdf` // demo URL
      const payload = {
        order_no,
        third_order_no,
        protocol_url,
        sign_time: pay_time,
        pay_time: pay_time,
        pay_status: 'PENDING',
        amount: 0,
        timestamp: Date.now(),
      }

      // Navigate to simulated payment page where user can click to complete payment.
      navigate('/payment', { state: payload })
    } catch (e) {
      addToast(t('errors:toast.paymentFailed') || '准备支付失败', 'error')
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
      window.scrollTo({ top: 0 })
    } else {
      navigate(-1)
    }
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title={t('insurance:checkout.title', { product: product.name, step, total: 3 })}
        showBack
        onBack={handleBack}
      />
      <div className={styles.content}>
        {step === 1 && <Step1 form={form} set={set} toggle={toggle} />}
        {step === 2 && <Step2 form={form} set={set} toggle={toggle} />}
        {step === 3 && <Step3 form={form} set={set} toggle={toggle} />}
      </div>
      <div className={styles.bottomBar}>
        {step > 1 && (
          <button className={styles.backBtn} onClick={handleBack}>{t('insurance:checkout.back')}</button>
        )}
        <button className={styles.payBtn} onClick={handleNext}>
          {step < 3 ? t('insurance:checkout.next') : t('insurance:checkout.submit')}
        </button>
      </div>
    </div>
  )
}

/* ──────── Step 1 ──────── */
function Step1({ form, set, toggle }: StepProps) {
  const { t } = useTranslation('insurance')
  return (
    <>
      <SectionTitle index={1} title={t('checkout.sections.basicInfo')} />
      <section className={styles.formSection}>
        <LabelInput
          label={t('checkout.fields.companyName')}
          value={form.companyName}
          onChange={(v) => set('companyName', v)}
          placeholder={t('checkout.fields.companyNamePlaceholder')}
        />
        <div className={styles.row2}>
          <LabelInput label={t('checkout.fields.employeeCount')} type="number" value={form.employeeCount} onChange={(v) => set('employeeCount', v)} />
          <LabelInput label={t('checkout.fields.ownedVehicles')} type="number" value={form.ownedVehicles} onChange={(v) => set('ownedVehicles', v)} />
        </div>
        <LabelInput
          label={t('checkout.fields.lastYearRevenue')}
          type="number"
          value={form.lastYearRevenue}
          onChange={(v) => set('lastYearRevenue', v)}
        />
        <LabelInput
          label={t('checkout.fields.estimatedRevenue')}
          type="number"
          value={form.estimatedRevenue}
          onChange={(v) => set('estimatedRevenue', v)}
        />
      </section>

      <SectionTitle index={2} title={t('checkout.sections.coreNeeds')} />
      <section className={styles.formSection}>
        <LabelInput
          label={t('checkout.fields.maxClaimPerIncident')}
          type="number"
          value={form.maxClaimPerIncident}
          onChange={(v) => set('maxClaimPerIncident', v)}
        />
        <LabelInput label={t('checkout.fields.startDate')} type="date" value={form.startDate} onChange={(v) => set('startDate', v)} />
        <div className={styles.checkGroupLabel}>{t('checkout.groups.extensions')}</div>
        <CheckItem checked={form.extColdChain} onChange={() => toggle('extColdChain')} label={t('checkout.options.extColdChain')} />
        <CheckItem checked={form.extXinjiang} onChange={() => toggle('extXinjiang')} label={t('checkout.options.extXinjiang')} />
        <CheckItem checked={form.extQinghai} onChange={() => toggle('extQinghai')} label={t('checkout.options.extQinghai')} />
        <CheckItem checked={form.extTibet} onChange={() => toggle('extTibet')} label={t('checkout.options.extTibet')} />
        <CheckItem checked={form.extOverload} onChange={() => toggle('extOverload')} label={t('checkout.options.extOverload')} />
        <div className={styles.checkGroupLabel} style={{ marginTop: 14 }}>{t('checkout.fields.otherNeeds')}</div>
        <textarea
          className={styles.textarea}
          value={form.otherNeeds}
          onChange={(e) => set('otherNeeds', e.target.value)}
          placeholder={t('checkout.fields.otherNeedsPlaceholder')}
          rows={4}
        />
      </section>
    </>
  )
}

/* ──────── Step 2 ──────── */
function Step2({ form, set, toggle }: StepProps) {
  const { t } = useTranslation('insurance')
  return (
    <>
      <SectionTitle index={3} title={t('checkout.sections.operation')} />
      <section className={styles.formSection}>
        <div className={styles.checkGroupLabel}>{t('checkout.groups.consignor')}</div>
        <CheckItem checked={form.consignorOwner} onChange={() => toggle('consignorOwner')} label={t('checkout.options.consignorOwner')} />
        <CheckItem checked={form.consignorLogistics} onChange={() => toggle('consignorLogistics')} label={t('checkout.options.consignorLogistics')} />
        <CheckItem checked={form.consignorPlatform} onChange={() => toggle('consignorPlatform')} label={t('checkout.options.consignorPlatform')} />

        <div className={styles.checkGroupLabel} style={{ marginTop: 16 }}>{t('checkout.groups.consignee')}</div>
        <CheckItem checked={form.consigneeLogistics} onChange={() => toggle('consigneeLogistics')} label={t('checkout.options.consigneeLogistics')} />
        <CheckItem checked={form.consigneeSubcontract} onChange={() => toggle('consigneeSubcontract')} label={t('checkout.options.consigneeSubcontract')} />
        <CheckItem checked={form.consigneePlatformDriver} onChange={() => toggle('consigneePlatformDriver')} label={t('checkout.options.consigneePlatformDriver')} />
        <CheckItem checked={form.consigneeSelfVehicle} onChange={() => toggle('consigneeSelfVehicle')} label={t('checkout.options.consigneeSelfVehicle')} />

        <div className={styles.checkGroupLabel} style={{ marginTop: 16 }}>{t('checkout.fields.containerBizRatio')}</div>
        <div className={styles.percentRow}>
          <input
            className={styles.fieldInput}
            style={{ flex: 1 }}
            type="number"
            value={form.containerBizRatio}
            onChange={(e) => set('containerBizRatio', e.target.value)}
          />
          <span className={styles.percentSign}>%</span>
        </div>

        <div className={styles.checkGroupLabel} style={{ marginTop: 16 }}>{t('checkout.groups.goodsType')}</div>
        <CheckItem checked={form.goodsFragile} onChange={() => toggle('goodsFragile')} label={t('checkout.options.goodsFragile')} />
        <CheckItem checked={form.goodsAutoParts} onChange={() => toggle('goodsAutoParts')} label={t('checkout.options.goodsAutoParts')} />
        <CheckItem checked={form.goodsMachinery} onChange={() => toggle('goodsMachinery')} label={t('checkout.options.goodsMachinery')} />
        <CheckItem checked={form.goodsSteel} onChange={() => toggle('goodsSteel')} label={t('checkout.options.goodsSteel')} />
        <CheckItem checked={form.goodsFood} onChange={() => toggle('goodsFood')} label={t('checkout.options.goodsFood')} />
        <CheckItem checked={form.goodsElectronics} onChange={() => toggle('goodsElectronics')} label={t('checkout.options.goodsElectronics')} />
        <CheckItem checked={form.goodsSemiconductor} onChange={() => toggle('goodsSemiconductor')} label={t('checkout.options.goodsSemiconductor')} />

        <div className={styles.checkGroupLabel} style={{ marginTop: 16 }}>{t('checkout.groups.route')}</div>
        <CheckItem checked={form.routeYunnanGuizhou} onChange={() => toggle('routeYunnanGuizhou')} label={t('checkout.options.routeYunnanGuizhou')} />
        <CheckItem checked={form.routeGansuNingxia} onChange={() => toggle('routeGansuNingxia')} label={t('checkout.options.routeGansuNingxia')} />
        <CheckItem checked={form.routeInnerMongolia} onChange={() => toggle('routeInnerMongolia')} label={t('checkout.options.routeInnerMongolia')} />
        <CheckItem checked={form.routeJilinHeilongjiang} onChange={() => toggle('routeJilinHeilongjiang')} label={t('checkout.options.routeJilinHeilongjiang')} />
        <CheckItem checked={form.routeHainan} onChange={() => toggle('routeHainan')} label={t('checkout.options.routeHainan')} />
        <CheckItem checked={form.routeSichuanChongqing} onChange={() => toggle('routeSichuanChongqing')} label={t('checkout.options.routeSichuanChongqing')} />
      </section>
    </>
  )
}

/* ──────── Step 3 ──────── */
function Step3({ form, set, toggle }: StepProps) {
  const { t } = useTranslation('insurance')
  const years = ['2023', '2024', '2025'] as const
  return (
    <>
      <SectionTitle index={4} title={t('checkout.sections.claimHistory')} />
      {years.map((year) => (
        <section key={year} className={styles.formSection}>
          <div className={styles.yearTitle}>{t('checkout.groups.year', { year })}</div>
          <LabelInput
            label={t('checkout.fields.policyNo', { year })}
            value={form[`policyNo${year}` as keyof FormState] as string}
            onChange={(v) => set(`policyNo${year}` as keyof FormState, v)}
            placeholder={t('checkout.fields.yearNotInsured')}
          />
          <LabelInput
            label={t('checkout.fields.insurer', { year })}
            value={form[`insurer${year}` as keyof FormState] as string}
            onChange={(v) => set(`insurer${year}` as keyof FormState, v)}
            placeholder={t('checkout.fields.yearNotInsured')}
          />
          <div className={styles.row2}>
            <LabelInput
              label={t('checkout.fields.claimCount', { year })}
              type="number"
              value={form[`claimCount${year}` as keyof FormState] as string}
              onChange={(v) => set(`claimCount${year}` as keyof FormState, v)}
            />
            <LabelInput
              label={t('checkout.fields.claimAmount', { year })}
              type="number"
              value={form[`claimAmount${year}` as keyof FormState] as string}
              onChange={(v) => set(`claimAmount${year}` as keyof FormState, v)}
            />
          </div>
        </section>
      ))}

      <SectionTitle index={5} title={t('checkout.sections.extra')} />
      <section className={styles.formSection}>
        <CheckItem checked={form.useTMS} onChange={() => toggle('useTMS')} label={t('checkout.options.useTMS')} />
        <CheckItem checked={form.useADAS} onChange={() => toggle('useADAS')} label={t('checkout.options.useADAS')} />
      </section>

      <SectionTitle index={6} title={t('checkout.sections.declaration')} />
      <section className={styles.formSection}>
        <CheckItem
          checked={form.declarationConfirmed}
          onChange={() => toggle('declarationConfirmed')}
          label={t('checkout.declaration')}
        />
      </section>
    </>
  )
}

/* ──────── Shared helpers ──────── */
type StepProps = {
  form: FormState
  set: (key: keyof FormState, value: string | boolean) => void
  toggle: (key: keyof FormState) => void
}

function SectionTitle({ index, title }: { index: number; title: string }) {
  return (
    <div className={styles.sectionHeader}>
      <span className={styles.sectionIndex}>{index}</span>
      <span className={styles.sectionTitleText}>{title}</span>
    </div>
  )
}

function CheckItem({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label className={styles.checkItem} onClick={onChange}>
      <span className={`${styles.checkbox} ${checked ? styles.checkboxChecked : ''}`} />
      <span className={styles.checkLabel}>{label}</span>
    </label>
  )
}

function LabelInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <input
        className={styles.fieldInput}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  )
}
