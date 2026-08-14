import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import PageHeader from '../../components/PageHeader/PageHeader'
import styles from './VehiclesPage.module.css'

export default function VehiclesPage() {
  const { t } = useTranslation(['mine', 'common'])
  const [vehicles, setVehicles] = useState<any[]>([])

  useEffect(() => {
    // 强制覆盖 localStorage.boundVehicles 为 repo 中的 mockVehicles（覆盖本地数据），以恢复演示车辆
    import('../../mocks/vehicles')
      .then(({ mockVehicles }) => {
        try {
          localStorage.setItem('boundVehicles', JSON.stringify(mockVehicles))
          setVehicles(mockVehicles)
        } catch (e) {
          console.warn('Failed to seed boundVehicles from mocks', e)
        }
      })
      .catch((e) => console.warn('Failed to import mockVehicles', e))
  }, [])

  useEffect(() => {
    // 作为回退：如果上层覆盖逻辑失败，从 localStorage 读取
    try {
      const raw = localStorage.getItem('boundVehicles')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) setVehicles(parsed)
      }
    } catch (e) {
      console.warn('Failed to read boundVehicles from localStorage', e)
    }
  }, [])

  return (
    <div className={styles.page}>
      <PageHeader title={t('mine:vehicles.title', '我的车辆')} showBack />

      <div className={styles.list}>
        {vehicles.length === 0 ? (
          <div className={styles.empty}>{t('mine:vehicles.empty', '暂无绑定车辆')}</div>
        ) : (
          vehicles.map((v: any) => (
            <div key={v.vin || v.plate} className={styles.card}>
              <div className={styles.row}>
                <strong>{v.make} {v.model}</strong>
                <span>{v.vin || ''}</span>
              </div>
              <div className={styles.row}>
                <span>{t('mine:vehicles.plate', '车牌')}: {v.plate}</span>
                <span>{t('mine:vehicles.boundAt', '绑定时间')}: {v.boundAt}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
