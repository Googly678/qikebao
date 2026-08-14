import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PageHeader from '../../components/PageHeader/PageHeader'
import { useLocale } from '../../i18n/useLocale'
// Read policies from localStorage for renewal compare — avoid rendering repo mocks
import { formatCurrency } from '../../utils/locale'
import styles from './RenewalQuotePage.module.css'

/**
 * 续保对比页：把"上年保单"与"本次报价"（mock 演示）两列对比。
 *
 * 字段：
 *  - 保额（coverage）
 *  - 保费（premium）
 *  - 免赔额（franchise — 演示 mock，0/200 切换）
 *  - 扩展责任（extensions — 演示 mock，新增/移除）
 *
 * 注：真实场景里"本次报价"来自报价服务；这里用 mock 派生：
 *  - 30 天桶：保费 +5%，新增「临时仓储扩展」
 *  - 60 天桶：保费 +0%，免赔额 200 → 100
 *  - 90 天桶：保费 -3%，移除「冷链扩展」
 */

interface ProposedQuote {
  coverage: number
  premium: number
  franchise: number
  extensions: string[]
  removedExtensions: string[]
}

function deriveProposedQuote(detailId: string, baseCoverage: number, basePremium: number, bucket: number | null): ProposedQuote {
  if (bucket === 30) {
    return {
      coverage: baseCoverage,
      premium: Math.round(basePremium * 1.05),
      franchise: 0,
      extensions: ['warehouse-temp'],
      removedExtensions: [],
    }
  }
  if (bucket === 60) {
    return {
      coverage: baseCoverage,
      premium: basePremium,
      franchise: 100,
      extensions: [],
      removedExtensions: [],
    }
  }
  if (bucket === 90) {
    return {
      coverage: baseCoverage,
      premium: Math.round(basePremium * 0.97),
      franchise: 0,
      extensions: [],
      removedExtensions: ['cold-chain'],
    }
  }
  return {
    coverage: baseCoverage,
    premium: basePremium,
    franchise: 0,
    extensions: [],
    removedExtensions: [],
  }
}

export default function RenewalComparePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation(['renewal', 'errors', 'common'])
  const { locale } = useLocale()

  // Read policy details from persisted policies (localStorage) instead of repo mocks
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

  const { old, proposal, deltaPremium, deltaPct } = useMemo(() => {
    if (!detail) {
      return { old: null, proposal: null, deltaPremium: 0, deltaPct: 0 }
    }
    // 借用 detail.coverage 与 premium 推断 bucket
    const now = new Date()
    const end = new Date(detail.endDate)
    const days = Math.round((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const bucket = days <= 30 ? 30 : days <= 60 ? 60 : days <= 90 ? 90 : null
    const proposal = deriveProposedQuote(detail.id, detail.coverage, detail.premium, bucket)
    const delta = proposal.premium - detail.premium
    const pct = detail.premium === 0 ? 0 : Math.round((delta / detail.premium) * 100)
    return { old: detail, proposal, deltaPremium: delta, deltaPct: pct }
  }, [detail])

  if (!old || !proposal) {
    return <div className={styles.page}>{t('errors:toast.policyNotFound')}</div>
  }

  const deltaPositive = deltaPremium > 0
  const deltaZero = deltaPremium === 0

  return (
    <div className={styles.page}>
      <PageHeader title={t('renewal:compare.title')} showBack onBack={() => navigate(`/policy/${id}/renew`)} />
      <div className={styles.content}>
        {/* 保费总览卡 */}
        <section className={styles.banner}>
          <span className={styles.bannerEyebrow}>{t('renewal:compare.new')}</span>
          <h2 className={styles.bannerTitle}>
            {formatCurrency(proposal.premium, locale)}
            {!deltaZero && (
              <span className={deltaPositive ? styles.deltaUp : styles.deltaDown}>
                {deltaPositive ? '+' : ''}
                {deltaPremium.toLocaleString(locale)} € ({deltaPositive ? '+' : ''}{deltaPct}%)
              </span>
            )}
          </h2>
        </section>

        {/* 字段对比 */}
        <section className={styles.card}>
          <CompareRow
            label={t('renewal:compare.fields.coverage')}
            oldValue={`${old.coverage} k €`}
            newValue={`${proposal.coverage} k €`}
            same={old.coverage === proposal.coverage}
          />
          <CompareRow
            label={t('renewal:compare.fields.premium')}
            oldValue={formatCurrency(old.premium, locale)}
            newValue={formatCurrency(proposal.premium, locale)}
            same={old.premium === proposal.premium}
          />
          <CompareRow
            label={t('renewal:compare.fields.franchise')}
            oldValue={`${formatCurrency(0, locale)}`}
            newValue={`${formatCurrency(proposal.franchise, locale)}`}
            same={proposal.franchise === 0}
          />
          <CompareRow
            label={t('renewal:compare.fields.extensions')}
            oldValue=""
            newValue={renderExtensions(proposal, t)}
            same={proposal.extensions.length === 0 && proposal.removedExtensions.length === 0}
            noDiffText={t('renewal:compare.noDiff')}
          />
        </section>
      </div>

      <div className={styles.bottomBar}>
        <button className={styles.backBtn} onClick={() => navigate('/renewal')}>
          {t('renewal:compare.back')}
        </button>
        <button className={styles.payBtn} onClick={() => navigate(`/policy/${id}/renew`)}>
          {t('renewal:quote.title')}
        </button>
      </div>
    </div>
  )
}

interface CompareRowProps {
  label: string
  oldValue: string
  newValue: string
  same: boolean
  noDiffText?: string
}

function CompareRow({ label, oldValue, newValue, same, noDiffText }: CompareRowProps) {
  return (
    <div className={styles.summaryRow}>
      <span style={{ flex: '0 0 100px' }}>{label}</span>
      <div className={styles.compareRow}>
        <span className={`${styles.compareCell} ${styles.compareCellOld}`}>{oldValue || '—'}</span>
        <span className={`${styles.compareCell} ${styles.compareCellNew} ${same ? styles.compareCellSame : ''}`}>
          {same && noDiffText ? noDiffText : newValue}
        </span>
      </div>
    </div>
  )
}

function renderExtensions(proposal: ProposedQuote, _t: ReturnType<typeof useTranslation>['t']) {
  const parts: string[] = []
  proposal.extensions.forEach((ext) => parts.push(`+ ${ext}`))
  proposal.removedExtensions.forEach((ext) => parts.push(`- ${ext}`))
  if (parts.length === 0) return '—'
  return parts.join(', ')
}
