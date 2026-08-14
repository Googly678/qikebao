/**
 * i18n 初始化入口。
 * - 在 `main.tsx` 顶部 import 即可，无需组件包裹。
 * - 装配顺序：resources → detection → init → bind to <html lang>
 * - 显式优于检测：store/localStorage > navigator。
 */
import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import { FALLBACK_LOCALE, NAMESPACES, type LocaleCode, type LocaleResources } from './config'
import { IMService } from '../services/im'

// 用 Vite 的 import.meta.glob 把三类语言 × 八大 namespace 一次性带进来
// relative: true 拿相对路径，eager: true 同步导入以便 build 时内联
const modules = import.meta.glob<{ default: Record<string, unknown> }>(
  './locales/*/*.json',
  { eager: true, import: 'default' },
)

function buildResources(): LocaleResources {
  const resources: Record<string, Record<string, unknown>> = {}

  for (const [path, mod] of Object.entries(modules)) {
    // 路径形如 `./locales/zh-CN/common.json`
    const match = path.match(/\.\/locales\/([^/]+)\/([^/]+)\.json$/)
    if (!match) continue
    const [, locale, namespace] = match
    if (!locale || !namespace) continue

    resources[locale] ??= {}
    resources[locale][namespace] = mod
  }

  return resources as unknown as LocaleResources
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: buildResources(),
    fallbackLng: FALLBACK_LOCALE,
    supportedLngs: ['zh-CN', 'es-ES', 'en-ES'],
    ns: NAMESPACES as unknown as string[],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    detection: {
      // 顺序：localStorage -> navigator -> htmlTag
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
    // 缺译时直接显示 key，便于开发期扫漏
    saveMissing: import.meta.env.DEV,
    missingKeyHandler: import.meta.env.DEV
      ? (_lngs, _ns, key) => {
          // eslint-disable-next-line no-console
          console.warn(`[i18n] missing key: ${key}`)
        }
      : undefined,
    returnNull: false,
  })

// 同步 <html lang> 与 <body lang-* class>，并按需切 dir
const LANG_CLASSES = ['lang-zh', 'lang-es', 'lang-en'] as const
const RTL_LANGS = new Set(['ar', 'he', 'fa', 'ur']) // future: ar-ES 等

function isRtl(lng: string): boolean {
  const primary = lng.split('-')[0] ?? ''
  return RTL_LANGS.has(primary)
}

function applyDocumentLocale(lng: string) {
  if (typeof document === 'undefined') return
  const html = document.documentElement
  html.lang = lng
  // dir 切换：当前 3 种语言都是 LTR，RTL 触发条件为 RTL_LANGS
  html.dir = isRtl(lng) ? 'rtl' : 'ltr'
  // class 钩子：便于 CSS 走 locale-specific 样式
  document.body.classList.remove(...LANG_CLASSES)
  if (lng.startsWith('zh')) document.body.classList.add('lang-zh')
  else if (lng.startsWith('es')) document.body.classList.add('lang-es')
  else if (lng.startsWith('en')) document.body.classList.add('lang-en')
  // 同步 IM 客服自动回复语言
  IMService.setLocale?.(lng)
}

i18n.on('languageChanged', applyDocumentLocale)

// 首次初始化时也设一次
applyDocumentLocale(i18n.language || FALLBACK_LOCALE)

export default i18n
export type { LocaleCode }
