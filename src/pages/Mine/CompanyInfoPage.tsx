import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PageHeader from '../../components/PageHeader/PageHeader'
import { useUIStore } from '../../store/ui'
import styles from './MineFormPage.module.css'

export default function CompanyInfoPage() {
  const navigate = useNavigate()
  const { t } = useTranslation(['mine', 'errors', 'common'])
  const addToast = useUIStore((s) => s.addToast)
  // read company info from localStorage('company') as data source for the form
  let initialCompany: any = { name: '', licenseNo: '', address: '', contactName: '', contactPhone: '', industry: '' }
  try {
    const raw = localStorage.getItem('company')
    if (raw) initialCompany = JSON.parse(raw)
  } catch (e) {
    // ignore
  }
  const [form, setForm] = useState(initialCompany)

  const save = () => {
    addToast(t('errors:toast.companyUpdated'), 'success')
    navigate(-1)
  }

  return (
    <div className={styles.page}>
      <PageHeader title={t('mine:company.title')} showBack />
      <div className={styles.content}>
        <Field label={t('mine:company.fields.name')} value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
        <Field label={t('mine:company.fields.licenseNo')} value={form.licenseNo} onChange={(v) => setForm({ ...form, licenseNo: v })} />
        <Field label={t('mine:company.fields.address')} value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
        <Field label={t('mine:company.fields.contactName')} value={form.contactName} onChange={(v) => setForm({ ...form, contactName: v })} />
        <Field label={t('mine:company.fields.contactPhone')} value={form.contactPhone} onChange={(v) => setForm({ ...form, contactPhone: v })} />
        <Field label={t('mine:company.fields.industry')} value={form.industry} onChange={(v) => setForm({ ...form, industry: v })} />
      </div>
      <BottomSave onClick={save} label={t('common:buttons.save')} />
    </div>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      <input className={styles.input} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}

function BottomSave({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <div className={styles.bottomBar}>
      <button className={styles.saveBtn} onClick={onClick}>{label}</button>
    </div>
  )
}
