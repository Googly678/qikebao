import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useIMStore } from '../../store/im'
import styles from './BottomNav.module.css'

// SVG Icons
function IconMessages({ active }: { active: boolean }) {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none">
      <path d="M20 2H4C2.9 2 2 2.9 2 4v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

function IconPolicy({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="2" width="16" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.12 : 0} />
      <line x1="8" y1="8" x2="16" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8" y1="16" x2="13" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconInsurance({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
      <path d="M14 2L4 7v8c0 5.25 4.295 10.16 10 11.38C19.705 25.16 24 20.25 24 15V7L14 2z"
        fill={active ? 'currentColor' : 'rgba(0,0,0,0.08)'}
        stroke="currentColor"
        strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9.5 14l3 3 6-6" stroke={active ? 'var(--color-ivory)' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconClaims({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.12 : 0} />
      <line x1="12" y1="7" x2="12" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="16.5" r="1" fill="currentColor" />
    </svg>
  )
}

function IconMine({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.12 : 0} />
      <path d="M4 20c0-4 3.582-6 8-6s8 2 8 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

const tabs = [
{ to: '/insurance', labelKey: 'tabs.insurance', ns: 'nav', Icon: IconInsurance },
{ to: '/policy', labelKey: 'tabs.policy', ns: 'nav', Icon: IconPolicy },
{ to: '/claims', labelKey: 'tabs.claims', ns: 'nav', Icon: IconClaims },
{ to: '/messages', labelKey: 'tabs.messages', ns: 'nav', Icon: IconMessages },
{ to: '/mine', labelKey: 'tabs.mine', ns: 'nav', Icon: IconMine },
] as const

export default function BottomNav() {
  const location = useLocation()
  const { t } = useTranslation('nav')
  const unreadCounts = useIMStore((s) => s.unreadCounts)
  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0)

  return (
    <nav className={styles.nav}>
      {tabs.map(({ to, labelKey, Icon }) => {
        const pathPrefix = to.split('/')[1]
        const isActive = location.pathname.startsWith(`/${pathPrefix}`)
        const showBadge = to === '/messages' && totalUnread > 0
        const label = t(labelKey)

        return (
          <NavLink
            key={to}
            to={to}
            className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
            aria-label={label}
          >
            <span className={styles.iconWrap}>
              <Icon active={isActive} />
            </span>
            <span className={`${styles.label} ${isActive ? styles.labelActive : ''}`}>
              {label}
            </span>
          </NavLink>
        )
      })}
    </nav>
  )
}
