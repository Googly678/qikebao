import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import PageHeader from '../../components/PageHeader/PageHeader'
import styles from './PolicyDocumentPage.module.css'

export default function PolicyDocumentPage() {
  const { t } = useTranslation(['policy', 'errors', 'common'])
  const { id } = useParams<{ id: string }>()

  // find policy in localStorage
  let policy: any = null
  try {
    const list = JSON.parse(localStorage.getItem('policies') || '[]')
    policy = (list || []).find((p: any) => p.id === id)
  } catch (e) {
    policy = null
  }

  // F-RC-006 发票下载：根据保单关联的发票号在 localStorage('invoices') 查找
  let invoice: any = null
  try {
    const invList = JSON.parse(localStorage.getItem('invoices') || '[]')
    if (Array.isArray(invList)) {
      invoice = invList.find((inv: any) =>
        (policy && policy.invoiceNo && inv.invoiceNo === policy.invoiceNo) ||
        (policy && policy.order_no && inv.orderNo === policy.order_no)
      ) ?? null
    }
  } catch (e) {
    invoice = null
  }

  // 演示用：发票下载内容为一个可下载的文本文件（真实场景为 PDF）
  const downloadInvoice = () => {
    if (!invoice) return
    const content = [
      '电子发票（演示）',
      `发票号码：${invoice.invoiceNo}`,
      `订单号：${invoice.orderNo}`,
      `产品：${invoice.productName}`,
      `开票时间：${invoice.issuedAt}`,
      `金额：EUR ${invoice.amount}`,
    ].join('\n')
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${invoice.invoiceNo}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={styles.page}>
      <PageHeader title={t('policy:document.title')} showBack />
      <div className={styles.previewArea}>
        {!policy ? (
          <p className={styles.emptyText}>{t('errors:toast.policyNotFound')}</p>
        ) : (
          <div>
            <h2 className={styles.policyTitle}>{policy.productName} · {policy.policyNo}</h2>
            <p className={styles.policyMeta}>投保人：{policy.insuredName}</p>
            <p className={styles.policyMeta}>保障期：{policy.startDate} - {policy.endDate}</p>
            <div className={styles.actions}>
              <a className={styles.downloadLink} href={policy.protocol_url} target="_blank" rel="noreferrer">
                {t('policy:document.downloadProtocol', '下载服务协议')}
              </a>
              {invoice && (
                <button className={styles.invoiceLink} onClick={downloadInvoice}>
                  {t('policy:document.downloadInvoice', '下载电子发票')}
                </button>
              )}
            </div>

            {invoice && (
              <div className={styles.invoiceCard}>
                <div className={styles.invoiceHead}>
                  <span className={styles.invoiceEyebrow}>{t('policy:document.invoice', '电子发票')}</span>
                  <strong>{invoice.invoiceNo}</strong>
                </div>
                <div className={styles.invoiceRow}><span>{t('policy:document.orderNo', '订单号')}</span><strong>{invoice.orderNo}</strong></div>
                <div className={styles.invoiceRow}><span>{t('policy:document.amount', '金额')}</span><strong>EUR {invoice.amount}</strong></div>
                <div className={styles.invoiceRow}><span>{t('policy:document.issuedAt', '开票时间')}</span><strong>{new Date(invoice.issuedAt).toLocaleString()}</strong></div>
              </div>
            )}

            <iframe src={policy.protocol_url} className={styles.iframe} title="policy-doc" />
          </div>
        )}
      </div>
    </div>
  )
}
