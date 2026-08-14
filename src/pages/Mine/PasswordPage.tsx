import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PageHeader from '../../components/PageHeader/PageHeader'
import { useUIStore } from '../../store/ui'
import styles from './MineFormPage.module.css'

export default function PasswordPage() {
  const navigate = useNavigate()
  const { t } = useTranslation(['mine', 'errors'])
  const addToast = useUIStore((s) => s.addToast)
  const [form, setForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' })

  const save = () => {
    if (!form.oldPassword || !form.newPassword || !form.confirmPassword) {
      addToast(t('mine:password.toast.incomplete'), 'error')
      return
    }
    if (form.newPassword !== form.confirmPassword) {
      addToast(t('mine:password.toast.mismatch'), 'error')
      return
    }
    addToast(t('mine:password.toast.success'), 'success')
    navigate(-1)
  }

  return (
    <div className={styles.page}>
      <PageHeader title={t('mine:password.title')} showBack />
      <div className={styles.content}>
        <Field label={t('mine:password.fields.old')} type="password" value={form.oldPassword} onChange={(v) => setForm({ ...form, oldPassword: v })} />
        <Field label={t('mine:password.fields.new')} type="password" value={form.newPassword} onChange={(v) => setForm({ ...form, newPassword: v })} />
        <Field label={t('mine:password.fields.confirm')} type="password" value={form.confirmPassword} onChange={(v) => setForm({ ...form, confirmPassword: v })} />
      </div>
      <BottomSave onClick={save} label={t('mine:password.toast.submit')} />
    </div>
  )
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      <input className={styles.input} type={type} value={value} onChange={(e) => onChange(e.target.value)} />
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
