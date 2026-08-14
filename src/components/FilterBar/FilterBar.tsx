import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './FilterBar.module.css'

export interface FilterOption {
  label: string
  value: string
}

export interface FilterConfig {
  key: string
  placeholder: string
  options: FilterOption[]
}

interface FilterBarProps {
  filters: FilterConfig[]
  values: Record<string, string>
  onChange: (key: string, value: string) => void
}

interface SheetState {
  key: string
  label: string
  options: FilterOption[]
  selected: string
}

export default function FilterBar({ filters, values, onChange }: FilterBarProps) {
  const { t } = useTranslation('common')
  const [sheet, setSheet] = useState<SheetState | null>(null)

  const openSheet = (f: FilterConfig) => {
    setSheet({ key: f.key, label: f.placeholder, options: f.options, selected: values[f.key] ?? '' })
  }

  const selectOption = (value: string) => {
    if (!sheet) return
    const newVal = values[sheet.key] === value ? '' : value
    onChange(sheet.key, newVal)
    setSheet(null)
  }

  return (
    <>
      <div className={styles.container}>
        <div className={styles.bar}>
          {filters.map((f) => {
            const selected = values[f.key]
            const label = selected
              ? (f.options.find((o) => o.value === selected)?.label ?? f.placeholder)
              : f.placeholder
            const isOpen = sheet?.key === f.key
            return (
              <button
                key={f.key}
                className={`${styles.chip} ${selected ? styles.chipActive : ''} ${isOpen ? styles.chipOpen : ''}`}
                onClick={() => isOpen ? setSheet(null) : openSheet(f)}
              >
                <span>{label}</span>
                <svg
                  width="12" height="12" viewBox="0 0 12 12" fill="none"
                  className={`${styles.arrow} ${isOpen ? styles.arrowUp : ''}`}
                >
                  <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )
          })}
        </div>

        {/* Dropdown Panel */}
        {sheet && (
          <div className={styles.dropdown}>
            <button
              className={`${styles.option} ${!sheet.selected ? styles.optionActive : ''}`}
              onClick={() => selectOption('')}
            >
              <span>{t('filter.all')}</span>
              {!sheet.selected && <CheckIcon />}
            </button>
            {sheet.options.map((opt) => (
              <button
                key={opt.value}
                className={`${styles.option} ${sheet.selected === opt.value ? styles.optionActive : ''}`}
                onClick={() => selectOption(opt.value)}
              >
                <span>{opt.label}</span>
                {sheet.selected === opt.value && <CheckIcon />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 透明遮罩，点击外部关闭 */}
      {sheet && (
        <div className={styles.backdrop} onClick={() => setSheet(null)} />
      )}
    </>
  )
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M3.5 9l4 4 7-7" stroke="var(--color-terracotta)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
