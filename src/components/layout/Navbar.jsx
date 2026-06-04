import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { logoutUser } from '../../store/slices/authSlice'
import { formatCurrency } from '../../utils/helpers'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useSiteSettings } from '../../context/SiteSettingsContext'
import {
  faGamepad,
  faGift,
  faTrophy,
  faBell,
  faUser,
  faClockRotateLeft,
  faCoins,
  faRightFromBracket,
  faGear,
  faChevronDown,
  faMoneyBillWave,
  faBoxOpen,
  faWallet,
  faNewspaper,
  faCreditCard,
} from '@fortawesome/free-solid-svg-icons'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [miniGameMenuOpen, setMiniGameMenuOpen] = useState(false)
  const [serviceMenuOpen, setServiceMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unread, setUnread] = useState(0)

  const { user } = useSelector(s => s.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { settings: siteSettings } = useSiteSettings()

  const userMenuRef = useRef(null)
  const miniGameMenuRef = useRef(null)
  const serviceMenuRef = useRef(null)

  const CLOUDINARY_ASSETS =
    import.meta.env.VITE_CLOUDINARY_ASSETS ||
    'https://res.cloudinary.com/dd9yijuqh/image/upload'

  const mainLinks = [
    { to: '/shop', label: 'Shop Acc', icon: faGamepad },

    ...(siteSettings.show_ranking !== 'false'
      ? [{ to: '/ranking', label: 'Bảng Xếp Hạng', icon: faTrophy }]
      : []),

    { to: '/news', label: 'Tin Tức', icon: faNewspaper },
  ]

  const miniGameLinks = [
    ...(siteSettings.show_wheel_section !== 'false'
      ? [{ to: '/lucky-wheel', label: 'Vòng Quay', icon: faGift }]
      : []),

    ...(siteSettings.show_mystery_box !== 'false'
      ? [{ to: '/mystery-box', label: 'Túi Mù', icon: faBoxOpen }]
      : []),
  ]

  const serviceLinks = [
    { to: '/card-shop', label: 'Mua Thẻ', icon: faCreditCard },

    ...(user
      ? [{ to: '/topup', label: 'Nạp Quân Huy', icon: faCoins }]
      : []),
  ]

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (user) fetchNotifications()
  }, [user])

  useEffect(() => {
    const handleClickOutside = e => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false)
        setNotifOpen(false)
      }

      if (miniGameMenuRef.current && !miniGameMenuRef.current.contains(e.target)) {
        setMiniGameMenuOpen(false)
      }

      if (serviceMenuRef.current && !serviceMenuRef.current.contains(e.target)) {
        setServiceMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications?limit=10')
      setNotifications(data.data || [])
      setUnread(data.unreadCount || 0)
    } catch (e) {}
  }

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all')
      setUnread(0)
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    } catch (e) {}
  }

  const handleLogout = async () => {
    await dispatch(logoutUser())
    toast.success('Đã đăng xuất')
    navigate('/')
  }

  const renderNavLink = link => (
    <NavLink
      key={link.to}
      to={link.to}
      className={({ isActive }) =>
        `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-display font-medium transition-all duration-200 whitespace-nowrap ${
          isActive
            ? 'bg-neon-pink/10 text-neon-pink border border-neon-pink/30'
            : 'text-white/70 hover:text-white hover:bg-white/5'
        }`
      }
    >
      <FontAwesomeIcon icon={link.icon} className="text-sm" />
      {link.label}
    </NavLink>
  )

  const renderDesktopDropdown = ({
    label,
    icon,
    links,
    open,
    setOpen,
    menuRef,
  }) => {
    if (!links.length) return null

    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => {
            setOpen(!open)

            if (label === 'Mini Game') {
              setServiceMenuOpen(false)
            } else {
              setMiniGameMenuOpen(false)
            }
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-display font-medium transition-all duration-200 whitespace-nowrap text-white/70 hover:text-white hover:bg-white/5"
        >
          <FontAwesomeIcon icon={icon} className="text-sm" />
          {label}
          <FontAwesomeIcon
            icon={faChevronDown}
            className={`text-xs transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.96 }}
              className="absolute left-0 top-11 w-56 gaming-card border border-white/10 shadow-2xl overflow-hidden"
            >
              {links.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 transition-colors text-sm ${
                      isActive
                        ? 'bg-neon-pink/10 text-neon-pink'
                        : 'text-white/75 hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  <FontAwesomeIcon icon={item.icon} className="w-4" />
                  {item.label}
                </NavLink>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  const renderMobileLinks = links =>
    links.map(link => (
      <NavLink
        key={link.to}
        to={link.to}
        onClick={() => setMenuOpen(false)}
        className={({ isActive }) =>
          `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-display font-medium transition-colors ${
            isActive
              ? 'bg-neon-pink/10 text-neon-pink'
              : 'text-white/70 hover:text-white hover:bg-white/5'
          }`
        }
      >
        <span className="text-lg">
          <FontAwesomeIcon icon={link.icon} />
        </span>
        {link.label}
      </NavLink>
    ))

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-dark-800/95 backdrop-blur-xl border-b border-neon-pink/20 shadow-[0_4px_30px_rgba(255,45,115,0.1)]'
          : 'bg-transparent'
      }`}
    >
      <div className="page-container">
        <div className="flex items-center h-20">
          <Link to="/" className="flex items-center group shrink-0">
            {siteSettings.site_logo ? (
              <img
                src={siteSettings.site_logo}
                alt={siteSettings.site_name || 'AOVShop.com'}
                className="h-14 sm:h-16 w-auto max-w-[210px] sm:max-w-[260px] object-contain"
              />
            ) : (
              <img
                src="/logo.png"
                alt="AOVShop.com"
                className="h-14 sm:h-16 w-auto max-w-[210px] sm:max-w-[260px] object-contain"
              />
            )}
          </Link>

          <div className="hidden lg:flex items-center gap-1 ml-8 mr-auto">
            {mainLinks.map(renderNavLink)}

            {renderDesktopDropdown({
              label: 'Mini Game',
              icon: faGift,
              links: miniGameLinks,
              open: miniGameMenuOpen,
              setOpen: setMiniGameMenuOpen,
              menuRef: miniGameMenuRef,
            })}

            {renderDesktopDropdown({
              label: 'Dịch Vụ',
              icon: faWallet,
              links: serviceLinks,
              open: serviceMenuOpen,
              setOpen: setServiceMenuOpen,
              menuRef: serviceMenuRef,
            })}
          </div>

          <div className="flex items-center gap-3 ml-auto" ref={userMenuRef}>
            {user ? (
              <>
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-600 border border-yellow-500/20">
                  <FontAwesomeIcon icon={faWallet} className="text-yellow-400 text-sm" />
                  <span className="font-display font-bold text-sm text-yellow-300">
                    {formatCurrency(user.balance)}
                  </span>
                </div>

                {user.quanHuyBalance > 0 && (
                  <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-600 border border-orange-500/20">
                    <img
                      src={`${CLOUDINARY_ASSETS}/v1779544072/quan-huy_eu5yth.png`}
                      alt="QH"
                      className="w-4 h-4 object-contain"
                    />
                    <span className="font-display font-bold text-sm text-orange-300">
                      {(user.quanHuyBalance || 0).toLocaleString('vi-VN')} QH
                    </span>
                  </div>
                )}

                <div className="relative">
                  <button
                    onClick={() => {
                      setNotifOpen(!notifOpen)
                      setUserMenuOpen(false)
                      if (!notifOpen) fetchNotifications()
                    }}
                    className="relative p-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <FontAwesomeIcon icon={faBell} className="text-lg text-white" />
                    {unread > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-neon-pink rounded-full text-xs text-white flex items-center justify-center font-bold animate-bounce">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {notifOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                       className="
fixed left-4 right-4 top-16
  max-w-[320px] mx-auto
  gaming-card border border-white/10 shadow-2xl z-[9998]

  lg:absolute lg:left-auto lg:right-0 lg:mx-0
  lg:max-w-none lg:w-[260px] lg:top-12"
                      >
                        <div className="flex items-center justify-between p-3 border-b border-white/5">
                          <span className="font-display font-bold text-white text-sm">Thông báo</span>

                          {unread > 0 && (
                            <button
                              onClick={markAllRead}
                              className="text-xs text-neon-pink hover:text-neon-pink/80"
                            >
                              Đọc tất cả
                            </button>
                          )}
                        </div>

                        <div className="max-h-44 lg:max-h-60 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="p-6 text-center text-white/40 text-sm">
                              Không có thông báo
                            </div>
                          ) : (
                            notifications.map(n => (
                              <div
                                key={n.id}
                                className={`px-2.5 py-1.5 border-b border-white/5 hover:bg-white/3 transition-colors ${
                                  !n.isRead ? 'bg-neon-pink/5' : ''
                                }`}
                              >
                                <div className="font-medium text-xs text-white leading-snug">{n.title}</div>
                                <div className="text-[11px] text-white/50 mt-0.5 leading-snug">{n.message}</div>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="relative">
                  <button
                    onClick={() => {
                      setUserMenuOpen(!userMenuOpen)
                      setNotifOpen(false)
                    }}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <img
                      src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                      alt={user.displayName}
                      className="w-8 h-8 rounded-lg border border-neon-pink/30 object-cover"
                    />

                    <span className="hidden sm:block text-sm font-display font-medium text-white/90 max-w-[100px] truncate">
                      {user.displayName || user.username}
                    </span>

                    <FontAwesomeIcon
                      icon={faChevronDown}
                      className={`w-4 h-4 text-white/50 transition-transform ${
                        userMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 top-12 w-56 gaming-card border border-white/10 shadow-2xl overflow-hidden"
                      >
                        <div className="p-3 border-b border-white/5 bg-gradient-to-r from-neon-pink/10 to-neon-purple/10">
                          <div className="font-bold text-white text-sm">
                            {user.displayName || user.username}
                          </div>

                          <div className="text-xs text-white/40">{user.email}</div>

                          {user.role === 'ADMIN' && (
                            <span className="inline-block mt-1 px-2 py-0.5 bg-neon-pink/20 text-neon-pink text-xs rounded font-bold">
                              ADMIN
                            </span>
                          )}
                        </div>

                        {[
                          { to: '/profile', icon: faUser, label: 'Trang cá nhân' },
                          { to: '/owned-accounts', icon: faTrophy, label: 'Kho Tài Khoản' },
                          { to: '/topup', icon: faCoins, label: 'Nạp Quân Huy' },
                          { to: '/transactions', icon: faClockRotateLeft, label: 'Lịch sử giao dịch' },
                          { to: '/deposit', icon: faMoneyBillWave, label: 'Nạp tiền' },
                          ...(user.role === 'ADMIN'
                            ? [{ to: '/admin', icon: faGear, label: 'Quản trị' }]
                            : []),
                        ].map(item => (
                          <Link
                            key={item.to}
                            to={item.to}
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-white/80 hover:text-white text-sm"
                          >
                            <FontAwesomeIcon icon={item.icon} className="w-4" />
                            {item.label}
                          </Link>
                        ))}

                        <div className="border-t border-white/5">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-500/10 transition-colors text-red-400 text-sm"
                          >
                            <FontAwesomeIcon icon={faRightFromBracket} className="w-4" />
                            Đăng xuất
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-neon py-2 px-4 text-xs">
                  Đăng Nhập
                </Link>

                <Link to="/register" className="btn-primary py-2 px-4 text-xs hidden sm:block">
                  Đăng Ký
                </Link>
              </div>
            )}

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <div className="w-5 flex flex-col gap-1">
                <span
                  className={`block h-0.5 bg-white transition-all ${
                    menuOpen ? 'rotate-45 translate-y-1.5' : ''
                  }`}
                />
                <span
                  className={`block h-0.5 bg-white transition-all ${
                    menuOpen ? 'opacity-0' : ''
                  }`}
                />
                <span
                  className={`block h-0.5 bg-white transition-all ${
                    menuOpen ? '-rotate-45 -translate-y-1.5' : ''
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-dark-800/98 backdrop-blur-xl border-t border-white/10"
          >
            <div className="page-container py-4 space-y-1">
              {renderMobileLinks(mainLinks)}

              {miniGameLinks.length > 0 && (
                <div className="pt-2">
                  <div className="px-4 pb-2 text-xs uppercase tracking-wider text-white/30 font-bold">
                    Mini Game
                  </div>

                  {renderMobileLinks(miniGameLinks)}
                </div>
              )}

              {serviceLinks.length > 0 && (
                <div className="pt-2">
                  <div className="px-4 pb-2 text-xs uppercase tracking-wider text-white/30 font-bold">
                    Dịch vụ
                  </div>

                  {renderMobileLinks(serviceLinks)}
                </div>
              )}

              {!user && (
                <div className="flex gap-2 pt-2">
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="btn-neon flex-1 text-center py-2.5 text-xs"
                  >
                    Đăng Nhập
                  </Link>

                  <Link
                    to="/register"
                    onClick={() => setMenuOpen(false)}
                    className="btn-primary flex-1 text-center py-2.5 text-xs"
                  >
                    Đăng Ký
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}