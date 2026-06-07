import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Toaster } from 'react-hot-toast'
import { fetchMe } from './store/slices/authSlice'
import { useSocket } from './hooks/useSocket'

import MainLayout from './components/layout/MainLayout'
import AdminLayout from './components/layout/AdminLayout'

import HomePage from './pages/HomePage'
import ShopPage from './pages/shop/ShopPage'
import ShopCategoryPage from './pages/shop/ShopCategoryPage'
import AccountDetailPage from './pages/shop/AccountDetailPage'
import LuckyWheelPage from './pages/LuckyWheelPage'
import MysteryBoxCategoryPage from './pages/MysteryBoxCategoryPage'
import MysteryBoxAccountsPage from './pages/MysteryBoxAccountsPage'
import MysteryBoxAccountDetailPage from './pages/MysteryBoxAccountDetailPage'
import AdminMysteryBoxCategories from './pages/admin/AdminMysteryBoxCategories'
import AdminMysteryBoxAccounts from './pages/admin/AdminMysteryBoxAccounts'
import DepositPage from './pages/DepositPage'
import CardShopPage from './pages/CardShopPage'
import RankingPage from './pages/RankingPage'
import NewsPage from './pages/NewsPage'
import NewsDetailPage from './pages/NewsDetailPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import ProfilePage from './pages/user/ProfilePage'
import TransactionHistoryPage from './pages/user/TransactionHistoryPage'
import TicketsPage from './pages/user/TicketsPage'
import OwnedAccountsPage from './pages/user/OwnedAccountsPage'
import TopupPage from './pages/user/TopupPage'

import AdminDashboard from './pages/admin/AdminDashboard'
import AdminAccounts from './pages/admin/AdminAccounts'
import AdminUsers from './pages/admin/AdminUsers'
import AdminDeposits from './pages/admin/AdminDeposits'
import AdminBanners from './pages/admin/AdminBanners'
import AdminWheel from './pages/admin/AdminWheel'
import AdminCoupons from './pages/admin/AdminCoupons'
import AdminOrders from './pages/admin/AdminOrders'
import AdminTickets from './pages/admin/AdminTickets'
import AdminSettings from './pages/admin/AdminSettings'
import AdminTopup from './pages/admin/AdminTopup'
import AdminCategories from './pages/admin/AdminCategories'
import AdminNews from './pages/admin/AdminNews'
import AdminAnnouncements from './pages/admin/AdminAnnouncements'
import AdminCardConfig from './pages/admin/AdminCardConfig'
import AdminRanking from './pages/admin/AdminRanking'
import AdminAIKnowledge from './pages/admin/AdminAIKnowledge'
import AdminSkinTemplates from './pages/admin/AdminSkinTemplates'
import AIChatPage from './pages/AIChatPage'

import LoadingScreen from './components/common/LoadingScreen'
import MaintenancePage from './pages/MaintenancePage'
import NotFoundPage from './pages/NotFoundPage'
import { SiteSettingsProvider, useSiteSettings } from './context/SiteSettingsContext'
import { useLocation } from 'react-router-dom'

import ScrollToTop from './components/common/ScrollToTop'

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, initialized } = useSelector(s => s.auth)
  if (!initialized) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && user.role !== 'ADMIN') return <Navigate to="/" replace />
  return children
}

const GuestRoute = ({ children }) => {
  const { user } = useSelector(s => s.auth)
  if (user) return <Navigate to="/" replace />
  return children
}

// Guard bảo trì: chặn user thường, nhưng cho phép:
// - Trang /login, /register, /forgot-password, /reset-password (để admin đăng nhập lại)
// - Toàn bộ route /admin (đã bảo vệ bởi ProtectedRoute adminOnly)
const MaintenanceGuard = ({ children }) => {
  const { settings, loading } = useSiteSettings()
  const { user } = useSelector(s => s.auth)
  const { pathname } = useLocation()

  if (loading) return <LoadingScreen />

  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password') || pathname.startsWith('/reset-password')
  const isAdminRoute = pathname.startsWith('/admin')

  if (settings.maintenance_mode === 'true' && !isAuthRoute && !isAdminRoute && user?.role !== 'ADMIN') {
    return <MaintenancePage message={settings.maintenance_message} />
  }

  return children
}

// Guard feature: nếu admin tắt tính năng, user vào sẽ thấy 404
const FeatureGuard = ({ settingKey, children }) => {
  const { settings, loading } = useSiteSettings()
  if (loading) return <LoadingScreen />
  if (settings[settingKey] === 'false') return <NotFoundPage />
  return children
}

function AppContent() { useSocket(); return null }

export default function App() {
  const dispatch = useDispatch()
  const { initialized } = useSelector(s => s.auth)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (token) dispatch(fetchMe())
    else dispatch({ type: 'auth/fetchMe/rejected' })
  }, [dispatch])

  if (!initialized) return <LoadingScreen />

  return (
    <SiteSettingsProvider>
    <BrowserRouter>
      <AppContent />
      <ScrollToTop />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { background: '#14141f', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)', fontFamily: "'Exo 2', sans-serif" }
        }}
      />
      <MaintenanceGuard>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path="shop" element={<ShopCategoryPage />} />
            <Route path="shop/acc/:id" element={<AccountDetailPage />} />
            <Route path="shop/:slug" element={<ShopPage />} />
            <Route path="lucky-wheel" element={<FeatureGuard settingKey="show_wheel_section"><LuckyWheelPage /></FeatureGuard>} />
            <Route path="mystery-box" element={<FeatureGuard settingKey="show_mystery_box"><MysteryBoxCategoryPage /></FeatureGuard>} />
            <Route path="mystery-box/:slug" element={<FeatureGuard settingKey="show_mystery_box"><MysteryBoxAccountsPage /></FeatureGuard>} />
            <Route path="mystery-box/account/:id" element={<FeatureGuard settingKey="show_mystery_box"><MysteryBoxAccountDetailPage /></FeatureGuard>} />
            <Route path="ranking" element={<FeatureGuard settingKey="show_ranking"><RankingPage /></FeatureGuard>} />
            <Route path="news" element={<NewsPage />} />
            <Route path="news/:slug" element={<NewsDetailPage />} />
            <Route path="deposit" element={<ProtectedRoute><DepositPage /></ProtectedRoute>} />
            <Route path="card-shop" element={<FeatureGuard settingKey="show_card_shop"><CardShopPage /></FeatureGuard>} />
            <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="transactions" element={<ProtectedRoute><TransactionHistoryPage /></ProtectedRoute>} />
            <Route path="tickets" element={<ProtectedRoute><TicketsPage /></ProtectedRoute>} />
            <Route path="owned-accounts" element={<ProtectedRoute><OwnedAccountsPage /></ProtectedRoute>} />
            <Route path="topup" element={<ProtectedRoute><TopupPage /></ProtectedRoute>} />
          </Route>

          <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

          <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="accounts" element={<AdminAccounts />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="deposits" element={<AdminDeposits />} />
            <Route path="banners" element={<AdminBanners />} />
            <Route path="wheel" element={<AdminWheel />} />
            <Route path="mystery-box-categories" element={<AdminMysteryBoxCategories />} />
            <Route path="mystery-box-accounts" element={<AdminMysteryBoxAccounts />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="tickets" element={<AdminTickets />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="topup" element={<AdminTopup />} />
            <Route path="card-config" element={<AdminCardConfig />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="ranking" element={<AdminRanking />} />
            <Route path="news" element={<AdminNews />} />
            <Route path="announcements" element={<AdminAnnouncements />} />
             <Route path="ai-knowledge" element={<AdminAIKnowledge />} />
             <Route path="skin-templates" element={<AdminSkinTemplates />} />
          </Route>

          <Route path="/ai-chat" element={<FeatureGuard settingKey="show_chatbox"><AIChatPage /></FeatureGuard>} />
                    <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </MaintenanceGuard>
    </BrowserRouter>
    </SiteSettingsProvider>
  )
}