import { describe, expect, it } from 'vitest'
import { formatCurrency, formatDate, isValidPhone, validateIban, validateNif } from './locale'

describe('isValidPhone', () => {
  it('accepts Chinese 11-digit mobile numbers starting with 1', () => {
    expect(isValidPhone('13812345678', 'zh-CN')).toBe(true)
    expect(isValidPhone('1 3 8-1234-5678', 'zh-CN')).toBe(true)
  })

  it('rejects invalid Chinese numbers', () => {
    expect(isValidPhone('12345678901', 'zh-CN')).toBe(false) // 12 starts: not 1[3-9]
    expect(isValidPhone('23812345678', 'zh-CN')).toBe(false)
    expect(isValidPhone('', 'zh-CN')).toBe(false)
  })

  it('accepts Spanish 9-digit mobile starting with 6 or 7', () => {
    expect(isValidPhone('612345678', 'es-ES')).toBe(true)
    expect(isValidPhone('712345678', 'es-ES')).toBe(true)
  })

  it('accepts Spanish +34 prefix', () => {
    expect(isValidPhone('+34612345678', 'es-ES')).toBe(true)
    expect(isValidPhone('+34 612 345 678', 'es-ES')).toBe(true)
  })

  it('rejects Spanish landline (must start 6 or 7)', () => {
    expect(isValidPhone('912345678', 'es-ES')).toBe(false)
  })

  it('falls back to E.164 for unknown locale', () => {
    expect(isValidPhone('+14155552671', 'unknown-LOCALE')).toBe(true)
    expect(isValidPhone('abc', 'unknown-LOCALE')).toBe(false)
  })
})

describe('validateNif (Spain)', () => {
  it('accepts valid NIF (DNI + control letter)', () => {
    // 12345678 → control letter = Z (per DNI 23-letter table)
    expect(validateNif('12345678Z').ok).toBe(true)
    // 00000000 → T
    expect(validateNif('00000000T').ok).toBe(true)
  })

  it('rejects NIF with wrong control letter', () => {
    const r = validateNif('12345678A')
    expect(r.ok).toBe(false)
    expect(r.reason).toBe('bad-control')
  })

  it('accepts NIE (X/Y/Z prefix)', () => {
    // X1234567 → mapped 01234567 → control letter = L
    expect(validateNif('X1234567L').ok).toBe(true)
  })

  it('accepts CIF (company) by shape', () => {
    expect(validateNif('A12345678').ok).toBe(true)
  })

  it('rejects malformed input', () => {
    expect(validateNif('').ok).toBe(false)
    expect(validateNif('123').ok).toBe(false)
  })

  it('handles upper-casing and stripping', () => {
    expect(validateNif('x 1 2 3 4 5 6 7 l').ok).toBe(true)
  })
})

describe('validateIban (mod-97)', () => {
  it('accepts a known-valid Spanish IBAN', () => {
    // Standard test IBAN published in ISO 13616 spec.
    expect(validateIban('ES91 2100 0418 4502 0005 1332')).toBe(true)
  })

  it('rejects IBANs with bad check digits', () => {
    expect(validateIban('ES00 2100 0418 4502 0005 1332')).toBe(false)
  })

  it('rejects malformed IBANs', () => {
    expect(validateIban('123')).toBe(false)
    expect(validateIban('ES123')).toBe(false) // too short
    expect(validateIban('1234 5678')).toBe(false)
  })

  it('accepts a non-Spanish valid IBAN (Germany)', () => {
    // DE89370400440532013000 is a well-known sample IBAN
    expect(validateIban('DE89370400440532013000')).toBe(true)
  })

  it('rejects a DE IBAN that is too short', () => {
    expect(validateIban('DE89 3704 0044 0532 0130')).toBe(false)
  })
})

describe('formatCurrency / formatDate', () => {
  it('formats EUR in es-ES with thousands separator + comma decimal + € suffix', () => {
    const out = formatCurrency(12345.67, 'es-ES', 'EUR')
    // es-ES uses period as thousands separator, comma as decimal, € suffix.
    // (Note: 'Intl' may use non-breaking space U+00A0 between digits and €.)
    expect(out).toMatch(/12\.345,67/)
    expect(out).toMatch(/€/)
  })

  it('formats CNY in zh-CN', () => {
    const out = formatCurrency(1234.5, 'zh-CN', 'CNY')
    expect(out).toMatch(/¥|CNY/)
  })

  it('falls back gracefully on bad locale', () => {
    // Some Intl implementations accept "invalid" as a default — just assert the value is present.
    const out = formatCurrency(100, 'invalid', 'EUR')
    expect(out).toMatch(/100/)
  })

  it('formats date in es-ES as dd/mm/yyyy', () => {
    const out = formatDate('2026-06-15', 'es-ES')
    expect(out).toBe('15/06/2026')
  })

  it('formats date in zh-CN with hyphens (default)', () => {
    const out = formatDate('2026-06-15', 'zh-CN')
    expect(out).toMatch(/2026.*06.*15/)
  })

  it('returns input on bad date string', () => {
    expect(formatDate('not-a-date', 'es-ES')).toBe('not-a-date')
  })
})
