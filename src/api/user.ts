import { get, post, put } from './request'

export interface UserProfile {
  id: string
  name: string
  phone: string
  email: string
  avatar?: string
}

export interface CompanyInfo {
  id: string
  name: string
  licenseNo: string
  address: string
  contactName: string
  contactPhone: string
  industry: string
}

export const getUserProfile = () =>
  get<UserProfile>('/user/profile')

export const updateUserProfile = (data: Partial<UserProfile>) =>
  put<UserProfile>('/user/profile', data)

export const getCompanyInfo = () =>
  get<CompanyInfo>('/user/company')

export const updateCompanyInfo = (data: Partial<CompanyInfo>) =>
  put<CompanyInfo>('/user/company', data)

export interface ChangePasswordParams {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

export const changePassword = (data: ChangePasswordParams) =>
  post('/user/change-password', data)
