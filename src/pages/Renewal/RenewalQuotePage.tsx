import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PageHeader from '../../components/PageHeader/PageHeader'
import type { PolicyDetail } from '../../api/policy'
// Use persisted policies (localStorage) for renewal flows — do not import repo mockPolicyDetails
import { useUIStore } from '../../store/ui'
import { useLocale } from '../../i18n/useLocale'
import { formatCurrency, formatDate } from '../../utils/locale'
import { derivePolicyMeta } from '../../utils/renewal'
import styles from './RenewalQuotePage.module.css'

/**
 * 续保报价页：基于已购保单预填的"轻量版"询价单。
 *
 * 比 `InsuranceCheckoutPage` 大幅精简——续保时只确认：
 * 1. 起保日期 / 保额
 * 2. 联系人 + 自动续保开关
 * 3. 声明确认
 */

type FormState = {
  startDate: string
  coverage: string
  contactName: string
  contactPhone: string
  sameAsLastYear: boolean
  autoRenewal: boolean
  declarationConfirmed: boolean
}

const emptyForm: FormState = {
  startDate: '',
  coverage: '0',
  contactName: '',
  contactPhone: '',
  sameAsLastYear: true,
  autoRenewal: false,
  declarationConfirmed: false,
}

function prefillFromPolicy(detail: PolicyDetail): FormState {
  const next = new Date(detail.endDate)
  next.setDate(next.getDate() + 1)
  return {
    ...emptyForm,
    startDate: next.toISOString().slice(0, 10),
    coverage: String(detail.coverage),
  }
}

export default function RenewalQuotePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation(['renewal', 'errors', 'common', 'insurance'])
  const { locale } = useLocale()
  const addToast = useUIStore((s) => s.addToast)

  // Load policy from persisted storage rather than using repo mocks
  const detail = useMemo(() => {
    try {
      const raw = localStorage.getItem('policies')
      if (!raw) return undefined
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return undefined
      return parsed.find((p: any) => p.id === id)
    } catch (e) {
      return undefined
    }
  }, [id])

  const meta = useMemo(() => (detail ? derivePolicyMeta(detail) : null), [detail])

  const [form, setForm] = useState<FormState>(detail ? prefillFromPolicy(detail) : emptyForm)
  const [step, setStep] = useState(1)

  if (!detail || !meta) {
    return <div className={styles.page}>{t('errors:toast.policyNotFound')}</div>
  }

  const set = (key: keyof FormState, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const toggle = (key: keyof FormState) =>
    setForm((prev) => ({ ...prev, [key]: !prev[key] }))

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1)
      window.scrollTo({ top: 0 })
    } else {
      if (!form.declarationConfirmed) {
        addToast(t('errors:toast.checkoutDeclarationMissing'), 'error')
        return
      }
      addToast(t('renewal:quote.toast.submitted', { product: detail.productName }), 'success')
      navigate('/renewal')
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
        title={`${t('renewal:quote.title')} (${step}/3)`}
        showBack
        onBack={handleBack}
      />
      <div className={styles.content}>
        <section className={styles.banner}>
          <span className={styles.bannerEyebrow}>{detail.productName}</span>
          <h2 className={styles.bannerTitle}>{detail.policyNo}</h2>
          <p className={styles.bannerHint}>{t('renewal:quote.prefillNotice')}</p>
        </section>

        {step === 1 && <Step1 form={form} set={set} detail={detail} locale={locale} />}
        {step === 2 && <Step2 form={form} set={set} toggle={toggle} detail={detail} locale={locale} />}
        {step === 3 && <Step3 form={form} toggle={toggle} />}
      </div>
      <div className={styles.bottomBar}>
        {step > 1 && (
          <button className={styles.backBtn} onClick={handleBack}>{t('insurance:checkout.back')}</button>
        )}
        <button className={styles.payBtn} onClick={handleNext}>
          {step < 3 ? t('insurance:checkout.next') : t('renewal:quote.submit')}
        </button>
      </div>
    </div>
  )
}

type StepProps = {
  form: FormState
  set: (key: keyof FormState, value: string | boolean) => void
  toggle: (key: keyof FormState) => void
}

function Step1({ form, set, detail, locale }: Pick<StepProps, 'form' | 'set'> & { detail: PolicyDetail; locale: string }) {
  const { t } = useTranslation('renewal')
  return (
    <section className={styles.card}>
      <h3 className={styles.cardTitle}>{t('renewal:quote.sections.coverage')}</h3>
      <div className={styles.row}>
        <div className={styles.field}>
          <span className={styles.label}>{t('renewal:quote.fields.startDate')}</span>
          <input
            className={styles.input}
            type="date"
            value={form.startDate}
            onChange={(e) => set('startDate', e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <span className={styles.label}>{t('renewal:quote.fields.coverage')}</span>
          <input
            className={styles.input}
            type="number"
            value={form.coverage}
            onChange={(e) => set('coverage', e.target.value)}
          />
        </div>
      </div>
      <div className={styles.summaryRow}>
        <span>{t('renewal:quote.fields.lastYearPremium')}</span>
        <strong>{formatCurrency(detail.premium, locale)}</strong>
      </div>
      <div className={styles.summaryRow}>
        <span>{t('renewal:quote.fields.lastYearCoverage')}</span>
        <strong>{detail.coverage} k €</strong>
      </div>
    </section>
  )
}

function Step2({ form, set, toggle, detail, locale }: StepProps & { detail: PolicyDetail; locale: string }) {
  const { t } = useTranslation('renewal')
  return (
    <section className={styles.card}>
      <h3 className={styles.cardTitle}>{t('renewal:quote.sections.contact')}</h3>
      <div className={styles.field}>
        <span className={styles.label}>{t('renewal:quote.fields.contactName')}</span>
        <input
          className={styles.input}
          value={form.contactName}
          onChange={(e) => set('contactName', e.target.value)}
        />
      </div>
      <div className={styles.field}>
        <span className={styles.label}>{t('renewal:quote.fields.contactPhone')}</span>
        <input
          className={styles.input}
          value={form.contactPhone}
          onChange={(e) => set('contactPhone', e.target.value)}
        />
      </div>

      <CheckItem
        checked={form.sameAsLastYear}
        onChange={() => toggle('sameAsLastYear')}
        label={t('renewal:quote.fields.sameAsLastYear')}
      />
      <CheckItem
        checked={form.autoRenewal}
        onChange={() => toggle('autoRenewal')}
        label={t('renewal:quote.fields.autoRenewal')}
      />

      <div className={styles.summaryRow}>
        <span>{t('renewal:quote.fields.expiry')}</span>
        <strong>{formatDate(detail.endDate, locale)}</strong>
      </div>
    </section>
  )
}

function Step3({ form, toggle }: Pick<StepProps, 'form' | 'toggle'>) {
  const { t } = useTranslation('renewal')
  return (
    <section className={styles.card}>
      <h3 className={styles.cardTitle}>{t('renewal:quote.sections.declaration')}</h3>
      <CheckItem
        checked={form.declarationConfirmed}
        onChange={() => toggle('declarationConfirmed')}
        label={t('renewal:quote.declaration')}
      />
    </section>
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
