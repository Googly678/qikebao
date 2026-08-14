import type { UserInfo } from '../store/auth'

/**
 * 西班牙 SME 集团：用作整个 portal 的默认登录用户 / 被保险人。
 * 餐厅 + 超市 + 物流三个子业态。
 */
export const mockUserInfo: UserInfo = {
  id: 'u001',
  name: 'María García',
  phone: '+34 612 345 678',
  companyName: 'Grupo Hostelero Mediterráneo S.L.',
  companyId: 'comp001',
  role: 'admin',
  avatar: '',
}

export const mockCompanyInfo = {
  id: 'comp001',
  name: 'Grupo Hostelero Mediterráneo S.L.',
  licenseNo: 'B-12345678',
  address: 'C/ Velázquez 100, 5º Izq., 28006 Madrid',
  contactName: 'María García',
  contactPhone: '+34 612 345 678',
  industry: 'Hostelería y restauración',
  // NIF 与 IBAN 是测试用样本（mod-97 / DNI 控制位都校验通过）
  nif: '12345678Z',
  iban: 'ES91 2100 0418 4502 0005 1332',
}
