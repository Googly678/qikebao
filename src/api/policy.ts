import { get } from './request'

export type PolicyStatus = 'active' | 'expired' | 'pending' | 'cancelled'

export interface Policy {
  id: string
  policyNo: string
  productName: string
  insurer: string
  category: string
  subject: string
  insuredName: string
  coverage: number           // 保额（万元）
  remainingCoverage: number  // 剩余保额（万元）
  premium: number            // 保费（元）
  startDate: string
  endDate: string
  status: PolicyStatus
}

export interface ClaimRecord {
  claimId: string
  claimNo: string
  claimType: string
  amount: number
  date: string
  status: string
}

export interface PolicyDetail extends Policy {
  claimHistory: ClaimRecord[]
  documentUrl: string   // 保单 PDF URL
}

export interface PolicyListParams {
  keyword?: string
  category?: string
  subject?: string
  insurer?: string
  status?: PolicyStatus
  page?: number
  pageSize?: number
}

export const getPolicies = (params?: PolicyListParams) =>
  get<{ list: Policy[]; total: number }>('/policies', params as Record<string, unknown>)

export const getPolicyDetail = (id: string) =>
  get<PolicyDetail>(`/policies/${id}`)

export const downloadPolicy = (id: string) =>
  get<{ url: string }>(`/policies/${id}/download`)
