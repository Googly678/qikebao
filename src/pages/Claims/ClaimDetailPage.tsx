import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PageHeader from '../../components/PageHeader/PageHeader'
// Read claim details from persisted storage (localStorage('claims')) instead of showing repo mock claims
import { useIMStore } from '../../store/im'
import { useUIStore } from '../../store/ui'
import { useLocale } from '../../i18n/useLocale'
import { formatDate } from '../../utils/locale'
import styles from './ClaimDetailPage.module.css'

export default function ClaimDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation(['claims', 'errors'])
  const { locale } = useLocale()
  const openIM = useIMStore((s) => s.openIM)
  const addToast = useUIStore((s) => s.addToast)
  const detail = useMemo(() => {
    try {
      const raw = localStorage.getItem('claims')
      if (!raw) return undefined
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return undefined
      return parsed.find((c: any) => c.id === id)
    } catch (e) {
      return undefined
    }
  }, [id])
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)

  if (!detail) return <div>{t('errors:toast.claimNotFound')}</div>

  const handleSubmitDocs = () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      addToast(t('errors:toast.claimIncomplete'), 'error')
      return
    }
    addToast(t('claims:detail.documentsSubmitted'), 'success')
  }

  // mock 内的字符串字段实际是 i18n key —— 在渲染时翻译，缺译时 fallback 回 key 字符串
  const itemName = (key: string) => t(`claims:detail.demo.lossItems.${key}`, { defaultValue: key })
  const itemDesc = (key: string) => t(`claims:detail.demo.lossItemDescriptions.${key}`, { defaultValue: key })
  const assessmentText = (key: string) => t(`claims:detail.demo.assessments.${key}`, { defaultValue: key })
  const attachmentName = (name: string) => t(`claims:detail.demo.attachmentNames.${name}`, { defaultValue: name })

  return (
    <div className={styles.page}>
      <PageHeader title={t('claims:detail.title')} showBack />
      <div className={styles.content}>
        <section className={styles.infoCard}>
          <h2 className={styles.claimNo}>{detail.claimNo}</h2>
          <div className={styles.infoRow}><span>{t('claims:create.summary.insured')}</span><strong>{detail.insuredName}</strong></div>
          <div className={styles.infoRow}><span>{t('claims:detail.claimType')}</span><strong>{t(`claims:create.types.${detail.claimType}`, { defaultValue: detail.claimType })}</strong></div>
          <div className={styles.infoRow}><span>{t('claims:detail.policyNo')}</span><strong>{detail.policyNo}</strong></div>
          <div className={styles.infoRow}><span>{t('claims:detail.reportDate')}</span><strong>{formatDate(detail.reportDate, locale)}</strong></div>
        </section>

        <section className={styles.infoCard}>
          <h3 className={styles.sectionTitle}>{t('claims:detail.lossItems')}</h3>
          {detail.lossItems && detail.lossItems.length > 0 ? (
            detail.lossItems.map((item: any, idx: number) => (
              <div key={idx} className={styles.lossItem}>
                <div>
                  <strong>{itemName(item.name)}</strong>
                  <p>{itemDesc(item.description)}</p>
                </div>
                <span>{item.estimatedValue.toLocaleString(locale)} €</span>
              </div>
            ))
          ) : (
            <p className={styles.assessment}>{t('claims:detail.noLossItems', '暂无损失项目')}</p>
          )}
        </section>

        {detail.lossAssessment && (
          <section className={styles.infoCard}>
            <h3 className={styles.sectionTitle}>{t('claims:detail.lossAssessment')}</h3>
            <p className={styles.assessment}>{assessmentText(detail.lossAssessment)}</p>
          </section>
        )}

        <section className={styles.infoCard}>
          <h3 className={styles.sectionTitle}>{t('claims:detail.progress')}</h3>
          <div className={styles.timeline}>
            {detail.progressSteps.map((step: any, idx: number) => (
              <div key={idx} className={styles.timelineItem}>
                <span className={`${styles.dot} ${styles[step.status]}`} />
                <div className={styles.timelineContent}>
                  <strong>{t(`claims:detail.steps.${step.step}`, { defaultValue: step.step })}</strong>
                  <span>{step.date ? formatDate(step.date, locale) : t('claims:detail.inProgress')}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {detail.attachments && detail.attachments.length > 0 && (
          <section className={styles.infoCard}>
            <h3 className={styles.sectionTitle}>{t('claims:detail.attachments')}</h3>
            <ul className={styles.fileList}>
              {detail.attachments.map((a: any) => (
                <li key={a.name}>
                  <a href={a.url} target="_blank" rel="noreferrer">{attachmentName(a.name)}</a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className={styles.uploadCard}>
          <label className={styles.uploadBtn}>
            {t('claims:detail.uploadDocs')}
            <input type="file" multiple onChange={(e) => setSelectedFiles(e.target.files)} />
          </label>
          {selectedFiles && selectedFiles.length > 0 && (
            <ul className={styles.fileList}>
              {Array.from(selectedFiles).map((f) => <li key={f.name}>{f.name}</li>)}
            </ul>
          )}
        </section>
      </div>

      <div className={styles.bottomBar}>
        <button className={styles.secondaryBtn} onClick={() => openIM('claim-service')}>{t('claims:detail.contactSupport')}</button>
        <button className={styles.primaryBtn} onClick={handleSubmitDocs}>{t('claims:detail.submitDocs')}</button>
      </div>
    </div>
  )
}
