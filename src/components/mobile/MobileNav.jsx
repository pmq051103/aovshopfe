import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSelector } from 'react-redux'
import { useSiteSettings } from '../../context/SiteSettingsContext'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faHouse,
  faGamepad,
  faTrophy,
  faRankingStar,
  faRightToBracket,
  faNewspaper,
} from '@fortawesome/free-solid-svg-icons'

export default function MobileNav() {
  const { user } = useSelector(s => s.auth)
  const { settings } = useSiteSettings()

  const showRanking = settings.show_ranking !== 'false'

  const NAV_ITEMS_USER = [
    { to: '/', icon: faHouse, label: 'Trang Chủ', end: true },
    { to: '/shop', icon: faGamepad, label: 'Shop Acc' },
    { to: '/owned-accounts', icon: faTrophy, label: 'Kho Acc' },

    ...(showRanking
      ? [{ to: '/ranking', icon: faRankingStar, label: 'BXH' }]
      : []),

    { to: '/news', icon: faNewspaper, label: 'Tin Tức' },
  ]

  const NAV_ITEMS_GUEST = [
    { to: '/', icon: faHouse, label: 'Trang Chủ', end: true },
    { to: '/shop', icon: faGamepad, label: 'Shop Acc' },

    ...(showRanking
      ? [{ to: '/ranking', icon: faRankingStar, label: 'BXH' }]
      : []),

    { to: '/news', icon: faNewspaper, label: 'Tin Tức' },
    { to: '/login', icon: faRightToBracket, label: 'Đăng Nhập' },
  ]

  const items = user ? NAV_ITEMS_USER : NAV_ITEMS_GUEST

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-dark-800/95 backdrop-blur-xl border-t border-white/5 safe-area-pb">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl transition-all min-w-[52px] ${
                isActive
                  ? 'text-neon-pink'
                  : 'text-white/40 hover:text-white/70'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <motion.div
                  animate={isActive ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className={`text-lg relative ${
                    isActive
                      ? 'drop-shadow-[0_0_8px_rgba(255,45,115,0.8)]'
                      : ''
                  }`}
                >
                  <FontAwesomeIcon icon={item.icon} />

                  {isActive && (
                    <motion.div
                      layoutId="mobile-nav-indicator"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-neon-pink rounded-full"
                    />
                  )}
                </motion.div>

                <span
                  className={`text-[9px] font-display font-medium leading-none ${
                    isActive ? 'text-neon-pink' : ''
                  }`}
                >
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}