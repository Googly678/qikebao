import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './MandatoryReadModal.module.css'

interface MandatoryReadModalProps {
  title: string
  content: string
  countdownSeconds?: number
  onConfirm: () => void
  onCancel: () => void
}

export default function MandatoryReadModal({
  title,
  content,
  countdownSeconds = 5,
  onConfirm,
  onCancel,
}: MandatoryReadModalProps) {
  const { t } = useTranslation('errors')
  const [hasReachedBottom, setHasReachedBottom] = useState(false)
  const [countdown, setCountdown] = useState(countdownSeconds)
  const [isReady, setIsReady] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // IntersectionObserver：检测是否滚动到底部
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasReachedBottom) {
          setHasReachedBottom(true)
        }
      },
      { threshold: 0.8 }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasReachedBottom])

  // 到达底部后开始倒计时
  useEffect(() => {
    if (!hasReachedBottom) return
    if (countdown > 0) {
      timerRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(timerRef.current!)
            setIsReady(true)
            return 0
          }
          return c - 1
        })
      }, 1000)
    } else {
      setIsReady(true)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [hasReachedBottom]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.body.classList.add('modal-open')
    return () => document.body.classList.remove('modal-open')
  }, [])

  const btnLabel = !hasReachedBottom
    ? t('modal.readPrompt')
    : countdown > 0
    ? t('modal.readCountdown', { count: countdown })
    : t('modal.readConfirm')

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button className={styles.closeBtn} onClick={onCancel} aria-label={t('modal.close')}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="rgba(0,0,0,0.48)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className={styles.scrollArea}>
          <div
            className={styles.contentHtml}
            dangerouslySetInnerHTML={{ __html: content }}
          />
          {/* 哨兵元素 */}
          <div ref={sentinelRef} className={styles.sentinel} />
        </div>

        {/* Progress Hint */}
        {!hasReachedBottom && (
          <div className={styles.scrollHint}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 6l4 4 4-4" stroke="rgba(0,0,0,0.48)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{t('modal.scrollHint')}</span>
          </div>
        )}

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onCancel}>
            {t('modal.cancel')}
          </button>
          <button
            className={`${styles.confirmBtn} ${isReady ? styles.confirmBtnReady : ''}`}
            onClick={isReady ? onConfirm : undefined}
            disabled={!isReady}
            aria-disabled={!isReady}
          >
            {btnLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
