/**
 * Locale-aware format & validation utilities.
 *
 * Phone validation:
 * - 复用 i18n locale 决定校验策略
 * - es-ES：欧式手机号 9 位（自 2021-09 起西班牙去掉 +34 后 9 位数字）
 * - zh-CN：11 位数字 1 开头
 * - en-ES (或 fallback)：E.164 国际格式（+ 后 7~15 位）
 *
 * NIF/CIF 校验：见 `validateNif`（简化版，足以演示）
 * IBAN 校验：见 `validateIban`（mod-97 算法，符合 ISO 13616）
 */

export type LocaleCode = string

export function isValidPhone(raw: string, locale: LocaleCode): boolean {
  const trimmed = raw.replace(/[\s\-()]/g, '')
  if (!trimmed) return false

  if (locale === 'zh-CN') {
    return /^1[3-9]\d{9}$/.test(trimmed)
  }
  if (locale === 'es-ES') {
    // 西班牙手机：9 位数字，可能带 +34 前缀
    if (/^\+?34\d{9}$/.test(trimmed)) return true
    if (/^[6-7]\d{8}$/.test(trimmed)) return true
    return false
  }
  // E.164 fallback
  return /^\+?[1-9]\d{6,14}$/.test(trimmed)
}

/**
 * 西班牙 CIF / NIF 简化校验
 * - NIF（个人）：8 位数字 + 1 个字母（按 DNI 字母表）
 * - CIF（公司）：字母开头 + 7 位数字 + 1 个校验字符
 * - NIE（外籍）：X/Y/Z + 7 位数字 + 1 个字母
 */
const NIF_CONTROL = 'TRWAGMYFPDXBNJZSQVHLCKE'
export function validateNif(raw: string): { ok: boolean; reason?: string } {
  const v = raw.trim().toUpperCase().replace(/[\s-]/g, '')
  if (!v) return { ok: false, reason: 'empty' }

  // NIF
  if (/^\d{8}[A-Z]$/.test(v)) {
    const num = v.slice(0, 8)
    const expected = NIF_CONTROL[parseInt(num, 10) % 23]
    return v[8] === expected ? { ok: true } : { ok: false, reason: 'bad-control' }
  }

  // NIE
  if (/^[XYZ]\d{7}[A-Z]$/.test(v)) {
    const mapped = v.replace(/^X/, '0').replace(/^Y/, '1').replace(/^Z/, '2')
    const num = mapped.slice(0, 8)
    const expected = NIF_CONTROL[parseInt(num, 10) % 23]
    return v[8] === expected ? { ok: true } : { ok: false, reason: 'bad-control' }
  }

  // CIF（仅校验长度 + 首字符 + 末字符）
  if (/^[ABCDEFGHJKNPQRSUVW]\d{7}[A-Z0-9]$/.test(v)) {
    return { ok: true }
  }

  return { ok: false, reason: 'format' }
}

/** IBAN mod-97 校验（去除空格、按 4 位一组重组） */
export function validateIban(raw: string): boolean {
  const v = raw.trim().toUpperCase().replace(/\s+/g, '')
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(v)) return false
  // 把前 4 位挪到末尾，并 A=10..Z=35
  const reordered = v.slice(4) + v.slice(0, 4)
  let expanded = ''
  for (const ch of reordered) {
    if (ch >= 'A' && ch <= 'Z') {
      expanded += String(ch.charCodeAt(0) - 55)
    } else {
      expanded += ch
    }
  }
  // mod 97（分段避免 JS 数字精度）
  let rem = 0
  for (let i = 0; i < expanded.length; i += 7) {
    const chunk = String(rem) + expanded.slice(i, i + 7)
    rem = parseInt(chunk, 10) % 97
  }
  return rem === 1
}

/** 货币/数字本地化（仅展示用，不参与计算） */
export function formatCurrency(value: number, locale: LocaleCode, currency: string = 'EUR'): string {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value)
  } catch {
    return `${value.toLocaleString()} ${currency}`
  }
}

export function formatDate(iso: string, locale: LocaleCode): string {
  try {
    const d = new Date(iso)
    return new Intl.DateTimeFormat(locale, { year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
  } catch {
    return iso
  }
}
