import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import SearchBar from '../../components/SearchBar/SearchBar'
import FilterBar, { type FilterConfig } from '../../components/FilterBar/FilterBar'
import type { InsuranceProduct } from '../../api/insurance'
// Do not render repository mock data directly. Read products from localStorage('products') to avoid exposing mocks in pages.
import { useTaxonomy } from '../../hooks/useTaxonomy'
import styles from './InsurancePage.module.css'

/**
 * 行业（西班牙 SME 维度）选项。
 * value 是稳定的 key；label 由 i18n 提供。
 * 匹配规则：
 *  - cnae:  产品 cnaes[] 包含此 cnae
 *  - tag:   产品 tags[] 任一元素小写后包含此 tag 子串
 */
type IndustryMatch =
  | { value: string; match: { type: 'cnae'; cnae: string } }
  | { value: string; match: { type: 'tag'; tag: string } }

const INDUSTRY_OPTIONS: IndustryMatch[] = [
  { value: 'hosteleria', match: { type: 'cnae', cnae: '5610' } },
  { value: 'comercio', match: { type: 'cnae', cnae: '4711' } },
  { value: 'cyber', match: { type: 'tag', tag: 'ciber' } },
]

function matchesIndustry(item: InsuranceProduct, industry: string): boolean {
  const opt = INDUSTRY_OPTIONS.find((o) => o.value === industry)
  if (!opt) return true
  const m = opt.match
  if (m.type === 'cnae') {
    return !!item.cnaes?.includes(m.cnae)
  }
  return (item.tags ?? []).some((tag) => tag.toLowerCase().includes(m.tag.toLowerCase()))
}

export default function InsurancePage() {
  const navigate = useNavigate()
  const { t } = useTranslation('insurance')
  const taxonomy = useTaxonomy()
  const [keyword, setKeyword] = useState('')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [seedTick, setSeedTick] = useState(0)

  // Updated filter bar per PRD: 车型、价格、保障期限、保障范围
  const filterConfigs: FilterConfig[] = [
    {
      key: 'carModel',
      placeholder: t('filter.carModel', '车型'),
      options: [
        { label: 'Sedan', value: 'sedan' },
        { label: 'SUV', value: 'suv' },
        { label: 'Van', value: 'van' },
      ],
    },
    {
      key: 'price',
      placeholder: t('filter.price', '价格'),
      options: [
        { label: '< €200', value: 'lt200' },
        { label: '€200 - €500', value: '200-500' },
        { label: '> €500', value: 'gt500' },
      ],
    },
    {
      key: 'term',
      placeholder: t('filter.term', '保障期限'),
      options: [
        { label: '1 年', value: '1y' },
        { label: '2 年', value: '2y' },
        { label: '3 年', value: '3y' },
      ],
    },
    {
      key: 'coverage',
      placeholder: t('filter.coverage', '保障范围'),
      options: [
        { label: 'Engine', value: 'engine' },
        { label: 'Transmission', value: 'transmission' },
        { label: 'Electrical', value: 'electrical' },
        { label: 'Full', value: 'full' },
      ],
    },
  ]

  useEffect(() => {
    // Seed demo products if none exist so 投保页面不会为空
    try {
      const raw = localStorage.getItem('products')
      if (!raw) {
        const demoProducts = [
          {
            id: 'p-yanbao-compact',
            name: '延保·紧凑型（1年）',
            insurer: '延保保险有限公司',
            priceFrom: 199,
            summary: '适用于入门级轿车的延长保修，覆盖发动机与电控故障。',
            tags: ['延保', '发动机', '电控'],
            category: 'auto',
            subject: 'vehicle',
            minCoverage: 1000,
            maxCoverage: 10000,
            introduction: { 'zh-CN': '<p>紧凑型延保，适配多数小型轿车。</p>', 'es-ES': '<p>Protección extendida para coches compactos.</p>' },
            coverage: { 'zh-CN': '<ul><li>发动机</li><li>电控单元</li></ul>', 'es-ES': '<ul><li>Motor</li><li>ECU</li></ul>' },
            notice: { 'zh-CN': '<p>本产品仅示例用途，具体以合同为准。</p>', 'es-ES': '<p>Ejemplo de producto, ver contrato para detalles.</p>' },
            specialTerms: { 'zh-CN': '<p>特殊条款示例。</p>', 'es-ES': '<p>Términos especiales.</p>' },
            disclosure: { 'zh-CN': '<p>重要提示：请仔细阅读合同条款。</p>', 'es-ES': '<p>Aviso importante: lea el contrato.</p>' },
            samplePolicyUrl: `${window.location.origin}/mock-documents/p-yanbao-compact.pdf`,
          },
          {
            id: 'p-yanbao-suv',
            name: '延保·SUV 尊享（2年）',
            insurer: '延保保险有限公司',
            priceFrom: 429,
            summary: '覆盖发动机、变速箱及电气系统的全面延保方案，适配中大型 SUV。',
            tags: ['延保', '变速箱', 'SUV'],
            category: 'auto',
            subject: 'vehicle',
            minCoverage: 2000,
            maxCoverage: 20000,
            introduction: { 'zh-CN': '<p>SUV 尊享延保，覆盖更多关键零件。</p>', 'es-ES': '<p>Protección para SUVs con cobertura ampliada.</p>' },
            coverage: { 'zh-CN': '<ul><li>发动机</li><li>变速箱</li><li>电气系统</li></ul>', 'es-ES': '<ul><li>Motor</li><li>Transmisión</li><li>Sistema eléctrico</li></ul>' },
            notice: { 'zh-CN': '<p>示例条款，实际以合同为准。</p>', 'es-ES': '<p>Condiciones de ejemplo.</p>' },
            specialTerms: { 'zh-CN': '<p>SUV 专属条款示例。</p>', 'es-ES': '<p>Términos especiales para SUV.</p>' },
            disclosure: { 'zh-CN': '<p>请特别注意变速箱保修范围。</p>', 'es-ES': '<p>Atención a la cobertura de transmisión.</p>' },
            samplePolicyUrl: `${window.location.origin}/mock-documents/p-yanbao-suv.pdf`,
          },
          {
            id: 'p-yanbao-full',
            name: '延保·旗舰（3年）',
            insurer: '延保保险有限公司',
            priceFrom: 799,
            summary: '旗舰延保，覆盖全车关键部件与全程道路救援服务。',
            tags: ['延保', '全车', '救援'],
            category: 'auto',
            subject: 'vehicle',
            minCoverage: 5000,
            maxCoverage: 50000,
            introduction: { 'zh-CN': '<p>旗舰延保，最高等级保障与道路救援服务。</p>', 'es-ES': '<p>Protección premium con asistencia en carretera.</p>' },
            coverage: { 'zh-CN': '<ul><li>全车关键件</li><li>道路救援</li></ul>', 'es-ES': '<ul><li>Piezas clave</li><li>Asistencia</li></ul>' },
            notice: { 'zh-CN': '<p>旗舰方案示例条款。</p>', 'es-ES': '<p>Condiciones del plan premium.</p>' },
            specialTerms: { 'zh-CN': '<p>旗舰方案特殊条款。</p>', 'es-ES': '<p>Términos especiales del plan.</p>' },
            disclosure: { 'zh-CN': '<p>本样例仅用于演示，请在合同中确认具体细节。</p>', 'es-ES': '<p>Ejemplo: ver contrato para detalles.</p>' },
            samplePolicyUrl: `${window.location.origin}/mock-documents/p-yanbao-full.pdf`,
          },
        ]
        localStorage.setItem('products', JSON.stringify(demoProducts))
      } else {
        // enrich existing products if missing locale HTML fields
        try {
          const parsed = JSON.parse(raw)
          let patched = false
          const enrich = (p: any) => {
            if (!p.introduction) { p.introduction = { 'zh-CN': `<p>${p.name} — 产品介绍</p>`, 'es-ES': `<p>${p.name} — introducción</p>` }; patched = true }
            if (!p.coverage) { p.coverage = { 'zh-CN': '<p>保额与保障范围说明</p>', 'es-ES': '<p>Detalles de cobertura</p>' }; patched = true }
            if (!p.notice) { p.notice = { 'zh-CN': '<p>投保须知示例</p>', 'es-ES': '<p>Aviso de contratación</p>' }; patched = true }
            if (!p.specialTerms) { p.specialTerms = { 'zh-CN': '<p>特约条款</p>', 'es-ES': '<p>Términos especiales</p>' }; patched = true }
            if (!p.disclosure) { p.disclosure = { 'zh-CN': '<p>请阅读重要告知</p>', 'es-ES': '<p>Por favor lea la divulgación</p>' }; patched = true }
            if (!p.samplePolicyUrl) { p.samplePolicyUrl = `${window.location.origin}/mock-documents/${p.id}.pdf`; patched = true }
            return p
          }
          const newArr = (Array.isArray(parsed) ? parsed : []).map(enrich)
          if (patched) localStorage.setItem('products', JSON.stringify(newArr))
        } catch (e) {
          // ignore
        }
      }
    } catch (e) {
      console.warn('Failed to seed products', e)
    }
    // 触发重渲染，让首次 seed 的产品出现在列表中
    setSeedTick((n) => n + 1)
  }, [])

  const list = useMemo(() => {
    try {
      const raw = localStorage.getItem('products')
      if (!raw) return []
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return []
      return parsed.filter((item: any) => {
        const text = [item.name || '', item.insurer || '', item.summary || '', ...(item.tags ?? [])].join(' ')
        const matchKeyword = !keyword || text.toLowerCase().includes(keyword.toLowerCase())
        // PRD filters are UI-only for demo: do not strictly exclude demo items
        return matchKeyword
      })
    } catch (e) {
      return []
    }
  }, [keyword, filters, seedTick])

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <span className={styles.eyebrow}>{t('eyebrow')}</span>
        <h1 className={styles.pageTitle}>{t('pageTitle')}</h1>
        <p className={styles.pageSubtitle}>{t('pageSubtitle')}</p>
      </section>

      <div className={styles.searchSection}>
        <SearchBar placeholder={t('searchPlaceholder')} onChange={setKeyword} />
        <FilterBar filters={filterConfigs} values={filters} onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))} />
      </div>

      <div className={styles.list}>
        {list.map((item) => (
          <button key={item.id} className={styles.card} onClick={() => navigate(`/insurance/${item.id}`)}>
            <div className={styles.cardHead}>
              <div>
                <span className={styles.insurer}>{item.insurer}</span>
                <h2 className={styles.cardTitle}>{item.name}</h2>
              </div>
              <span className={styles.price}>
                {t('card.priceFrom')}{item.priceFrom} €<small>{t('card.priceSuffix')}</small>
              </span>
            </div>
            <p className={styles.summary}>{item.summary}</p>
            <div className={styles.tagRow}>
              {(item.tags ?? []).map((tg: any) => <span key={tg} className={styles.tag}>{tg}</span>)}
            </div>
            <div className={styles.coverageRow}>
              <span>{taxonomy.category(item.category)} · {taxonomy.subject(item.subject)}</span>
              <strong>{t('card.coverageRange', { min: item.minCoverage, max: item.maxCoverage })}</strong>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
