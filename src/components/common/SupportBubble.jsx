// SupportBubble.jsx
import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useSelector } from 'react-redux'
import { useSiteSettings } from '../../context/SiteSettingsContext'
import api from '../../api/axios'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFacebookF } from '@fortawesome/free-brands-svg-icons'
import { faCommentDots } from '@fortawesome/free-solid-svg-icons'

function ZaloIcon() {
  return (
    <div className="relative w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-inner">
      <span className="text-[#0068FF] font-black text-[11px] leading-none">
        Zalo
      </span>
    </div>
  )
}

function BubbleButton({
  as = 'a',
  href,
  onClick,
  icon,
  tooltip,
  delay = 0,
  bgClass = 'from-blue-500 to-blue-700',
  badge
}) {
  const [showTip, setShowTip] = useState(false)
  const MotionTag = as === 'button' ? motion.button : motion.a

  return (
    <div className="relative flex items-center justify-end">
      <AnimatePresence>
        {showTip && (
          <motion.div
            initial={{ opacity: 0, x: 10, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="absolute right-16 top-1/2 -translate-y-1/2 bg-dark-800 border border-white/10 text-white text-xs font-display px-3 py-2 rounded-xl shadow-xl whitespace-nowrap"
          >
            {tooltip}
            <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-dark-800 border-r border-t border-white/10 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      <MotionTag
        {...(as === 'a'
          ? {
              href,
              target: '_blank',
              rel: 'noopener noreferrer'
            }
          : {
              type: 'button',
              onClick
            })}
        onMouseEnter={() => setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
        whileHover={{ scale: 1.12, y: -2 }}
        whileTap={{ scale: 0.92 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: [1, 1.04, 1],
          y: [0, -2, 0],
          opacity: 1
        }}
        transition={{
          scale: { duration: 2, repeat: Infinity, ease: 'easeInOut', delay },
          y: { duration: 2, repeat: Infinity, ease: 'easeInOut', delay },
          opacity: { duration: 0.2, delay }
        }}
        className={`
          relative w-14 h-14 rounded-full
          bg-gradient-to-br ${bgClass}
          shadow-[0_0_30px_rgba(59,130,246,0.55)]
          flex items-center justify-center
          overflow-visible border border-white/20
        `}
      >
        <span className="absolute inset-0 rounded-full bg-white/25 animate-ping" />
        <span className="absolute inset-0 rounded-full bg-white/10 animate-ping [animation-duration:2.5s]" />
        <div className="absolute inset-[-8px] rounded-full bg-white/10 blur-xl" />

        <div className="absolute inset-0 rounded-full bg-white/10" />
        <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-white/25 blur-sm" />

        <div className="relative z-10 text-white text-2xl drop-shadow-lg">
          {icon}
        </div>

        {badge}
      </MotionTag>
    </div>
  )
}

export default function SupportBubble() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useSelector(s => s.auth)
  const { settings } = useSiteSettings()

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

  const handleTicketClick = () => {
    if (!user) {
      navigate('/login')
      return
    }

    navigate('/tickets')
  }

  if (hidden) return null

  const showZalo =
    settings.show_zalo_bubble === 'true' &&
    !!settings.zalo_url

  const showFacebook =
    settings.show_facebook_bubble === 'true' &&
    !!settings.facebook_url

  return (
    <div className="fixed bottom-24 lg:bottom-8 right-5 z-[9999] flex flex-col items-end gap-3">
      {showFacebook && (
        <BubbleButton
          href={settings.facebook_url}
          icon={<FontAwesomeIcon icon={faFacebookF} />}
          tooltip="Nhắn tin Facebook"
          delay={0.1}
          bgClass="from-blue-500 via-blue-600 to-blue-700"
        />
      )}

      {showZalo && (
        <BubbleButton
          href={settings.zalo_url}
          icon={<ZaloIcon />}
          tooltip="Nhắn tin Zalo"
          delay={0.2}
          bgClass="from-cyan-400 via-sky-500 to-blue-600"
        />
      )}

      <BubbleButton
        as="button"
        onClick={handleTicketClick}
        icon={
          <FontAwesomeIcon
            icon={faCommentDots}
            className="text-white text-2xl"
          />
        }
        tooltip={
          <>
            Hỗ trợ trực tuyến
            {unread > 0 && (
              <span className="ml-1.5 text-neon-pink font-bold">
                {unread} phản hồi
              </span>
            )}
          </>
        }
        delay={0.5}
        bgClass="from-neon-pink to-purple-600"
        badge={
          unread > 0 ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-lg z-20"
            >
              {unread > 9 ? '9+' : unread}
            </motion.div>
          ) : null
        }
      />
    </div>
  )
}