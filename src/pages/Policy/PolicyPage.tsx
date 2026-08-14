import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './PolicyPage.module.css'

export default function PolicyPage() {
  const { t } = useTranslation(['policy', 'common'])
  const [keyword] = useState('')

  // Load persisted policies from localStorage (added by mock payment flow)
  const list: any[] = (() => {
    try {
      const fromStorage = JSON.parse(localStorage.getItem('policies') || '[]')
      return Array.isArray(fromStorage) ? fromStorage : []
    } catch (e) {
      return []
    }
  })()

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [category, setCategory] = useState('all')
  const filtered = list.filter((p) => {
    if (status !== 'all') {
      const isActive = new Date(p.endDate) > new Date()
      if (status === 'active' && !isActive) return false
      if (status === 'expired' && isActive) return false
    }
    if (category !== 'all') {
      // simple category filter: check productName for keyword
      if (!((p.productName || '').toLowerCase().includes('延保'))) return false
    }
    if (!search) return true
    return (`${p.productName} ${p.policyNo} ${p.insuredName}`).toLowerCase().includes(search.toLowerCase())
  })

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <h1 className={styles.pageTitle}>{t('policy:pageTitle')}</h1>
        <p className={styles.pageSubtitle}>{t('policy:pageSubtitle')}</p>
      </div>

      <div className={styles.searchSection}>
        <input className={styles.searchInput} placeholder={t('policy:searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={styles.select}>
          <option value="all">全部产品</option>
          <option value="yanbao">延保类</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={styles.select}>
          <option value="all">全部</option>
          <option value="active">有效</option>
          <option value="expired">已过期</option>
        </select>
      </div>

      <div className={styles.list}>
        {filtered.length === 0 ? (
          <div className={styles.emptyArea}>{t('policy:empty.noPolicies', '暂无保单')}</div>
        ) : (
          filtered.map((p) => (
            <button key={p.id} className={styles.card} onClick={() => window.location.href = `/policy/${p.id}/document`}>
              <div className={styles.cardHead}>
                <div>
                  <span className={styles.insurer}>{p.productName}</span>
                  <h2 className={styles.cardTitle}>{p.policyNo}</h2>
                </div>
                <span className={styles.price}>{p.startDate} - {p.endDate}</span>
              </div>
              <p className={styles.summary}>{p.insuredName}</p>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
