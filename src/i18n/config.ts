/**
 * i18n 全局配置：命名空间、fallback、检测策略。
 *
 * - 默认语言：`zh-CN`（与现有全部中文文案保持零回归起步）
 * - 命名空间：按业务模块拆分（common / nav / policy / insurance / claims / mine / renewal / errors）
 * - 复数：i18next 原生 `_one` / `_other` 后缀，西班牙语/英语/中文都受益
 * - 兜底：缺失 key 时返回 key 串本身（开发态可见）
 */
import type { Resource } from 'i18next'

export const SUPPORTED_LOCALES = ['zh-CN', 'es-ES', 'en-ES'] as const
export type LocaleCode = (typeof SUPPORTED_LOCALES)[number]

export const FALLBACK_LOCALE: LocaleCode = 'zh-CN'

export const NAMESPACES = [
  'common',
  'nav',
  'policy',
  'insurance',
  'claims',
  'mine',
  'renewal',
  'payment',
  'im',
  'taxonomy',
  'errors',
] as const

export type Namespace = (typeof NAMESPACES)[number]

export const LOCALE_LABELS: Record<LocaleCode, string> = {
  'zh-CN': '中文',
  'es-ES': 'Español',
  'en-ES': 'English',
}

// 资源由 `import.meta.glob` 集中装配（见 ./index.ts），这里只声明形状约束。
export type LocaleResources = Resource
