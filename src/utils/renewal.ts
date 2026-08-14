/**
 * 计算保单剩余天数与续保状态。
 * 续保状态机：not_eligible / eligible / quoted / awaiting_payment / paid / renewed / lapsed
 *
 * 简化规则：
 * - 已过期（endDate < today）：lapsed
 * - 已续保：renewed
 * - 0~30 天：eligible（高优）
 * - 31~60 天：eligible（中优）
 * - 61~90 天：eligible（远期）
 * - > 90 天：not_eligible
 */
import type { Policy } from '../api/policy'

export type RenewalStatus =
  | 'not_eligible'
  | 'eligible'
  | 'quoted'
  | 'awaiting_payment'
  | 'paid'
  | 'renewed'
  | 'lapsed'

export interface DerivedPolicyMeta {
  daysToExpire: number
  renewalStatus: RenewalStatus
  renewalBucket: 30 | 60 | 90 | null
}

const MS_PER_DAY = 1000 * 60 * 60 * 24

export function derivePolicyMeta(policy: Policy, today: Date = new Date()): DerivedPolicyMeta {
  const end = new Date(policy.endDate)
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const startOfEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate())
  const days = Math.round((startOfEnd.getTime() - startOfToday.getTime()) / MS_PER_DAY)

  let status: RenewalStatus
  let bucket: 30 | 60 | 90 | null = null

  if (days < 0) {
    status = 'lapsed'
  } else if (days <= 30) {
    status = 'eligible'
    bucket = 30
  } else if (days <= 60) {
    status = 'eligible'
    bucket = 60
  } else if (days <= 90) {
    status = 'eligible'
    bucket = 90
  } else {
    status = 'not_eligible'
  }

  return { daysToExpire: days, renewalStatus: status, renewalBucket: bucket }
}
