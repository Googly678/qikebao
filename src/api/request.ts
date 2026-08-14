import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios'

// 统一 API 响应结构
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

const request: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ── i18n-lite fallback messages ────────────────────────────────────────
//
// 拦截器不能依赖 react-i18next（避免循环），用一份常量映射并读 zustand
// persist 的 locale-storage 取当前语言；找不到时兜底西语（这是给西班牙 SME
// 用的 portal，西语兜底比中文更合适）。
const FALLBACK_MESSAGES: Record<string, Record<string, string>> = {
  'zh-CN': {
    requestFailed: '请求失败',
    sessionExpired: '会话已过期，请重新登录',
  },
  'es-ES': {
    requestFailed: 'Error en la solicitud',
    sessionExpired: 'Sesión expirada, inicia sesión de nuevo',
  },
  'en-ES': {
    requestFailed: 'Request failed',
    sessionExpired: 'Session expired, please log in again',
  },
}

function getStoredLocale(): string {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('locale-storage') : null
    if (raw) {
      const parsed = JSON.parse(raw) as { state?: { locale?: string } }
      if (parsed?.state?.locale) return parsed.state.locale
    }
  } catch {
    // ignore
  }
  return 'es-ES'
}

function tError(key: 'requestFailed' | 'sessionExpired'): string {
  const locale = getStoredLocale()
  return FALLBACK_MESSAGES[locale]?.[key] ?? FALLBACK_MESSAGES['es-ES'][key]
}

// 请求拦截器 — 注入 token
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    try {
      const raw = localStorage.getItem('auth-storage')
      if (raw) {
        const { state } = JSON.parse(raw) as { state: { token: string | null } }
        if (state?.token) {
          config.headers.Authorization = `Bearer ${state.token}`
        }
      }
    } catch {
      // ignore parse errors
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器 — 统一错误处理
request.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const { data } = response
    if (data.code !== 200 && data.code !== 0) {
      return Promise.reject(new Error(data.message ?? tError('requestFailed')))
    }
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // token 失效，清除本地 auth 并跳转登录
      localStorage.removeItem('auth-storage')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export function get<T>(url: string, params?: Record<string, unknown>, config?: AxiosRequestConfig) {
  return request.get<ApiResponse<T>>(url, { params, ...config })
}

export function post<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
  return request.post<ApiResponse<T>>(url, data, config)
}

export function put<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
  return request.put<ApiResponse<T>>(url, data, config)
}

export function del<T>(url: string, config?: AxiosRequestConfig) {
  return request.delete<ApiResponse<T>>(url, config)
}

export default request
