import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBell, faXmark, faClock } from '@fortawesome/free-solid-svg-icons'
import api from '../../api/axios'

const DISMISS_KEY = 'ann_dismissed' // localStorage key lưu danh sách đã tắt 1h

function getExpiredDismissals() {
  try {
    const raw = JSON.parse(localStorage.getItem(DISMISS_KEY) || '{}')
    const now = Date.now()
    // Xoá các key đã hết hạn 1h
    const cleaned = Object.fromEntries(Object.entries(raw).filter(([, ts]) => now - ts < 3600_000))
    localStorage.setItem(DISMISS_KEY, JSON.stringify(cleaned))
    return cleaned
  } catch { return {} }
}

function dismissFor1h(id) {
  try {
    const raw = JSON.parse(localStorage.getItem(DISMISS_KEY) || '{}')
    raw[id] = Date.now()
    localStorage.setItem(DISMISS_KEY, JSON.stringify(raw))
  } catch {}
}

export default function AnnouncementPopup() {
  const [queue, setQueue]       = useState([])   // danh sách ann chưa hiển thị
  const [current, setCurrent]   = useState(null)  // ann đang hiện
  const [visible, setVisible]   = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const { data } = await api.get('/announcements/active')
        const anns = data.data || []
        const dismissed = getExpiredDismissals()

        // Lọc những cái chưa bị tắt 1h
        const pending = anns.filter(a => !dismissed[a.id])
        if (!cancelled && pending.length > 0) {
          setQueue(pending.slice(1))
          setCurrent(pending[0])
          setVisible(true)
        }
      } catch {}
    }
    // Delay nhỏ để trang load xong mới hiện popup
    const t = setTimeout(load, 800)
    return () => { cancelled = true; clearTimeout(t) }
  }, [])

  // Khi queue còn item, hiện tiếp
  const showNext = () => {
    if (queue.length > 0) {
      setCurrent(queue[0])
      setQueue(q => q.slice(1))
      setVisible(true)
    } else {
      setCurrent(null)
    }
  }

  const handleClose = () => {
    setVisible(false)
    setTimeout(showNext, 300)
  }

  const handleDismiss1h = () => {
    if (current) dismissFor1h(current.id)
    setVisible(false)
    setTimeout(showNext, 300)
  }

  if (!current) return null

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Overlay */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            key={current.id}
            initial={{ opacity: 0, scale: 0.88, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="fixed z-[1000] inset-0 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-lg bg-dark-800 border border-white/10 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5 bg-gradient-to-r from-neon-pink/10 to-orange-500/5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-pink to-orange-500 flex items-center justify-center text-white text-sm flex-shrink-0 shadow-lg shadow-pink-500/20">
                  <FontAwesomeIcon icon={faBell} />
                </div>
                <h2 className="flex-1 font-display font-bold text-white text-base leading-tight">
                  {current.title}
                </h2>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
                  title="Đóng"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>

              {/* Content */}
              <div
                className="px-5 py-4 text-sm text-white/80 leading-relaxed max-h-[60vh] overflow-y-auto
                  [&_h1]:text-white [&_h1]:font-bold [&_h1]:text-xl [&_h1]:mb-2
                  [&_h2]:text-white [&_h2]:font-bold [&_h2]:text-lg [&_h2]:mb-2
                  [&_h3]:text-white [&_h3]:font-semibold [&_h3]:mb-1
                  [&_strong]:text-white [&_strong]:font-semibold
                  [&_em]:text-white/70
                  [&_ul]:list-disc [&_ul]:ml-4 [&_ul]:space-y-1
                  [&_ol]:list-decimal [&_ol]:ml-4 [&_ol]:space-y-1
                  [&_li]:text-white/70
                  [&_a]:text-neon-pink [&_a]:underline [&_a]:underline-offset-2
                  [&_blockquote]:border-l-2 [&_blockquote]:border-pink-500/40 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-white/50
                  [&_img]:rounded-lg [&_img]:max-w-full [&_img]:my-2
                  [&_p]:mb-2 last:[&_p]:mb-0"
                dangerouslySetInnerHTML={{ __html: current.content }}
              />

              {/* Footer */}
              <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-white/5 bg-dark-900/30">
                <button
                  onClick={handleDismiss1h}
                  className="flex items-center gap-1.5 text-xs text-white/35 hover:text-white/60 transition-colors"
                  title="Tắt thông báo này trong 1 giờ"
                >
                  <FontAwesomeIcon icon={faClock} />
                  Tắt trong 1 giờ
                </button>

                <div className="flex items-center gap-2">
                  {queue.length > 0 && (
                    <span className="text-xs text-white/30">{queue.length} thông báo tiếp theo</span>
                  )}
                  <button
                    onClick={handleClose}
                    className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-neon-pink to-orange-500 text-white text-xs font-semibold hover:opacity-90 transition shadow-md shadow-pink-500/20"
                  >
                    Đã hiểu
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
