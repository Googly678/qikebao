import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PageHeader from '../../components/PageHeader/PageHeader'
import MandatoryReadModal from '../../components/MandatoryReadModal/MandatoryReadModal'
import { canonicalQuery } from '../../utils/crypto'
import { API_BASE, PARTNER_LANDING_PATH, DEFAULT_CHANNEL_ID } from '../../config'
import { useIMStore } from '../../store/im'
// Detail data should come from persisted products list (localStorage) to avoid showing repo mocks
import { useLocale } from '../../i18n/useLocale'
import { useTaxonomy } from '../../hooks/useTaxonomy'
import type { LocaleCode } from '../../api/insurance'
import styles from './InsuranceDetailPage.module.css'

const TABS = [
  { key: 'introduction', labelKey: 'tabs.introduction' },
  { key: 'coverage', labelKey: 'tabs.coverage' },
  { key: 'notice', labelKey: 'tabs.notice' },
  { key: 'specialTerms', labelKey: 'tabs.specialTerms' },
  { key: 'disclosure', labelKey: 'tabs.disclosure' },
  { key: 'samplePolicyUrl', labelKey: 'tabs.samplePolicy' },
] as const

type TabKey = typeof TABS[number]['key']

export default function InsuranceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation(['insurance', 'errors'])
  const { locale } = useLocale()
  const taxonomy = useTaxonomy()
  const openIM = useIMStore((s) => s.openIM)
  const [activeTab, setActiveTab] = useState<TabKey>('introduction')
  const [showReadModal, setShowReadModal] = useState(false)

  const detail = useMemo(() => {
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

  if (!detail) return <div>{t('errors:toast.productNotFound')}</div>

  // 详情 HTML 字段是「按 locale 索引」的对象，渲染时取当前 locale
  // i18n 选 es-ES / en-ES 都用 'es-ES'（broker 文案两语共享同套 HTML）
  const detailLocale: LocaleCode = locale === 'zh-CN' ? 'zh-CN' : 'es-ES'

  return (
    <div className={styles.page}>
      <PageHeader title={t('insurance:detail.title')} showBack />
      <div className={styles.content}>
        <section className={styles.heroCard}>
          <span className={styles.insurer}>{taxonomy.insurer(detail.insurer)}</span>
          <h2 className={styles.productName}>{detail.name}</h2>
          <p className={styles.summary}>{detail.summary}</p>
          <div className={styles.heroMeta}>
            <span>{taxonomy.category(detail.category)}</span>
            <span>{taxonomy.subject(detail.subject)}</span>
            <strong>{detail.minCoverage}-{detail.maxCoverage} {t('insurance:card.coverageUnit')}</strong>
          </div>
        </section>

        <div className={styles.tabBar}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`${styles.tabBtn} ${activeTab === tab.key ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {t(`insurance:detail.${tab.labelKey}`)}
            </button>
          ))}
        </div>

        <section className={styles.tabContent}>
          {activeTab === 'samplePolicyUrl' ? (
            <a className={styles.sampleLink} href={detail.samplePolicyUrl} target="_blank" rel="noreferrer">
              {t('insurance:detail.viewSample')}
            </a>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: (detail[activeTab] && typeof detail[activeTab] === 'object' ? (detail[activeTab][detailLocale] || '') : '') }} />
          )}
        </section>
      </div>

      <div className={styles.bottomBar}>
        <button className={styles.secondaryBtn} onClick={() => openIM('insure-service')}>{t('insurance:detail.consult')}</button>
        <button className={styles.primaryBtn} onClick={() => setShowReadModal(true)}>{t('insurance:detail.insure')}</button>
      </div>

      {showReadModal && (
        <MandatoryReadModal
          title={t('insurance:detail.insure')}
        content={(detail.disclosure && detail.disclosure[detailLocale] ? detail.disclosure[detailLocale] : '') + (detail.notice && detail.notice[detailLocale] ? detail.notice[detailLocale] : '')}
          onCancel={() => setShowReadModal(false)}
          onConfirm={() => {
            // Per new flow: close modal and navigate to internal confirm-vehicle page (no inquiry/redirect)
            setShowReadModal(false)
            navigate(`/insurance/${detail.id}/confirm-vehicle`)
          }}
        />
      )}
    </div>
  )
}
