/**
 * Taxonomy 翻译工具：把 mock 数据里的中文 enum（category / subject / insurer）
 * 翻译成当前 locale 的展示文本。缺译时回退到原 key。
 */
import { useTranslation } from 'react-i18next'

const FALLBACK_LABEL = (key: string) => key

export function useTaxonomy() {
  const { t } = useTranslation('taxonomy')

  const translate = (group: 'category' | 'subject' | 'insurer', key: string) =>
    t(`${group}.${key}`, { defaultValue: FALLBACK_LABEL(key) })

  return {
    category: (key: string) => translate('category', key),
    subject: (key: string) => translate('subject', key),
    insurer: (key: string) => translate('insurer', key),
  }
}
