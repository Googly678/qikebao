import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import PageHeader from '../../components/PageHeader/PageHeader'
import { useUIStore } from '../../store/ui'
import { useLocale } from '../../i18n/useLocale'
import { validateIban } from '../../utils/locale'
import styles from './MineFormPage.module.css'

interface PaymentState {
  iban: string
  autoRenewal: boolean
  paymentFrequency: 'monthly' | 'quarterly' | 'annual'
  consentSepa: boolean
}

const initial: PaymentState = {
  iban: '',
  autoRenewal: false,
  paymentFrequency: 'annual',
  consentSepa: false,
}

export default function PaymentSettingsPage() {
  const { t } = useTranslation(['payment', 'errors', 'common'])
  const { locale } = useLocale()
  const addToast = useUIStore((s) => s.addToast)
  const [form, setForm] = useState<PaymentState>(initial)
  const [touched, setTouched] = useState(false)

  const ibanValid = !form.iban || validateIban(form.iban)
  const showIbanError = touched && form.iban.length > 0 && !ibanValid

  const save = () => {
    setTouched(true)
    if (form.iban && !ibanValid) {
      addToast(t('errors:validation.iban'), 'error')
      return
    }
    if (form.autoRenewal && !form.consentSepa) {
      addToast(t('payment:toast.consentRequired'), 'error')
      return
    }
    addToast(t('payment:toast.saved'), 'success')
  }

  return (
    <div className={styles.page}>
      <PageHeader title={t('payment:title')} showBack />
      <div className={styles.content}>
        <section className={styles.formCard}>
          <h3 className={styles.sectionTitle}>{t('payment:bank.title')}</h3>

          <Field
            label={t('payment:bank.iban')}
            value={form.iban}
            onChange={(v) => setForm({ ...form, iban: v.toUpperCase().replace(/\s+/g, ' ') })}
            placeholder="ES00 0000 0000 0000 0000 0000"
            error={showIbanError ? t('errors:validation.iban') : undefined}
          />
          <p className={styles.hint}>{t('payment:bank.ibanHint')}</p>

          <label className={styles.field}>
            <span className={styles.label}>{t('payment:bank.frequency')}</span>
            <select
              className={styles.input}
              value={form.paymentFrequency}
              onChange={(e) => setForm({ ...form, paymentFrequency: e.target.value as PaymentState['paymentFrequency'] })}
            >
              <option value="monthly">{t('payment:frequency.monthly')}</option>
              <option value="quarterly">{t('payment:frequency.quarterly')}</option>
              <option value="annual">{t('payment:frequency.annual')}</option>
            </select>
          </label>
        </section>

        <section className={styles.formCard}>
          <h3 className={styles.sectionTitle}>{t('payment:auto.title')}</h3>

          <SettingRow
            label={t('payment:auto.enable')}
            description={t('payment:auto.enableDesc')}
            checked={form.autoRenewal}
            onToggle={() => setForm({ ...form, autoRenewal: !form.autoRenewal })}
          />

          {form.autoRenewal && (
            <label className={styles.checkItem} onClick={() => setForm({ ...form, consentSepa: !form.consentSepa })}>
              <span className={`${styles.checkbox} ${form.consentSepa ? styles.checkboxChecked : ''}`} />
              <span className={styles.checkLabel}>{t('payment:auto.sepaConsent')}</span>
            </label>
          )}
        </section>

        <p className={styles.fineprint}>{t('payment:fineprint', { locale })}</p>
      </div>

      <BottomSave onClick={save} label={t('common:buttons.save')} />
    </div>
  )
}

interface FieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  error?: string
}

function Field({ label, value, onChange, placeholder, error }: FieldProps) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      <input
        className={`${styles.input} ${error ? styles.inputError : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
      />
      {error && <span className={styles.errorText}>{error}</span>}
    </label>
  )
}

interface SettingRowProps {
  label: string
  description: string
  checked: boolean
  onToggle: () => void
}

function SettingRow({ label, description, checked, onToggle }: SettingRowProps) {
  return (
    <div className={styles.settingItem} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <span>{label}</span>
        <button
          className={`${styles.switch} ${checked ? styles.switchOn : ''}`}
          onClick={onToggle}
          aria-pressed={checked}
        >
          <span className={styles.switchThumb} />
        </button>
      </div>
      <span style={{ fontSize: 12, color: 'var(--color-text-stone)' }}>{description}</span>
    </div>
  )
}

function BottomSave({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <div className={styles.bottomBar}>
      <button className={styles.saveBtn} onClick={onClick}>{label}</button>
    </div>
  )
}
