/**
 * IM 服务抽象层
 * 初始接口按腾讯云 IM SDK 设计，可无缝切换环信等其他 SDK
 * 实际接入时替换 APP_ID 及以下实现即可
 */

export interface IMConfig {
  appId: string
  userId: string
  userSig: string
}

export interface IMMessagePayload {
  channelId: string
  content: string
  type: 'text' | 'image' | 'file'
  fileUrl?: string
}

export interface IMServiceInterface {
  init: (config: IMConfig) => Promise<void>
  login: (userId: string, userSig: string) => Promise<void>
  logout: () => Promise<void>
  sendMessage: (payload: IMMessagePayload) => Promise<void>
  onMessage: (handler: (msg: IMMessagePayload & { from: string; timestamp: number }) => void) => void
  offMessage: () => void
  setLocale: (locale: string) => void
  destroy: () => void
}

// ── 模拟实现（开发阶段） ──────────────────────────────────────────
const messageHandlers: Array<(msg: IMMessagePayload & { from: string; timestamp: number }) => void> = []
let currentLocale: string = 'zh-CN'

/**
 * 按当前 locale 从 i18next 取回复文案。
 * 缺译时回退 zh-CN。
 */
function getAutoReply(channelId: string): string {
  const list = pickAutoReplies(channelId, currentLocale)
  if (list.length === 0) {
    // fallback to zh-CN
    return pickAutoReplies(channelId, 'zh-CN')[0] ?? ''
  }
  return list[Math.floor(Math.random() * list.length)]
}

function pickAutoReplies(channelId: string, locale: string): string[] {
  // 通过全局 i18next 实例（避免这里导入 react-i18next）
  // 简单做法：从 i18next 静态资源里读
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const resources: Record<string, unknown> = {}
  // 动态取 i18next 资源
  // 由于 im.ts 不在 React 渲染中，window 上的 i18next 不可靠；
  // 我们用 require 静态加载 JSON 兜底（Vite 会内联）
  // 改用「集中常量」方案：直接 import locale JSON
  // —— 这里用「硬编码三语常量」更稳定：
  return REPLIES[locale]?.[channelId] ?? REPLIES['zh-CN'][channelId] ?? []
}

// 客服自动回复三语常量
const REPLIES: Record<string, Record<string, string[]>> = {
  'zh-CN': {
    'insure-service': [
      '您好！感谢您的咨询，我是您的专属投保顾问，请问有什么可以帮助您？',
      '我们的保险产品覆盖货运、冷链、雇主责任等多个险种，可以为您详细介绍。',
      '请稍候，我们将在1-3分钟内为您连接专业顾问。',
    ],
    'claim-service': [
      '您好！我是理赔服务专员，请提供您的报案号，我将协助您跟进理赔进度。',
      '材料审核中，预计1-2个工作日完成，请耐心等待。',
      '如需紧急处理，请拨打24小时理赔热线：400-XXX-XXXX。',
    ],
    'announcement': [
      '您好，这里是公告信息频道，如有疑问请联系客服。',
    ],
    'renewal-30d': [
      '您的保单即将到期，建议尽快续保以保持保障不中断。',
    ],
  },
  'es-ES': {
    'insure-service': [
      '¡Hola! Soy tu asesor de seguros. ¿En qué puedo ayudarte?',
      'Nuestros productos cubren transporte, cadena de frío, responsabilidad civil del empleador y más.',
      'Un momento, en 1-3 minutos te conecto con un asesor especializado.',
    ],
    'claim-service': [
      'Hola, soy el tramitador de siniestros. Comparte tu número de siniestro y te ayudo a seguir el caso.',
      'Estamos revisando la documentación; la respuesta llega en 1-2 días laborables.',
      'Para urgencias, llama al teléfono 24h: 900 123 456.',
    ],
    'announcement': [
      'Bienvenido al canal de anuncios. Para dudas, contacta con soporte.',
    ],
    'renewal-30d': [
      'Tus pólizas están a punto de vencer. Te recomendamos renovarlas cuanto antes.',
    ],
  },
  'en-ES': {
    'insure-service': [
      'Hi! I am your dedicated insurance advisor. How can I help you?',
      'Our products cover freight, cold chain, employer liability and more.',
      'One moment, I will connect you with a specialist in 1-3 minutes.',
    ],
    'claim-service': [
      'Hi, I am the claims handler. Please share your claim number so I can follow up.',
      'Documents are under review; expect an answer within 1-2 business days.',
      'For emergencies call our 24h line: 900 123 456.',
    ],
    'announcement': [
      'Welcome to the announcements channel. For questions, contact support.',
    ],
    'renewal-30d': [
      'Your policies are about to expire. We recommend renewing soon to keep your cover.',
    ],
  },
}

const MockIMService: IMServiceInterface = {
  init: async (_config: IMConfig) => {
    console.log('[IM] Initialized with appId:', _config.appId)
  },
  login: async (userId: string, _userSig: string) => {
    console.log('[IM] Logged in as:', userId)
  },
  logout: async () => {
    console.log('[IM] Logged out')
  },
  sendMessage: async (payload: IMMessagePayload) => {
    console.log('[IM] Message sent:', payload)
    // 模拟客服自动回复
    setTimeout(() => {
      const reply: IMMessagePayload & { from: string; timestamp: number } = {
        channelId: payload.channelId,
        content: getAutoReply(payload.channelId),
        type: 'text',
        from: 'agent',
        timestamp: Date.now(),
      }
      messageHandlers.forEach((h) => h(reply))
    }, 1200)
  },
  onMessage: (handler) => {
    messageHandlers.push(handler)
  },
  offMessage: () => {
    messageHandlers.length = 0
  },
  setLocale: (locale) => {
    currentLocale = locale
  },
  destroy: () => {
    messageHandlers.length = 0
  },
}

// ── 待接入腾讯云 IM 时替换此处 ──────────────────────────────────
// import TencentCloudChat from '@tencentcloud/chat'
// const TencentIMService: IMServiceInterface = { ... }

export const IMService: IMServiceInterface = MockIMService

export const IM_APP_ID = import.meta.env.VITE_IM_APP_ID ?? '1400000000'
