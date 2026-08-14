import type { Claim, ClaimDetail } from '../api/claims'

/**
 * 演示用理赔数据。
 *
 * 字段约定：
 * - `claimType` 是稳定 key（i18n: claims:create.types.{{key}}）
 * - `lossItems[].name` 与 `[].description` 也存为 i18n key（在 claims:detail.demo 下）
 * - `lossAssessment` / `progressSteps[].step` 同理
 * - `progressSteps[].status` 是 ClaimStatus 子集
 * - `attachments[].name` 是附件展示名（也走 i18n）
 */

/** ClaimType key 列表（与 i18n `claims:create.types` 同步） */
export const mockClaimTypes = [
  'cargo-damage',
  'theft',
  'third-party-liability',
  'workplace-injury',
  'vehicle-damage',
  'customer-slip',
  'food-poisoning',
  'employee-cut',
  'water-damage',
  'breakage',
  'fire',
  'cyber-incident',
] as const

export type ClaimTypeKey = (typeof mockClaimTypes)[number]

const INSURED = 'Grupo Hostelero Mediterráneo S.L.'

export const mockClaims: Claim[] = [
  {
    id: 'clm001',
    claimNo: 'CLM-2025-001',
    insuredName: INSURED,
    claimType: 'cargo-damage',
    policyNo: 'PICC-2025-GH-001234',
    category: '货运险',
    reportDate: '2025-08-12',
    status: 'paid',
    progress: 100,
  },
  {
    id: 'clm002',
    claimNo: 'CLM-2025-008',
    insuredName: INSURED,
    claimType: 'theft',
    policyNo: 'PICC-2025-GH-001234',
    category: '货运险',
    reportDate: '2025-11-01',
    status: 'paid',
    progress: 100,
  },
  {
    id: 'clm003',
    claimNo: 'CLM-2025-015',
    insuredName: INSURED,
    claimType: 'cargo-damage',
    policyNo: 'PA-2025-LL-005678',
    category: '货运险',
    reportDate: '2026-02-20',
    status: 'reviewing',
    progress: 50,
  },
  {
    id: 'clm004',
    claimNo: 'CLM-2026-003',
    insuredName: INSURED,
    claimType: 'third-party-liability',
    policyNo: 'PICC-2025-GH-001234',
    category: '货运险',
    reportDate: '2026-04-01',
    status: 'pending',
    progress: 10,
  },
]

export const mockClaimDetails: Record<string, ClaimDetail> = {
  clm001: {
    ...mockClaims[0],
    lossItems: [
      // name / description 字段填 i18n key，渲染时由 ClaimDetailPage 翻译
      { name: 'electronic-components', description: 'electronic-components', estimatedValue: 35000 },
    ],
    lossAssessment: 'assess-electronic',
    assessedAmount: 34000,
    progressSteps: [
      { step: 'report', date: '2025-08-12', status: 'done' },
      { step: 'onsite', date: '2025-08-14', status: 'done' },
      { step: 'assess', date: '2025-08-16', status: 'done' },
      { step: 'review', date: '2025-08-18', status: 'done' },
      { step: 'payout', date: '2025-08-20', status: 'done' },
    ],
    attachments: [{ name: 'Informe de liquidación.pdf', url: '/mock-documents/claim-clm001.pdf' }],
  },
  clm003: {
    ...mockClaims[2],
    lossItems: [
      { name: 'cold-chain-frozen-food', description: 'cold-chain-frozen-food', estimatedValue: 28000 },
    ],
    lossAssessment: 'assess-cold-chain',
    progressSteps: [
      { step: 'report', date: '2026-02-20', status: 'done' },
      { step: 'onsite', date: '2026-02-22', status: 'done' },
      { step: 'assess', date: '', status: 'active' },
      { step: 'review', date: '', status: 'pending' },
      { step: 'payout', date: '', status: 'pending' },
    ],
    attachments: [],
  },
  clm004: {
    ...mockClaims[3],
    lossItems: [
      { name: 'third-party-vehicle', description: 'third-party-vehicle', estimatedValue: 45000 },
    ],
    lossAssessment: 'assess-pending',
    progressSteps: [
      { step: 'report', date: '2026-04-01', status: 'done' },
      { step: 'onsite', date: '', status: 'active' },
      { step: 'assess', date: '', status: 'pending' },
      { step: 'review', date: '', status: 'pending' },
      { step: 'payout', date: '', status: 'pending' },
    ],
    attachments: [],
  },
}
