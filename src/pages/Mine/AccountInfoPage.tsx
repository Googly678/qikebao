import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PageHeader from '../../components/PageHeader/PageHeader'
import { useAuthStore } from '../../store/auth'
import { useUIStore } from '../../store/ui'
import { useLocale } from '../../i18n/useLocale'
import { isValidPhone } from '../../utils/locale'
import styles from './MineFormPage.module.css'

// 各语言下账号信息的默认邮箱（同一公司不同语种示例）
const DEFAULT_EMAIL: Record<string, string> = {
  'zh-CN': 'service@hosteleria-mediterraneo.cn',
  'es-ES': 'maria@hosteleria-mediterraneo.es',
  'en-ES': 'maria@hosteleria-mediterraneo.es',
}

export default function AccountInfoPage() {
  const navigate = useNavigate()
  const { t } = useTranslation(['mine', 'errors', 'common'])
  const { locale } = useLocale()
  const updateUserInfo = useAuthStore((s) => s.updateUserInfo)
  const addToast = useUIStore((s) => s.addToast)
  const currentUser = useAuthStore((s) => s.userInfo)
  // Company info fallback from localStorage('company')
  let companyName = ''
  try {
    const rawCompany = localStorage.getItem('company')
    if (rawCompany) companyName = JSON.parse(rawCompany).name || ''
  } catch (e) {
    companyName = ''
  }

  const [form, setForm] = useState({
    name: currentUser?.name || '',
    phone: currentUser?.phone || '',
    email: DEFAULT_EMAIL[locale] || companyName || '' ,
  })

  const save = () => {
    if (!isValidPhone(form.phone, locale)) {
      addToast(t('errors:validation.phone', { locale }), 'error')
      return
    }
    updateUserInfo({ name: form.name, phone: form.phone })
    addToast(t('errors:toast.accountUpdated'), 'success')
    navigate(-1)
  }

  return (
    <div className={styles.page}>
      <PageHeader title={t('mine:account.title')} showBack />
      <div className={styles.content}>
        <Field label={t('mine:account.fields.name')} value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
        <Field label={t('mine:account.fields.phone')} value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
        <Field label={t('mine:account.fields.email')} value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
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
