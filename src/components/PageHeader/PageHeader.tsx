import styles from './PageHeader.module.css'
import { useNavigate } from 'react-router-dom'

interface PageHeaderProps {
  title: string
  showBack?: boolean
  right?: React.ReactNode
  onBack?: () => void
}

export default function PageHeader({ title, showBack = false, right, onBack }: PageHeaderProps) {
  const navigate = useNavigate()
  return (
    <header className={styles.header}>
      {showBack && (
        <button className={styles.backBtn} onClick={() => onBack ? onBack() : navigate(-1)} aria-label="返回">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="var(--color-terracotta)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
      <h1 className={styles.title}>{title}</h1>
      {right && <div className={styles.right}>{right}</div>}
    </header>
  )
}
