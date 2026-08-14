import { useEffect } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import BottomNav from './components/BottomNav/BottomNav'
import IMModal from './components/IMModal/IMModal'
import Toast from './components/Toast/Toast'
import MessagesPage from './pages/Messages/MessagesPage'
import PolicyPage from './pages/Policy/PolicyPage'
import PolicyDetailPage from './pages/Policy/PolicyDetailPage'
import PolicyDocumentPage from './pages/Policy/PolicyDocumentPage'
import InsurancePage from './pages/Insurance/InsurancePage'
import InsuranceDetailPage from './pages/Insurance/InsuranceDetailPage'
import InsuranceCheckoutPage from './pages/Insurance/InsuranceCheckoutPage'
import PartnerLandingPage from './pages/PartnerLandingPage'
import MinePage from './pages/Mine/MinePage'
import AccountInfoPage from './pages/Mine/AccountInfoPage'
import SettingsPage from './pages/Mine/SettingsPage'
import PasswordPage from './pages/Mine/PasswordPage'
import PaymentSettingsPage from './pages/Mine/PaymentSettingsPage'
import RenewalCenterPage from './pages/Renewal/RenewalCenterPage'
import { useAuthStore } from './store/auth'
import { mockUserInfo } from './mocks/user'
import MockPaymentPage from './pages/Payment/MockPaymentPage'
import VehiclesPage from './pages/Mine/VehiclesPage'
import ConfirmVehiclePage from './pages/Insurance/ConfirmVehiclePage'
import ContractTermsPage from './pages/Insurance/ContractTermsPage'
import ClaimsPage from './pages/Claims/ClaimsPage'
import ClaimCreatePage from './pages/Claims/ClaimCreatePage'
import ClaimDetailPage from './pages/Claims/ClaimDetailPage'

export default function App() {
  const { isLoggedIn, setAuth } = useAuthStore()

  // 开发阶段默认自动登录 mock 用户
  if (!isLoggedIn) {
    setAuth('mock-token', mockUserInfo)
  }

  // 启动时清洗 localStorage('policies')，去重并写回，避免历史重复 key 导致 React 警告
  useEffect(() => {
    try {
      const raw = localStorage.getItem('policies')
      if (!raw) return
      const arr = JSON.parse(raw)
      if (!Array.isArray(arr) || arr.length === 0) return
      const seen = new Set()
      const deduped = []
      for (const p of arr) {
        const id = p && (p.id || p.policyNo || JSON.stringify(p))
        if (!id) continue
        if (!seen.has(id)) { seen.add(id); deduped.push(p) }
      }
      // if length changed, write back
      if (deduped.length !== arr.length) {
        localStorage.setItem('policies', JSON.stringify(deduped))
        console.info('[startup] cleaned policies localStorage, removed', arr.length - deduped.length)
      }
    } catch (e) {
      // ignore parsing errors
      console.warn('[startup] failed to clean policies localStorage', e)
    }
  }, [])

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Toast />
      <Routes>
        <Route element={<ShellLayout />}>
          <Route path="/" element={<Navigate to="/insurance" replace />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/policy" element={<PolicyPage />} />
          <Route path="/policy/:id" element={<PolicyDetailPage />} />
          <Route path="/policy/:id/document" element={<PolicyDocumentPage />} />
          <Route path="/claims" element={<ClaimsPage />} />
          <Route path="/claims/new" element={<ClaimCreatePage />} />
          <Route path="/claims/:id" element={<ClaimDetailPage />} />
          <Route path="/insurance" element={<InsurancePage />} />
          <Route path="/insurance/:id" element={<InsuranceDetailPage />} />
          <Route path="/insurance/:id/checkout" element={<InsuranceCheckoutPage />} />
          <Route path="/insurance/:id/confirm-vehicle" element={<ConfirmVehiclePage />} />
          <Route path="/insurance/:id/contract-terms" element={<ContractTermsPage />} />
          <Route path="/partner/landing" element={<PartnerLandingPage />} />
          <Route path="/mine" element={<MinePage />} />
          <Route path="/mine/vehicles" element={<VehiclesPage />} />
          <Route path="/mine/account" element={<AccountInfoPage />} />
          <Route path="/mine/settings" element={<SettingsPage />} />
          <Route path="/mine/password" element={<PasswordPage />} />
          <Route path="/mine/payment" element={<PaymentSettingsPage />} />
          <Route path="/renewal" element={<RenewalCenterPage />} />
          {/* inquiry/quote pages removed per request */}
          <Route path="/payment" element={<MockPaymentPage />} />
        </Route>
      </Routes>
      <IMModal />
    </BrowserRouter>
  )
}

function ShellLayout() {
  return (
    <div className="page-container">
      <Outlet />
      <BottomNav />
    </div>
  )
}
