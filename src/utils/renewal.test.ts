import { describe, expect, it } from 'vitest'
import { derivePolicyMeta, type DerivedPolicyMeta } from './renewal'
import type { Policy } from '../api/policy'

const today = new Date('2026-06-02T00:00:00.000Z')

function mkPolicy(endDate: string, status: 'active' | 'expired' = 'active'): Policy {
  return {
    id: 'p1',
    policyNo: 'TEST-001',
    productName: 'Test',
    insurer: 'Test',
    category: '财产险',
    subject: '店铺',
    insuredName: 'Test',
    coverage: 100,
    remainingCoverage: 100,
    premium: 1000,
    startDate: '2025-01-01',
    endDate,
    status,
  }
}

function days(meta: DerivedPolicyMeta): number {
  return meta.daysToExpire
}

describe('derivePolicyMeta', () => {
  it('flags expired policies (lapsed)', () => {
    const meta = derivePolicyMeta(mkPolicy('2026-05-01'), today)
    expect(meta.renewalStatus).toBe('lapsed')
    expect(days(meta)).toBeLessThan(0)
    expect(meta.renewalBucket).toBeNull()
  })

  it('classifies 30-day bucket (1..30 days)', () => {
    const meta = derivePolicyMeta(mkPolicy('2026-06-15'), today)
    expect(meta.renewalStatus).toBe('eligible')
    expect(meta.renewalBucket).toBe(30)
  })

  it('classifies 60-day bucket (31..60 days)', () => {
    const meta = derivePolicyMeta(mkPolicy('2026-07-20'), today)
    expect(meta.renewalStatus).toBe('eligible')
    expect(meta.renewalBucket).toBe(60)
  })

  it('classifies 90-day bucket (61..90 days)', () => {
    const meta = derivePolicyMeta(mkPolicy('2026-08-12'), today)
    expect(meta.renewalStatus).toBe('eligible')
    expect(meta.renewalBucket).toBe(90)
  })

  it('not eligible when > 90 days away', () => {
    const meta = derivePolicyMeta(mkPolicy('2026-12-31'), today)
    expect(meta.renewalStatus).toBe('not_eligible')
    expect(meta.renewalBucket).toBeNull()
  })

  it('boundary day 0 is in 30-day bucket', () => {
    const meta = derivePolicyMeta(mkPolicy('2026-06-02'), today)
    expect(meta.renewalBucket).toBe(30)
  })

  it('boundary day 30 is in 30-day bucket', () => {
    const meta = derivePolicyMeta(mkPolicy('2026-07-02'), today)
    expect(meta.renewalBucket).toBe(30)
  })

  it('boundary day 31 is in 60-day bucket', () => {
    const meta = derivePolicyMeta(mkPolicy('2026-07-03'), today)
    expect(meta.renewalBucket).toBe(60)
  })

  it('boundary day 90 is in 90-day bucket', () => {
    const meta = derivePolicyMeta(mkPolicy('2026-08-31'), today)
    expect(meta.renewalBucket).toBe(90)
  })

  it('boundary day 91 is not eligible', () => {
    const meta = derivePolicyMeta(mkPolicy('2026-09-01'), today)
    expect(meta.renewalStatus).toBe('not_eligible')
  })
})
