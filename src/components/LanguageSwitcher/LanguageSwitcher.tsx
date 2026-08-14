import { LOCALE_LABELS, SUPPORTED_LOCALES, type LocaleCode } from '../../i18n/config'
import { useLocale } from '../../i18n/useLocale'
import styles from './LanguageSwitcher.module.css'

interface LanguageSwitcherProps {
  /** 渲染形态：`select` 适合表单场景，`chips` 适合设置页 */
  variant?: 'select' | 'chips'
}

/**
 * 通用语言切换器。无 i18n 依赖自身，纯 props 控制。
 * - select：原生 <select>，占位少
 * - chips：三按钮横排，移动端更顺手
 */
export default function LanguageSwitcher({ variant = 'chips' }: LanguageSwitcherProps) {
  const { locale, changeLocale } = useLocale()

  if (variant === 'select') {
    return (
      <select
        className={styles.select}
        value={locale}
        onChange={(e) => changeLocale(e.target.value as LocaleCode)}
        aria-label="Language"
      >
        {SUPPORTED_LOCALES.map((code) => (
          <option key={code} value={code}>
            {LOCALE_LABELS[code]}
          </option>
        ))}
      </select>
    )
  }

  return (
    <div className={styles.chips} role="radiogroup" aria-label="Language">
      {SUPPORTED_LOCALES.map((code) => (
        <button
          key={code}
          role="radio"
          aria-checked={locale === code}
          className={`${styles.chip} ${locale === code ? styles.chipActive : ''}`}
          onClick={() => changeLocale(code)}
        >
          {LOCALE_LABELS[code]}
        </button>
      ))}
    </div>
  )
}
