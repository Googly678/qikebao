import type { Policy, PolicyDetail, ClaimRecord } from '../api/policy'

/**
 * 历史理赔记录用稳定 key 与 i18n 映射。
 * 详见 i18n locales claims.json create.types 占位符。
 */
const claimHistory: ClaimRecord[] = [
  { claimId: 'c001', claimNo: 'CLM-2025-001', claimType: 'cargo-damage', amount: 35000, date: '2025-08-15', status: 'paid' },
  { claimId: 'c002', claimNo: 'CLM-2025-008', claimType: 'theft', amount: 12000, date: '2025-11-03', status: 'paid' },
]

/** 默认被保险人 — 与 mocks/user.ts 对齐 */
const INSURED = 'Grupo Hostelero Mediterráneo S.L.'

export const mockPolicies: Policy[] = [
  {
    id: 'pol001',
    policyNo: 'PICC-2025-GH-001234',
    productName: '物流货运综合险',
    insurer: '中国人保',
    category: '货运险',
    subject: '整车货物',
    insuredName: INSURED,
    coverage: 500,
    remainingCoverage: 453,
    premium: 28000,
    startDate: '2025-01-01',
    endDate: '2026-06-15', // 13 天后到期 → 30 天桶
    status: 'active',
  },
  {
    id: 'pol002',
    policyNo: 'PA-2025-LL-005678',
    productName: '冷链运输险',
    insurer: '平安保险',
    category: '货运险',
    subject: '冷链货物',
    insuredName: INSURED,
    coverage: 200,
    remainingCoverage: 200,
    premium: 15000,
    startDate: '2025-03-01',
    endDate: '2026-07-20', // 48 天后 → 60 天桶
    status: 'active',
  },
  {
    id: 'pol003',
    policyNo: 'CPIC-2024-ER-009012',
    productName: '物流雇主责任险',
    insurer: '太平洋保险',
    category: '雇主险',
    subject: '员工',
    insuredName: INSURED,
    coverage: 100,
    remainingCoverage: 0,
    premium: 9800,
    startDate: '2024-01-01',
    endDate: '2024-12-31', // 早已到期 → lapsed
    status: 'expired',
  },
  {
    id: 'pol004',
    policyNo: 'CPIC-2025-ER-003456',
    productName: '物流雇主责任险',
    insurer: '太平洋保险',
    category: '雇主险',
    subject: '员工',
    insuredName: INSURED,
    coverage: 100,
    remainingCoverage: 100,
    premium: 10500,
    startDate: '2025-01-01',
    endDate: '2026-08-12', // 71 天后 → 90 天桶
    status: 'active',
  },
  {
    id: 'pol005',
    policyNo: 'PICC-2025-PROP-007890',
    productName: '店铺财产综合险',
    insurer: '中国人保',
    category: '财产险',
    subject: '店铺财产',
    insuredName: INSURED,
    coverage: 300,
    remainingCoverage: 300,
    premium: 12000,
    startDate: '2025-09-01',
    endDate: '2026-06-25', // 23 天后 → 30 天桶
    status: 'active',
  },
]

export const mockPolicyDetails: Record<string, PolicyDetail> = {
  pol001: {
    ...mockPolicies[0],
    claimHistory,
    documentUrl: '/mock-documents/policy-pol001.pdf',
  },
  pol002: {
    ...mockPolicies[1],
    claimHistory: [],
    documentUrl: '/mock-documents/policy-pol002.pdf',
  },
  pol003: {
    ...mockPolicies[2],
    claimHistory: [
      { claimId: 'c003', claimNo: 'CLM-2024-015', claimType: 'workplace-injury', amount: 25000, date: '2024-06-20', status: 'paid' },
    ],
    documentUrl: '/mock-documents/policy-pol003.pdf',
  },
  pol004: {
    ...mockPolicies[3],
    claimHistory: [],
    documentUrl: '/mock-documents/policy-pol004.pdf',
  },
  pol005: {
    ...mockPolicies[4],
    claimHistory: [],
    documentUrl: '/mock-documents/policy-pol005.pdf',
  },
}
