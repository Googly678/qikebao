/**
 * Locale 偏好 store：持久化用户选择的语言。
 *
 * 注意：i18next 自己也会把选择写到 `localStorage['i18nextLng']`，
 * 这里走 zustand persist 是为了与 `auth-storage` 的存储风格保持一致，
 * 同时给将来引入「非 i18n 场景的本地化参数」预留通道。
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { FALLBACK_LOCALE, SUPPORTED_LOCALES, type LocaleCode } from '../i18n/config'

interface LocaleState {
  locale: LocaleCode
  setLocale: (l: LocaleCode) => void
}

function isLocaleCode(v: unknown): v is LocaleCode {
  return typeof v === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(v)
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: FALLBACK_LOCALE,
      setLocale: (locale) => {
        if (!isLocaleCode(locale)) return
        set({ locale })
      },
    }),
    {
      name: 'locale-storage',
      version: 1,
    },
  ),
)
