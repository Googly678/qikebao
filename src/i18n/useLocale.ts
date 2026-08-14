/**
 * 语言切换 hook：在 i18next + zustand store 之间架桥。
 *
 * 流程：
 * 1. 读 `useLocaleStore.locale`（持久化的用户偏好）
 * 2. 写 `i18n.changeLanguage(...)` 让 react-i18next 立即响应
 * 3. 写 `useLocaleStore.setLocale(...)` 让下次进入仍生效
 * 4. 自动同步 `document.documentElement.lang`（见 i18n/index.ts）
 */
import { useCallback, useEffect } from 'react'
import i18n from './index'
import { useLocaleStore } from '../store/locale'
import type { LocaleCode } from './config'

export function useLocale() {
  const locale = useLocaleStore((s) => s.locale)
  const setLocale = useLocaleStore((s) => s.setLocale)

  // 启动时把 i18next 与 store 对齐
  useEffect(() => {
    if (i18n.language !== locale) {
      void i18n.changeLanguage(locale)
    }
  }, [locale])

  const change = useCallback(
    (next: LocaleCode) => {
      setLocale(next)
      void i18n.changeLanguage(next)
    },
    [setLocale],
  )

  return { locale, changeLocale: change }
}
