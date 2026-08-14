import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PageHeader from '../../components/PageHeader/PageHeader'
// Removed mock data usage per request: claims creation should not prefill with mock policies or claim types
import { useUIStore } from '../../store/ui'
import { useLocale } from '../../i18n/useLocale'
import { useTaxonomy } from '../../hooks/useTaxonomy'
import styles from './ClaimCreatePage.module.css'

interface ClaimCreateLocationState {
  policyId?: string
  policyNo?: string
  productName?: string
  insuredName?: string
  category?: string
}

// 各语种下报案联系人的默认姓名 + 电话（与 mock user 对齐）
const DEFAULT_CONTACT: Record<string, { name: string; phone: string }> = {
  'zh-CN': { name: '', phone: '' },
  'es-ES': { name: '', phone: '' },
  'en-ES': { name: '', phone: '' },
}

// 理赔类型 key —— 展示文案由 i18n `claims:create.types.*` 提供
const CLAIM_TYPES = [
  'cargo-damage', 'theft', 'third-party-liability', 'workplace-injury', 'vehicle-damage',
  'customer-slip', 'food-poisoning', 'employee-cut', 'water-damage', 'breakage', 'fire', 'cyber-incident',
] as const

export default function ClaimCreatePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation(['claims', 'errors'])
  const { locale } = useLocale()
  const taxonomy = useTaxonomy()
  const addToast = useUIStore((state) => state.addToast)
  const state = (location.state as ClaimCreateLocationState | null) ?? null

  const initialPolicyId = state?.policyId ?? ''
  const initialContact = DEFAULT_CONTACT[locale] ?? DEFAULT_CONTACT['es-ES']
  const [policyId, setPolicyId] = useState(initialPolicyId)
  const [claimType, setClaimType] = useState<string>('')
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().slice(0, 10))
  const [lossDescription, setLossDescription] = useState('')
  const [contactName, setContactName] = useState(initialContact.name)
  const [contactPhone, setContactPhone] = useState(initialContact.phone)

  // 已购保单来自 localStorage('policies')，由支付流程写入
  const policies = useMemo(() => {
    try {
      const raw = localStorage.getItem('policies')
      const arr = raw ? JSON.parse(raw) : []
      return Array.isArray(arr) ? arr : []
    } catch (e) {
      return []
    }
  }, [])

  const selectedPolicy = useMemo(
    () => policies.find((p: any) => String(p.id) === String(policyId)) ?? null,
    [policyId, policies],
  )

  const makeId = () => {
    try {
      if (typeof crypto !== 'undefined' && (crypto as any).randomUUID) return (crypto as any).randomUUID()
    } catch (e) { /* ignore */ }
    return `c-${Date.now()}-${Math.floor(Math.random() * 1e6)}`
  }

  const submitApplication = () => {
    if (!selectedPolicy || !claimType || !incidentDate || !lossDescription.trim() || !contactName.trim() || !contactPhone.trim()) {
      addToast(t('errors:toast.claimIncomplete'), 'error')
      return
    }

    const claim = {
      id: makeId(),
      claimNo: `CL-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      insuredName: selectedPolicy.insuredName || contactName,
      claimType,
      policyNo: selectedPolicy.policyNo,
      category: '延保',
      reportDate: new Date().toISOString(),
      status: 'pending',
      progress: 5,
      lossItems: [],
      lossAssessment: '',
      progressSteps: [
        { step: 'report', date: new Date().toISOString(), status: 'active' },
        { step: 'onsite', date: '', status: 'pending' },
        { step: 'assess', date: '', status: 'pending' },
        { step: 'review', date: '', status: 'pending' },
        { step: 'payout', date: '', status: 'pending' },
      ],
      attachments: [],
    }

    try {
      const existing = JSON.parse(localStorage.getItem('claims') || '[]')
      const list = Array.isArray(existing) ? existing : []
      list.unshift(claim)
      localStorage.setItem('claims', JSON.stringify(list))
    } catch (e) {
      // ignore storage errors
    }

    addToast(t('errors:toast.claimSubmitted', { policyNo: selectedPolicy.policyNo }), 'success')
    navigate('/claims')
  }

  return (
    <div className={styles.page}>
      <PageHeader title={t('claims:create.title')} showBack />

      <div className={styles.content}>
        <section className={styles.summaryCard}>
          <span className={styles.summaryEyebrow}>{t('claims:create.summary.eyebrow')}</span>
          <h2 className={styles.summaryTitle}>{selectedPolicy?.productName ?? state?.productName ?? t('claims:create.summary.selectPolicy')}</h2>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryItem}><span>{t('claims:create.summary.policyNo')}</span><strong>{selectedPolicy?.policyNo ?? state?.policyNo ?? '-'}</strong></div>
            <div className={styles.summaryItem}><span>{t('claims:create.summary.insured')}</span><strong>{selectedPolicy?.insuredName ?? state?.insuredName ?? '-'}</strong></div>
            <div className={styles.summaryItem}><span>{t('claims:create.summary.category')}</span><strong>{selectedPolicy?.category ? taxonomy.category(selectedPolicy.category) : (state?.category ?? '-')}</strong></div>
            <div className={styles.summaryItem}><span>{t('claims:create.summary.remainingCoverage')}</span><strong>{selectedPolicy?.remainingCoverage ?? '-'} {t('policy:detail.currency')}</strong></div>
          </div>
        </section>

        <section className={styles.formCard}>
          <h3 className={styles.sectionTitle}>{t('claims:create.sectionTitle')}</h3>

          <label className={styles.field}>
            <span className={styles.label}>{t('claims:create.fields.policy')}</span>
            <select className={styles.select} value={policyId} onChange={(event) => setPolicyId(event.target.value)}>
              <option value="" disabled>
                {policies.length === 0 ? t('claims:create.noPolicies', '暂无关联保单') : t('claims:create.selectPolicy', '请选择保单')}
              </option>
              {policies.map((p: any) => (
                <option key={p.id} value={p.id}>{p.policyNo} · {p.productName}</option>
              ))}
            </select>
          </label>

          <div className={styles.row}>
            <label className={styles.field}>
              <span className={styles.label}>{t('claims:create.fields.claimType')}</span>
              <select className={styles.select} value={claimType} onChange={(event) => setClaimType(event.target.value)}>
                <option value="" disabled>{t('claims:create.selectClaimType', '请选择理赔类型')}</option>
                {CLAIM_TYPES.map((ct) => (
                  <option key={ct} value={ct}>{t(`claims:create.types.${ct}`)}</option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>{t('claims:create.fields.incidentDate')}</span>
              <input className={styles.input} type="date" value={incidentDate} onChange={(event) => setIncidentDate(event.target.value)} />
            </label>
          </div>

          <label className={styles.field}>
            <span className={styles.label}>{t('claims:create.fields.lossDescription')}</span>
            <textarea
              className={styles.textarea}
              value={lossDescription}
              onChange={(event) => setLossDescription(event.target.value)}
              placeholder={t('claims:create.fields.lossDescriptionPlaceholder')}
              rows={5}
            />
          </label>

          <div className={styles.row}>
            <label className={styles.field}>
              <span className={styles.label}>{t('claims:create.fields.contactName')}</span>
              <input className={styles.input} value={contactName} onChange={(event) => setContactName(event.target.value)} />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>{t('claims:create.fields.contactPhone')}</span>
              <input className={styles.input} value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} />
            </label>
          </div>
        </section>
      </div>

      <div className={styles.bottomBar}>
        <button className={styles.ghostBtn} onClick={() => navigate(-1)}>{t('claims:create.cancel')}</button>
        <button className={styles.primaryBtn} onClick={submitApplication}>{t('claims:create.submit')}</button>
      </div>
    </div>
  )
}