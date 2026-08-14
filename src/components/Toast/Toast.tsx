import { useUIStore } from '../../store/ui'
import styles from './Toast.module.css'

export default function Toast() {
  const { toasts, removeToast } = useUIStore()
  if (toasts.length === 0) return null

  return (
    <div className={styles.container}>
      {toasts.map((t) => (
        <div key={t.id} className={`${styles.toast} ${styles[t.type]}`} onClick={() => removeToast(t.id)}>
          {t.type === 'success' && <span className={styles.icon}>✓</span>}
          {t.type === 'error' && <span className={styles.icon}>✕</span>}
          {t.type === 'info' && <span className={styles.icon}>i</span>}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}
