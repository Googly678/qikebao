import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import SearchBar from '../../components/SearchBar/SearchBar'
import { useLocale } from '../../i18n/useLocale'
import { formatDate } from '../../utils/locale'
import styles from './ClaimsPage.module.css'

// 理赔状态 → CSS class（暖色语义色，见 appledesign.md 第 2 节）
const STATUS_CLASS: Record<string, string> = {
  pending: 'pending',
  reviewing: 'reviewing',
  approved: 'approved',
  paid: 'paid',
  rejected: 'rejected',
}

// 理赔状态 → common.status 文案键（pending 用「待处理」而非「待生效」）
const COMMON_STATUS: Record<string, string> = {
  pending: 'pending_claim',
  reviewing: 'reviewing',
  approved: 'approved',
  paid: 'paid',
  rejected: 'rejected',
}

export default function ClaimsPage() {
  const navigate = useNavigate()
  const { t } = useTranslation(['claims', 'common'])
  const { locale } = useLocale()
  const [keyword, setKeyword] = useState('')

  // Read persisted claims from localStorage('claims') — created by ClaimCreatePage
  const list = useMemo(() => {
    try {
      const raw = localStorage.getItem('claims')
      const arr = raw ? JSON.parse(raw) : []
      if (!Array.isArray(arr)) return []
      if (!keyword) return arr
      return arr.filter((c: any) =>
        [c.claimNo, c.policyNo, c.insuredName, c.claimType].join(' ').toLowerCase().includes(keyword.toLowerCase())
      )
    } catch (e) {
      return []
    }
  }, [keyword])

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <h1 className={styles.pageTitle}>{t('claims:pageTitle')}</h1>
        <p className={styles.pageSubtitle}>{t('claims:pageSubtitle')}</p>
        <button className={styles.primaryAction} onClick={() => navigate('/claims/new')}>
          {t('claims:newClaim')}
        </button>
      </section>

      <div className={styles.searchSection}>
        <SearchBar placeholder={t('claims:searchPlaceholder')} onChange={setKeyword} />
      </div>

      <div className={styles.list}>
        {list.length === 0 ? (
          <div className={styles.emptyArea}>{t('claims:empty.noClaims', '暂无理赔记录')}</div>
        ) : (
          list.map((item: any) => (
            <button key={item.id} className={styles.card} onClick={() => navigate(`/claims/${item.id}`)}>
              <div className={styles.cardTop}>
                <div>
                  <div className={styles.claimNo}>{item.claimNo}</div>
                  <div className={styles.claimMeta}>
                    {item.policyNo} · {t(`claims:create.types.${item.claimType}`, { defaultValue: item.claimType })}
                  </div>
                </div>
                <span className={`${styles.statusTag} ${styles[STATUS_CLASS[item.status] || 'pending']}`}>
                  {t(`common:status.${COMMON_STATUS[item.status] || 'pending_claim'}`)}
                </span>
              </div>

              <div className={styles.progressBar}>
                <span className={styles.progressInner} style={{ width: `${item.progress ?? 0}%` }} />
              </div>

              <div className={styles.cardFooter}>
                <span>{t('claims:card.reportDate')}: {formatDate(item.reportDate, locale)}</span>
                <span className={styles.arrow}>{t('claims:card.view')} →</span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
