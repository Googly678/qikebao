import type { InsuranceProduct, InsuranceDetail } from '../api/insurance'

export const mockCategories = ['延保产品']
export const mockSubjects = ['车辆延保']
export const mockInsurers = ['我方延保平台']

export const mockInsuranceProducts: InsuranceProduct[] = [
  {
    id: 'yb001',
    name: '延保服务 - 延长保修',
    insurer: '我方延保平台',
    insurerLogo: '',
    category: '延保产品',
    subject: '车辆延保',
    minCoverage: 0,
    maxCoverage: 0,
    priceFrom: 199,
    tags: ['延保', '电子签章', '无感跳转'],
    summary: '为车主提供车辆延长保修服务，支持在第三方渠道一键跳转签约并完成支付。',
  },
]

const detailYB001: Pick<InsuranceDetail, 'introduction' | 'coverage' | 'notice' | 'specialTerms' | 'disclosure'> = {
  introduction: {
    'zh-CN': `<h3>延保服务（延长保修）</h3><p>本延保服务为车主在原厂质保到期后提供延长保修保障，支持在第三方渠道（人车行）一键跳转签约与支付，签约后协议将实时回传给合作渠道以供用户下载。</p><p>购买流程：点击“立即购买” → 跳转至我方签约页（携带加密参数） → 阅读并签署协议 → 支付成功 → 协议与发票回传。</p>`,
    'es-ES': `<p>延保服务（西班牙语占位）</p>`,
    'en-ES': `<p>Extended warranty service (placeholder)</p>`,
  },
  coverage: {
    'zh-CN': `<p>延保覆盖车辆整车关键部件（发动机、变速器、电控系统等），保障期限依据所选 SKU 为 1/2/3 年不等，详见产品说明。</p>`,
    'es-ES': `<p>Coverage placeholder</p>`,
    'en-ES': `<p>Coverage placeholder</p>`,
  },
  notice: {
    'zh-CN': `<p><strong>投保须知</strong></p><ul><li>投保需提供车辆 VIN、车主手机号。</li><li>签约过程中我方平台将生成电子协议并回传合作方。</li><li>支付成功后将生成电子发票并可在合作方查看下载。</li></ul>`,
    'es-ES': `<p>Notice placeholder</p>`,
    'en-ES': `<p>Notice placeholder</p>`,
  },
  specialTerms: {
    'zh-CN': `<p>电子签署后协议生效，理赔请按理赔流程提交材料；具体除外责任以合同为准。</p>`,
    'es-ES': `<p>Special terms placeholder</p>`,
    'en-ES': `<p>Special terms placeholder</p>`,
  },
  disclosure: {
    'zh-CN': `<p><strong>重要告知</strong></p><ul><li>本产品涉及用户隐私（VIN、手机号），双方平台需按合规要求加密传输并做好用户告知。</li><li>未如实填写信息可能影响合同效力与理赔。</li></ul>`,
    'es-ES': `<p>Disclosure placeholder</p>`,
    'en-ES': `<p>Disclosure placeholder</p>`,
  },
}

function genericDetail(p: InsuranceProduct): Pick<InsuranceDetail, 'introduction' | 'coverage' | 'notice' | 'specialTerms' | 'disclosure'> {
  return {
    introduction: {
      'zh-CN': `<p>${p.name} 由 ${p.insurer} 承保，${p.summary}</p>`,
      'es-ES': `<p>${p.name} suscrito por ${p.insurer}. ${p.summary}</p>`,
      'en-ES': `<p>${p.name} underwritten by ${p.insurer}. ${p.summary}</p>`,
    },
    coverage: {
      'zh-CN': `<p>最低保额：${p.minCoverage} 万元，最高保额：${p.maxCoverage} 万元，起始保费：${p.priceFrom} 元/年</p>`,
      'es-ES': `<p>Capital mínimo: ${p.minCoverage} 千 €. Capital máximo: ${p.maxCoverage} 千 €. Prima desde: ${p.priceFrom} €/año.</p>`,
      'en-ES': `<p>Minimum coverage: ${p.minCoverage}k €. Maximum coverage: ${p.maxCoverage}k €. Premium from: ${p.priceFrom} €/yr.</p>`,
    },
    notice: {
      'zh-CN': '<p>请详细阅读本保险产品说明书，了解保障范围、除外责任及理赔流程。</p>',
      'es-ES': '<p>Lee detenidamente la nota informativa del producto para conocer el alcance de las coberturas、exclusiones和 el proceso de siniestros。</p>',
      'en-ES': '<p>Please read the product information document to understand coverage, exclusions, and claims procedures.</p>',
    },
    specialTerms: {
      'zh-CN': '<p>具体特约条款以保险合同为准。</p>',
      'es-ES': '<p>Las cláusulas especiales se rigen por lo dispuesto en la póliza。</p>',
      'en-ES': '<p>Special terms are governed by the policy contract.</p>',
    },
    disclosure: {
      'zh-CN': '<p>请如实填写投保信息，隐瞒或虚假告知将影响理赔。</p>',
      'es-ES': '<p>Facilita la información de forma veraz; las ocultaciones o declaraciones falsas afectarán a la indemnización。</p>',
      'en-ES': '<p>Provide accurate information; concealment or misrepresentation will affect claims.</p>',
    },
  }
}

export const mockInsuranceDetails: Record<string, InsuranceDetail> = {
  yb001: {
    ...mockInsuranceProducts[0],
    ...detailYB001,
    samplePolicyUrl: '/mock-documents/sample-policy-yb001.pdf',
  },
}

mockInsuranceProducts.forEach((p) => {
  if (!mockInsuranceDetails[p.id]) {
    mockInsuranceDetails[p.id] = {
      ...p,
      ...genericDetail(p),
      samplePolicyUrl: `/mock-documents/sample-policy-${p.id}.pdf`,
    }
  }
})
