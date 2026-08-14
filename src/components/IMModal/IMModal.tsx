import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useIMStore, type IMMessage } from '../../store/im'
import { IMService } from '../../services/im'
import { useAuthStore } from '../../store/auth'
import styles from './IMModal.module.css'

export default function IMModal() {
  const { t, i18n } = useTranslation('im')
  const { isModalOpen, activeChannel, closeIM, addMessage, markRead, messages } = useIMStore()
  const userInfo = useAuthStore((s) => s.userInfo)
  const [inputText, setInputText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const channelId = activeChannel ?? ''
  const channelMessages: IMMessage[] = messages[channelId] ?? []

  useEffect(() => {
    if (!isModalOpen || !channelId) return
    document.body.classList.add('modal-open')
    markRead(channelId)

    // 添加欢迎消息（若频道无消息）
    if ((messages[channelId] ?? []).length === 0) {
      const channelName = t(`channels.${channelId}`, { defaultValue: t('channels.default') })
      const welcomeMsg: IMMessage = {
        id: `welcome-${Date.now()}`,
        from: 'agent',
        content: t('welcome', { channel: channelName }),
        timestamp: Date.now(),
        type: 'text',
        isOwn: false,
      }
      addMessage(channelId, welcomeMsg)
    }

    IMService.onMessage((msg) => {
      const newMsg: IMMessage = {
        id: `msg-${Date.now()}`,
        from: msg.from,
        content: msg.content,
        timestamp: msg.timestamp,
        type: msg.type,
        isOwn: false,
      }
      addMessage(channelId, newMsg)
    })

    return () => {
      document.body.classList.remove('modal-open')
      IMService.offMessage()
    }
  }, [isModalOpen, channelId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [channelMessages.length])

  if (!isModalOpen) return null

  const handleSend = async () => {
    const text = inputText.trim()
    if (!text || isSending) return

    const ownMsg: IMMessage = {
      id: `own-${Date.now()}`,
      from: userInfo?.name ?? t('me'),
      content: text,
      timestamp: Date.now(),
      type: 'text',
      isOwn: true,
    }
    addMessage(channelId, ownMsg)
    setInputText('')
    setIsSending(true)

    await IMService.sendMessage({ channelId, content: text, type: 'text' })
    setIsSending(false)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const channelTitle = t(`channels.${channelId}`, { defaultValue: t('channels.default') })
  const timeLocale = i18n.language === 'zh-CN' ? 'zh-CN' : i18n.language

  return (
    <div className={styles.overlay} onClick={closeIM}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <span className={styles.headerTitle}>{channelTitle}</span>
            <span className={styles.headerSubtitle}>{t('headerSubtitle')}</span>
          </div>
          <button className={styles.closeBtn} onClick={closeIM} aria-label={t('close')}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="rgba(0,0,0,0.48)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className={styles.messages}>
          {channelMessages.map((msg) => (
            <div key={msg.id} className={`${styles.bubble} ${msg.isOwn ? styles.ownBubble : styles.agentBubble}`}>
              {!msg.isOwn && (
                <div className={styles.agentAvatar}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 1.5C5.5 1.5 3.5 3 3.5 5c0 1.6.9 2.9 2.2 3.6L4 12h8l-1.7-3.4C11.6 7.9 12.5 6.6 12.5 5c0-2-2-3.5-4.5-3.5z" fill="white" />
                  </svg>
                </div>
              )}
              <div className={`${styles.bubbleContent} ${msg.isOwn ? styles.ownContent : styles.agentContent}`}>
                <span>{msg.content}</span>
                <time className={styles.time}>
                  {new Date(msg.timestamp).toLocaleTimeString(timeLocale, { hour: '2-digit', minute: '2-digit' })}
                </time>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className={styles.inputArea}>
          <input
            ref={inputRef}
            className={styles.textInput}
            placeholder={t('inputPlaceholder')}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className={`${styles.sendBtn} ${inputText.trim() ? styles.sendBtnActive : ''}`}
            onClick={handleSend}
            disabled={!inputText.trim() || isSending}
            aria-label={t('send')}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 10L17 3l-5 14-3-4-4-3z" fill="white" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
