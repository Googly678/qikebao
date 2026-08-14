import { post } from './request'

export interface LoginParams {
  phone: string
  password: string
}

export interface LoginResponse {
  token: string
  userInfo: {
    id: string
    name: string
    phone: string
    companyName: string
    companyId: string
    role: string
    avatar?: string
  }
}

export const login = (data: LoginParams) =>
  post<LoginResponse>('/auth/login', data)

export const logout = () =>
  post('/auth/logout')
