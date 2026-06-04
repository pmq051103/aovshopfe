// SupportBubble.jsx
import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useSelector } from 'react-redux'
import { useSiteSettings } from '../../context/SiteSettingsContext'
import api from '../../api/axios'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFacebookF } from '@fortawesome/free-brands-svg-icons'
import { faCommentDots, faHeadset, faXmark } from '@fortawesome/free-solid-svg-icons'

function ZaloIcon() {
  return (
    <div className="relative w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-inner">
      <span className="text-[#0068FF] font-black text-[9px] leading-none">
        Zalo
      </span>
    </div>
  )
}

export default function SupportBubble() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useSelector(s => s.auth)
  const { settings } = useSiteSettings()

  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)

  const hidden =
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/tickets')

  useEffect(() => {
    if (!user || hidden) return
    api.get('/tickets/my/unread-count')
      .then(r => setUnread(r.data.data?.count || 0))
      .catch(() => {})
  }, [user, location.pathname, hidden])

  // Close when navigating
  useEffect(() => { setOpen(false) }, [location.pathname])

  const handleTicketClick = () => {
    setOpen(false)
    if (!user) { navigate('/login'); return }
    navigate('/tickets')
  }

  if (hidden) return null

  const showZalo = settings.show_zalo_bubble === 'true' && !!settings.zalo_url
  const showFacebook = settings.show_facebook_bubble === 'true' && !!settings.facebook_url

  const subButtons = []

  if (showFacebook) {
    subButtons.push({
      key: 'fb',
      href: settings.facebook_url,
      icon: <FontAwesomeIcon icon={faFacebookF} />,
      label: 'Facebook',
      bg: 'from-blue-500 via-blue-600 to-blue-700',
      shadow: 'shadow-blue-500/40',
    })
  }

  if (showZalo) {
    subButtons.push({
      key: 'zalo',
      href: settings.zalo_url,
      icon: <ZaloIcon />,
      label: 'Zalo',
      bg: 'from-cyan-400 via-sky-500 to-blue-600',
      shadow: 'shadow-sky-400/40',
    })
  }

  subButtons.push({
    key: 'ticket',
    onClick: handleTicketClick,
    icon: <FontAwesomeIcon icon={faCommentDots} className="text-white text-base" />,
    label: unread > 0 ? `Hỗ trợ (${unread})` : 'Hỗ trợ',
    bg: 'from-neon-pink to-purple-600',
    shadow: 'shadow-pink-500/40',
    badge: unread > 0 ? unread : null,
  })

  return (
    <div className="fixed bottom-24 lg:bottom-8 right-4 z-[9999] flex flex-col items-end gap-2.5">
      {/* Sub buttons - expand upward */}
      <AnimatePresence>
        {open && subButtons.map((btn, i) => (
          <motion.div
            key={btn.key}
            initial={{ opacity: 0, y: 16, scale: 0.7 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.7 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28, delay: i * 0.05 }}
            className="flex items-center gap-2.5 justify-end"
          >
            {/* Label */}
            <span className="bg-dark-800 border border-white/10 text-white text-xs font-medium px-3 py-1.5 rounded-xl shadow-xl whitespace-nowrap">
              {btn.label}
            </span>

            {/* Button */}
            {btn.href ? (
              <a
                href={btn.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-11 h-11 rounded-full bg-gradient-to-br ${btn.bg} shadow-lg ${btn.shadow} flex items-center justify-center border border-white/20 text-white relative`}
              >
                {btn.icon}
                {btn.badge && (
                  <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 z-20">
                    {btn.badge > 9 ? '9+' : btn.badge}
                  </div>
                )}
              </a>
            ) : (
              <button
                type="button"
                onClick={btn.onClick}
                className={`w-11 h-11 rounded-full bg-gradient-to-br ${btn.bg} shadow-lg ${btn.shadow} flex items-center justify-center border border-white/20 text-white relative`}
              >
                {btn.icon}
                {btn.badge && (
                  <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 z-20">
                    {btn.badge > 9 ? '9+' : btn.badge}
                  </div>
                )}
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Main toggle button */}
      <motion.button
        type="button"
        onClick={() => setOpen(o => !o)}
        whileTap={{ scale: 0.9 }}
        animate={{ scale: open ? 1 : [1, 1.05, 1] }}
        transition={open ? {} : { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        className="relative w-13 h-13 w-[52px] h-[52px] rounded-full bg-gradient-to-br from-neon-pink to-purple-600 shadow-lg shadow-pink-500/40 flex items-center justify-center border border-white/20 text-white text-xl"
      >
        {/* Ping only when closed */}
        {!open && (
          <>
            <span className="absolute inset-0 rounded-full bg-pink-400/30 animate-ping" />
            <span className="absolute inset-0 rounded-full bg-pink-400/15 animate-ping [animation-duration:2.2s]" />
          </>
        )}

        <AnimatePresence mode="wait">
          {open ? (
            <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
              <FontAwesomeIcon icon={faXmark} />
            </motion.span>
          ) : (
            <motion.span key="hs" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
              <FontAwesomeIcon icon={faHeadset} />
            </motion.span>
          )}
        </AnimatePresence>

        {/* Unread badge on main button when closed */}
        {!open && unread > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-lg z-20"
          >
            {unread > 9 ? '9+' : unread}
          </motion.div>
        )}
      </motion.button>
    </div>
  )
}
