import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { logoutUser } from '../../store/slices/authSlice'
import { clearMenu, selectMenuCount, selectGroupTotal, syncFromServer } from '../../store/slices/adminNotifSlice'
import toast from 'react-hot-toast'
import { useSiteSettings } from '../../context/SiteSettingsContext'
import api from '../../api/axios'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChartLine, faGamepad, faUsers, faClipboardList, faMoneyBillWave,
  faCoins, faFolderOpen, faImage, faDice, faBoxOpen, faGift, faTags,
  faComments, faGear, faHouse, faRightFromBracket, faNewspaper, faBell,
  faStore, faChevronDown, faCreditCard, faTrophy, faRobot, faWandMagicSparkles,
} from '@fortawesome/free-solid-svg-icons'

const adminLinks = [
  { to: '/admin', label: 'Dashboard', icon: faChartLine, end: true },
  {
    label: 'Shop', icon: faStore,
    children: [
      { to: '/admin/categories', label: 'Danh mục', icon: faFolderOpen },
      { to: '/admin/accounts', label: 'Quản lý Acc', icon: faGamepad },
      { to: '/admin/orders', label: 'Đơn hàng', icon: faClipboardList },
      { to: '/admin/coupons', label: 'Coupon', icon: faTags },
    ],
  },
  {
    label: 'Người dùng', icon: faUsers,
    children: [
      { to: '/admin/users', label: 'Tài khoản', icon: faUsers },
      { to: '/admin/deposits', label: 'Nạp tiền', icon: faMoneyBillWave },
      { to: '/admin/card-config', label: 'Thẻ Cào', icon: faCreditCard },
      { to: '/admin/topup', label: 'Quân Huy', icon: faCoins },
      { to: '/admin/tickets', label: 'Tickets', icon: faComments },
    ],
  },
  {
    label: 'Vòng quay', icon: faDice,
    children: [{ to: '/admin/wheel', label: 'Cấu hình', icon: faDice }],
  },
  {
    label: 'Xếp Hạng', icon: faTrophy,
    children: [{ to: '/admin/ranking', label: 'Quản lý rank', icon: faTrophy }],
  },
  {
    label: 'Túi Mù', icon: faGift,
    children: [
      { to: '/admin/mystery-box-categories', label: 'Danh mục', icon: faGift },
      { to: '/admin/mystery-box-accounts', label: 'Accounts', icon: faBoxOpen },
    ],
  },
  {
    label: 'Nội dung', icon: faNewspaper,
    children: [
      { to: '/admin/banners', label: 'Banner', icon: faImage },
      { to: '/admin/news', label: 'Tin tức', icon: faNewspaper },
      { to: '/admin/announcements', label: 'Thông báo', icon: faBell },
    ],
  },
  {
    label: 'AI Chatbot', icon: faRobot,
    children: [
      { to: '/admin/ai-knowledge', label: 'Kiến thức AI', icon: faRobot },
      { to: '/admin/skin-templates', label: 'Skin Templates', icon: faWandMagicSparkles },
    ],
  },
  { to: '/admin/settings', label: 'Cài đặt', icon: faGear },
]

function NotifBadge({ count }) {
  if (!count || count <= 0) return null
  return (
    <motion.span
      key={count}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.5, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-neon-pink text-white text-[10px] font-bold flex items-center justify-center leading-none shadow-[0_0_6px_rgba(255,45,115,0.7)]"
    >
      {count > 99 ? '99+' : count}
    </motion.span>
  )
}

function NavGroup({ item }) {
  const location = useLocation()
  const dispatch = useDispatch()
  const isChildActive = item.children?.some(child =>
    location.pathname === child.to || location.pathname.startsWith(child.to + '/')
  )
  const [open, setOpen] = useState(isChildActive)
  const childRoutes = item.children?.map(c => c.to) || []
  const groupTotal = useSelector(selectGroupTotal(childRoutes))

  return (
    <div>
      <button
        onClick={() => setOpen(prev => !prev)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-display font-medium transition-all ${
          isChildActive ? 'text-neon-pink' : 'text-white/60 hover:text-white hover:bg-white/5'
        }`}
      >
        <span className="text-base w-5 text-center flex-shrink-0">
          <FontAwesomeIcon icon={item.icon} />
        </span>
        <span className="flex-1 text-left">{item.label}</span>
        <AnimatePresence>
          {!open && groupTotal > 0 && <NotifBadge count={groupTotal} />}
        </AnimatePresence>
        <span className="text-xs transition-transform duration-200 flex-shrink-0" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <FontAwesomeIcon icon={faChevronDown} />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="ml-3 pl-3 border-l border-white/10 mt-0.5 space-y-0.5">
              {item.children.map(child => (
                <NavChildLink key={child.to} child={child} onClear={() => dispatch(clearMenu(child.to))} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function NavChildLink({ child, onClear }) {
  const count = useSelector(selectMenuCount(child.to))
  return (
    <NavLink
      to={child.to}
      end={child.end}
      onClick={onClear}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-display transition-all ${
          isActive
            ? 'bg-neon-pink/15 text-neon-pink border border-neon-pink/20'
            : 'text-white/50 hover:text-white hover:bg-white/5'
        }`
      }
    >
      <span className="text-sm w-4 text-center flex-shrink-0">
        <FontAwesomeIcon icon={child.icon} />
      </span>
      <span className="flex-1">{child.label}</span>
      <AnimatePresence>
        {count > 0 && <NotifBadge count={count} />}
      </AnimatePresence>
    </NavLink>
  )
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { user } = useSelector(s => s.auth)
  const dispatch = useDispatch()
  const { settings: siteSettings } = useSiteSettings()
  const navigate = useNavigate()

  const siteName = siteSettings.site_name || 'AOVShop'
  const siteLogo = siteSettings.site_logo

  useEffect(() => {
    const syncBadges = async () => {
      try {
        const { data } = await api.get('/admin/badge-counts')
        if (data.success) dispatch(syncFromServer(data.data))
      } catch {}
    }
    syncBadges()
    const interval = setInterval(syncBadges, 60000)
    return () => clearInterval(interval)
  }, [dispatch])

  const handleLogout = async () => {
    await dispatch(logoutUser())
    toast.success('Đã đăng xuất')
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-dark-900 overflow-hidden">
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 240, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 bg-dark-800 border-r border-white/5 flex flex-col overflow-hidden"
          >
            <div className="p-5 border-b border-white/5">
              <div className="flex items-center gap-3">
                {siteLogo ? (
                  <img src={siteLogo} alt={siteName} className="h-10 w-auto object-contain" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-pink to-neon-purple flex items-center justify-center flex-shrink-0">
                    <span className="font-gaming text-sm font-black text-white">
                      {siteName.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <div className="font-gaming text-sm font-bold text-white">{siteName}</div>
                  <div className="text-[10px] text-neon-pink">Admin Panel</div>
                </div>
              </div>
            </div>

            <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
              {adminLinks.map((link, i) =>
                link.children ? (
                  <NavGroup key={i} item={link} />
                ) : (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.end}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-display font-medium transition-all ${
                        isActive
                          ? 'bg-neon-pink/15 text-neon-pink border border-neon-pink/20'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`
                    }
                  >
                    <span className="text-base w-5 text-center">
                      <FontAwesomeIcon icon={link.icon} />
                    </span>
                    {link.label}
                  </NavLink>
                )
              )}
            </nav>

            <div className="p-3 border-t border-white/5">
              <div className="flex items-center gap-3 p-2 rounded-lg mb-2">
                <img
                  src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`}
                  alt=""
                  className="w-8 h-8 rounded-lg border border-neon-pink/20"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-white text-xs font-medium truncate">{user?.displayName}</div>
                  <div className="text-neon-pink text-[10px]">Administrator</div>
                </div>
              </div>
              <div className="flex gap-2">
                <NavLink
                  to="/"
                  className="flex-1 text-center text-xs py-1.5 rounded bg-white/5 hover:bg-white/10 text-white/50 transition-colors flex items-center justify-center gap-1"
                >
                  <FontAwesomeIcon icon={faHouse} />
                  Site
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="flex-1 text-xs py-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors flex items-center justify-center gap-1"
                >
                  <FontAwesomeIcon icon={faRightFromBracket} />
                  Logout
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-dark-800 border-b border-white/5 flex items-center gap-4 px-5 flex-shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white/50 hover:text-white transition-colors">
            <div className="w-5 flex flex-col gap-1">
              <span className="block h-0.5 bg-current" />
              <span className="block h-0.5 bg-current" />
              <span className="block h-0.5 bg-current" />
            </div>
          </button>
          <div className="flex-1" />
          <div className="text-white/30 text-xs font-mono">Admin Panel — {siteName}</div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}