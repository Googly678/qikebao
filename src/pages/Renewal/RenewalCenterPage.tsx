import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PageHeader from '../../components/PageHeader/PageHeader'
// Use persisted demo policies (localStorage) rather than shipping mock data in the Renewal Center
import { derivePolicyMeta } from '../../utils/renewal'
import { useLocale } from '../../i18n/useLocale'
import { useTaxonomy } from '../../hooks/useTaxonomy'
import { formatDate } from '../../utils/locale'
import styles from './RenewalCenterPage.module.css'

export default function RenewalCenterPage() {
  const navigate = useNavigate()
  const { t } = useTranslation('renewal')
  const { locale } = useLocale()
  const taxonomy = useTaxonomy()

  // 把保单按到期日排序，并按续保窗口分桶
  // 使用 localStorage 中的 policies（由模拟支付写入）以避免在中心页面展示硬编码 mock 数据
  const enriched = useMemo(() => {
    try {
      const raw = localStorage.getItem('policies')
      if (!raw) return []
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return []
      return parsed
        .map((p: any) => ({ policy: p, meta: derivePolicyMeta(p) }))
        .filter((x: any) => x.meta.renewalStatus === 'eligible' || x.meta.renewalStatus === 'lapsed')
        .sort((a: any, b: any) => a.meta.daysToExpire - b.meta.daysToExpire)
    } catch (e) {
      console.warn('Failed to parse policies from localStorage', e)
      return []
    }
  }, [])

  const buckets = useMemo(() => {
    return {
      30: enriched.filter((x: any) => x.meta.renewalBucket === 30 || (x.meta.renewalStatus === 'lapsed' && x.meta.daysToExpire >= -30)).length,
      60: enriched.filter((x: any) => x.meta.renewalBucket === 60).length,
      90: enriched.filter((x: any) => x.meta.renewalBucket === 90).length,
    }
  }, [enriched])

  const expectedPremium = enriched.reduce((sum: number, x: any) => sum + (x.policy?.premium || 0), 0)

  return (
    <div className={styles.page}>
      <PageHeader title={t('center.title')} showBack />
      <div className={styles.content}>
        <p className={styles.subtitle}>{t('center.subtitle')}</p>

        {/* KPI 卡片 */}
        <section className={styles.kpiRow}>
          <KpiCard label={t('center.kpi.expiring30')} value={buckets[30]} accent="danger" />
          <KpiCard label={t('center.kpi.expiring60')} value={buckets[60]} accent="warn" />
          <KpiCard label={t('center.kpi.expiring90')} value={buckets[90]} accent="info" />
        </section>

        <section className={styles.kpiRowSecondary}>
          <div className={styles.kpiSecondary}>
            <span className={styles.kpiSecondaryLabel}>{t('center.kpi.expectedPremium')}</span>
            <strong className={styles.kpiSecondaryValue}>{expectedPremium.toLocaleString(locale)} €</strong>
          </div>
        </section>

        {/* 列表 */}
        {enriched.length === 0 ? (
          <p className={styles.empty}>{t('center.empty')}</p>
        ) : (
          <div className={styles.list}>
            {enriched.map(({ policy, meta }) => (
              <article key={policy.id} className={styles.card}>
                <header className={styles.cardHeader}>
                  <div>
                    <h2 className={styles.cardTitle}>{policy.productName}</h2>
                    <p className={styles.cardPolicyNo}>{policy.policyNo}</p>
                  </div>
                  <span
                    className={`${styles.daysTag} ${
                      meta.renewalStatus === 'lapsed'
                        ? styles.daysTagLapsed
                        : meta.renewalBucket === 30
                        ? styles.daysTagDanger
                        : meta.renewalBucket === 60
                        ? styles.daysTagWarn
                        : styles.daysTagInfo
                    }`}
                  >
                    {t('center.list.daysLeft', { count: meta.daysToExpire })}
                  </span>
                </header>

                <div className={styles.infoRow}>
                  <span>{t('center.list.insurer')}</span>
                  <strong>{taxonomy.insurer(policy.insurer)}</strong>
                </div>
                <div className={styles.infoRow}>
                  <span>{t('center.list.expiry')}</span>
                  <strong>{formatDate(policy.endDate, locale)}</strong>
                </div>
                <div className={styles.infoRow}>
                  <span>{t('center.list.lastYearPremium')}</span>
                  <strong>{policy.premium.toLocaleString(locale)} €</strong>
                </div>

                <div className={styles.cardActions}>
                  <button
                    className={styles.secondaryBtn}
                    onClick={() => navigate(`/policy/${policy.id}/renew/compare`)}
                  >
                    {t('center.list.actions.compare')}
                  </button>
                  <button
                    className={styles.primaryBtn}
                    onClick={() => navigate(`/policy/${policy.id}/renew`)}
                  >
                    {t('center.list.actions.renew')}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface KpiCardProps {
  label: string
  value: number
  accent: 'danger' | 'warn' | 'info'
}

function KpiCard({ label, value, accent }: KpiCardProps) {
  return (
    <div className={`${styles.kpi} ${styles[`kpi-${accent}`]}`}>
      <span className={styles.kpiValue}>{value}</span>
      <span className={styles.kpiLabel}>{label}</span>
    </div>
  )
}
