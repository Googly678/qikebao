import { get, post } from './request'

export interface InsuranceProduct {
  id: string
  name: string
  insurer: string
  insurerLogo?: string
  category: string        // 保险种类
  subject: string         // 保险标的
  minCoverage: number     // 最低保额（万元）
  maxCoverage: number     // 最高保额（万元）
  priceFrom: number       // 起始保费（元/年）
  tags: string[]
  summary: string

  // —— 西班牙 broker 维度（可选，旧产品不填）——
  /** CNAE 行业代码集合 */
  cnaes?: string[]
  /** 适用的集体协议（convenio）—— 用于雇主责任险 */
  convenios?: string[]
  /** 适用面积区间（m²） */
  minSurface?: number
  maxSurface?: number
  /** 适用员工人数区间 */
  minEmployees?: number
  maxEmployees?: number
  /** 货币（默认 EUR，西班牙） */
  currency?: 'EUR' | 'CNY' | 'USD'
}

export type LocaleCode = 'zh-CN' | 'es-ES' | 'en-ES'

/**
 * 保险详情里的大段说明文本是 HTML 富文本，且每个产品要按当前 locale 展示。
 * 这里用「按 locale 索引」的对象承载，UI 层用 `useLocale().locale` 取值。
 */
export type LocalizedHTML = Record<LocaleCode, string>

export interface InsuranceDetail extends InsuranceProduct {
  introduction: LocalizedHTML
  coverage: LocalizedHTML
  notice: LocalizedHTML
  specialTerms: LocalizedHTML
  disclosure: LocalizedHTML
  samplePolicyUrl: string
}

export interface InsuranceListParams {
  keyword?: string
  category?: string
  subject?: string
  insurer?: string
  page?: number
  pageSize?: number
}

export const getInsuranceProducts = (params?: InsuranceListParams) =>
  get<{ list: InsuranceProduct[]; total: number }>('/insurance/products', params as Record<string, unknown>)

export const getInsuranceDetail = (id: string) =>
  get<InsuranceDetail>(`/insurance/products/${id}`)

export interface QuoteParams {
  productId: string
  insuredName: string
  insuredIdType: string
  insuredIdNo: string
  insuredPhone: string
  coverage: number
  startDate: string
  endDate: string
}

export const createOrder = (data: QuoteParams) =>
  post<{ orderId: string; premium: number }>('/insurance/orders', data)

export const getInsuranceCategories = () =>
  get<string[]>('/insurance/categories')

export const getInsuranceSubjects = () =>
  get<string[]>('/insurance/subjects')

export const getInsurers = () =>
  get<string[]>('/insurance/insurers')
