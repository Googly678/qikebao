import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PageHeader from '../../components/PageHeader/PageHeader'
import LanguageSwitcher from '../../components/LanguageSwitcher/LanguageSwitcher'
import { useUIStore } from '../../store/ui'
import styles from './MineFormPage.module.css'

export default function SettingsPage() {
  const navigate = useNavigate()
  const { t } = useTranslation(['mine', 'common'])
  const addToast = useUIStore((s) => s.addToast)
  const [settings, setSettings] = useState({
    notification: true,
    biometric: false,
    autoLogin: true,
  })

  const toggle = (key: keyof typeof settings) => {
    const next = { ...settings, [key]: !settings[key] }
    setSettings(next)
    addToast(t('mine:settings.updated'), 'success')
  }

  return (
    <div className={styles.page}>
      <PageHeader title={t('mine:settings.title')} showBack />
      <div className={styles.content}>
        <SettingItem label={t('mine:settings.items.notification')} checked={settings.notification} onToggle={() => toggle('notification')} />
        <SettingItem label={t('mine:settings.items.biometric')} checked={settings.biometric} onToggle={() => toggle('biometric')} />
        <SettingItem label={t('mine:settings.items.autoLogin')} checked={settings.autoLogin} onToggle={() => toggle('autoLogin')} />

        <div className={styles.langGroup}>
          <span className={styles.langLabel}>{t('mine:settings.language')}</span>
          <LanguageSwitcher />
        </div>

        <button className={styles.linkRow} onClick={() => navigate('/mine/payment')}>
          <span>{t('mine:menu.payment')}</span>
          <Arrow />
        </button>
      </div>
    </div>
  )
}

function SettingItem({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <div className={styles.settingItem}>
      <span>{label}</span>
      <button className={`${styles.switch} ${checked ? styles.switchOn : ''}`} onClick={onToggle} aria-pressed={checked}>
        <span className={styles.switchThumb} />
      </button>
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
