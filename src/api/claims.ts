import { get, post } from './request'

export type ClaimStatus = 'pending' | 'reviewing' | 'approved' | 'paid' | 'rejected'

export interface Claim {
  id: string
  claimNo: string         // 报案号
  insuredName: string     // 被保险人
  claimType: string       // 理赔类型
  policyNo: string
  category: string
  reportDate: string
  status: ClaimStatus
  progress: number        // 0-100 百分比
}

export interface LossItem {
  name: string
  description: string
  estimatedValue: number
}

export interface ProgressStep {
  step: string
  date: string
  status: 'done' | 'active' | 'pending'
  remark?: string
}

export interface ClaimDetail extends Claim {
  lossItems: LossItem[]          // 损失标的
  lossAssessment: string         // 损失评估
  assessedAmount?: number        // 核定赔付金额
  progressSteps: ProgressStep[]  // 理赔进度
  attachments: { name: string; url: string }[]
}

export interface ClaimListParams {
  keyword?: string
  category?: string
  insuredName?: string
  claimType?: string
  page?: number
  pageSize?: number
}

export const getClaims = (params?: ClaimListParams) =>
  get<{ list: Claim[]; total: number }>('/claims', params as Record<string, unknown>)

export const getClaimDetail = (id: string) =>
  get<ClaimDetail>(`/claims/${id}`)

export const submitDocuments = (claimId: string, formData: FormData) => {
  const request = import('../api/request').then((m) => m.default)
  return request.then((req) =>
    req.post(`/claims/${claimId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  )
}

export const getClaimTypes = () =>
  get<string[]>('/claims/types')
