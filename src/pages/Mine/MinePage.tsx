import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/auth'
import { useUIStore } from '../../store/ui'
import { useEffect, useState } from 'react'
import styles from './MinePage.module.css'

export default function MinePage() {
  const navigate = useNavigate()
  const { t } = useTranslation(['mine', 'common'])
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const userInfo = useAuthStore((s) => s.userInfo)
  const addToast = useUIStore((s) => s.addToast)
  const [vehicleCount, setVehicleCount] = useState(0)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('boundVehicles')
      if (raw) setVehicleCount(JSON.parse(raw).length || 0)
    } catch (e) {
      setVehicleCount(0)
    }
  }, [])

  const handleLogout = () => {
    const confirmed = window.confirm(t('common:actions.logoutConfirm'))
    if (!confirmed) return
    clearAuth()
    addToast(t('common:actions.loggedOut'), 'success')
  }

  return (
    <div className={styles.page}>
      <section className={styles.profileHero}>
        <div className={styles.avatar}>{userInfo?.name.slice(0, 1) ?? ''}</div>
        <h1 className={styles.userName}>{userInfo?.name ?? ''}</h1>
        <p className={styles.companyName}>{vehicleCount > 0 ? `${vehicleCount} 辆` : t('mine:menu.vehicles', '车辆信息')}</p>
      </section>

      <section className={styles.group}>
        <button className={styles.item} onClick={() => navigate('/renewal')}>
          <span>{t('mine:menu.renewal')}</span>
          <Arrow />
        </button>
        <button className={styles.item} onClick={() => navigate('/mine/vehicles')}>
          <span>{t('mine:menu.vehicles', '车辆信息')}</span>
          <Arrow />
        </button>
        <button className={styles.item} onClick={() => navigate('/mine/account')}>
          <span>{t('mine:menu.accountInfo')}</span>
          <Arrow />
        </button>
      </section>

      <section className={styles.group}>
        <button className={styles.item} onClick={() => navigate('/mine/settings')}>
          <span>{t('mine:menu.settings')}</span>
          <Arrow />
        </button>
        <button className={styles.item} onClick={() => navigate('/mine/password')}>
          <span>{t('mine:menu.password')}</span>
          <Arrow />
        </button>
      </section>

      <section className={styles.group}>
        <button className={`${styles.item} ${styles.logout}`} onClick={handleLogout}>
          <span>{t('mine:menu.logout')}</span>
        </button>
      </section>
    </div>
  )
}

function Arrow() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M7 4l5 5-5 5" stroke="rgba(0,0,0,0.24)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
