import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useIMStore } from '../../store/im'
import styles from './MessagesPage.module.css'

type ChannelId = 'insure-service' | 'claim-service' | 'announcement' | 'renewal-30d'

interface ChannelIcon {
  id: ChannelId
  icon: React.ReactNode
  /** 点击后跳转的路由（undefined 表示打开 IM） */
  href?: string
}

const ICONS: Record<ChannelId, React.ReactNode> = {
  'insure-service': (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="8" fill="#0071e3" />
      <path d="M14 5C10.13 5 7 7.9 7 11.5c0 2.8 1.9 5.2 4.6 6.2l-.7 5.3h6.2l-.7-5.3c2.7-1 4.6-3.4 4.6-6.2C21 7.9 17.87 5 14 5z" fill="white" />
    </svg>
  ),
  'claim-service': (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="8" fill="#34c759" />
      <path d="M14 6a8 8 0 100 16A8 8 0 0014 6zm0 3v5l3 3-1.5 1.5L12 15V9h2z" fill="white" />
    </svg>
  ),
  'announcement': (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="8" fill="#ff9500" />
      <path d="M14 7v2M7 14h2m11 0h2M10.2 9.8l1.4 1.4m5.6-1.4l-1.4 1.4M14 12a2 2 0 100 4 2 2 0 000-4zm-5 7h10" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  'renewal-30d': (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="8" fill="#c96442" />
      <path d="M14 6a8 8 0 100 16 8 8 0 000-16zm0 3v5l3 3-1.4 1.4L11.6 14V9H14z" stroke="white" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
}

const CHANNELS: ChannelIcon[] = [
  { id: 'renewal-30d', icon: ICONS['renewal-30d'], href: '/renewal' },
  { id: 'insure-service', icon: ICONS['insure-service'] },
  { id: 'claim-service', icon: ICONS['claim-service'] },
  { id: 'announcement', icon: ICONS['announcement'] },
]

const LATEST_KEY: Record<ChannelId, string> = {
  'insure-service': 'insure',
  'claim-service': 'claim',
  'announcement': 'announcement',
  'renewal-30d': 'renewal',
}

export default function MessagesPage() {
  const navigate = useNavigate()
  const { t } = useTranslation(['im', 'renewal'])
  const { openIM, unreadCounts } = useIMStore()

  // Per user request: remove mock preview content and counts from Messages page.
  const renderLatest = (_id: ChannelId): string => ''

  const renderDescription = (_id: ChannelId): string => ''

  const renderTime = (_id: ChannelId): string => ''

  return (
    <div className={styles.page}>
      <div className={styles.titleArea}>
        <h1 className={styles.pageTitle}>{t('im:messagesPage.title')}</h1>
      </div>

      <div className={styles.emptyArea} style={{ padding: 24, textAlign: 'center' }}>
        {t('im:messagesPage.empty', '暂无消息')}
      </div>
    </div>
  )
}
