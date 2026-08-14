import { useTranslation } from 'react-i18next'
import PageHeader from '../../components/PageHeader/PageHeader'
import styles from './PolicyDetailPage.module.css'

export default function PolicyDetailPage() {
  const { t } = useTranslation(['policy', 'errors', 'common'])

  // Per change request: policy pages should not expose mock policy details.
  // Always show not found / removed message when no real backend is connected.
  return (
    <div className={styles.page}>
      <PageHeader title={t('policy:detail.title')} showBack />
      <div className={styles.content}>
        <p className={styles.emptyText}>{t('errors:toast.policyNotFound')}</p>
      </div>
    </div>
  )
}
