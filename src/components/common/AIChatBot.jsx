import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faRobot,
  faGamepad,
  faGem,
  faMoneyBillWave,
  faPalette,
  faBolt,
  faFire,
  faChevronRight,
  faWallet,
  faCircleCheck,
  faHourglassHalf,
  faCircleXmark,
  faArrowRight,
  faPaperPlane,
  faXmark,
  faTrash,
} from '@fortawesome/free-solid-svg-icons'
import api from '../../api/axios'

const TYPE_SPEED = 15

const formatPrice = (p) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p)

const htmlToPlainText = (html = '') => {
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent || div.innerText || ''
}

const SUGGESTIONS = [
  { icon: faGem, label: 'Acc Kim Cương', text: 'Cho mình xem acc rank Kim Cương' },
  { icon: faMoneyBillWave, label: 'Dưới 200k', text: 'Tìm acc giá dưới 200k' },
  { icon: faPalette, label: 'Nhiều skin', text: 'Acc có nhiều skin nhất' },
  { icon: faBolt, label: 'Thách Đấu', text: 'Tìm acc Thách Đấu' },
  { icon: faGamepad, label: 'Mới nhất', text: 'Acc mới vừa lên kho' },
  { icon: faFire, label: 'Acc nổi bật', text: 'Acc nổi bật hot nhất' },
]

const WELCOME_MSG = {
  role: 'bot',
  text:
    'Xin chào! Mình là Quang – trợ lý AI của LQ Shop.\n\n' +
    'Mình có thể giúp bạn:\n' +
    '• Tìm acc theo rank, giá, số skin/tướng\n' +
    '• Tư vấn chọn acc phù hợp túi tiền\n' +
    '• Trả lời mọi thắc mắc về shop\n\n' +
    'Bạn cần gì cứ hỏi mình nhé!',
  accounts: [],
  ts: Date.now(),
}

function MiniAccountCard({ acc, onView }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 bg-dark-700/80 border border-white/5 rounded-xl p-3 hover:border-teal-400/30 transition-all cursor-pointer group"
      onClick={() => onView(acc.id)}
    >
      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-dark-500">
        {acc.thumbnailUrl ? (
          <img src={acc.thumbnailUrl} alt={acc.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xl text-teal-400">
            <FontAwesomeIcon icon={faGamepad} />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold truncate group-hover:text-teal-400 transition-colors">
          {acc.title}
        </p>

        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs text-purple-400/80">{acc.rank}</span>
          <span className="text-white/30">·</span>
          <span className="text-xs text-white/50">{acc.skins ?? acc.skin} skin</span>
          <span className="text-white/30">·</span>
          <span className="text-xs text-white/50">{acc.champions} tướng</span>
        </div>

        <p className="text-teal-400 font-bold text-sm mt-1">{formatPrice(acc.price)}</p>
      </div>

      <div className="flex-shrink-0 self-center text-white/20 group-hover:text-teal-400 transition-colors text-lg">
        <FontAwesomeIcon icon={faChevronRight} />
      </div>
    </motion.div>
  )
}

function MiniMysteryBoxCard({ box, onView }) {
  const rarityColor = {
    COMMON: 'text-gray-400',
    RARE: 'text-blue-400',
    EPIC: 'text-purple-400',
    LEGENDARY: 'text-yellow-400',
  }

  const rarityLabel = {
    COMMON: 'Thường',
    RARE: 'Hiếm',
    EPIC: 'Sử Thi',
    LEGENDARY: 'Huyền Thoại',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 bg-dark-700/80 border border-white/5 rounded-xl p-3 hover:border-purple-400/30 transition-all cursor-pointer group"
      onClick={() => onView(box.slug)}
    >
      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-dark-500">
        {box.thumbnail ? (
          <img src={box.thumbnail} alt={box.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xl text-purple-400">🎁</div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold truncate group-hover:text-purple-400 transition-colors">
          {box.name}
        </p>

        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {box.rarity && (
            <span className={`text-xs ${rarityColor[box.rarity] || 'text-gray-400'}`}>
              {rarityLabel[box.rarity] || box.rarity}
            </span>
          )}
          <span className="text-white/30">·</span>
          <span className="text-xs text-white/50">{box.availableCount} gói còn</span>
        </div>

        <p className="text-purple-400 font-bold text-sm mt-1">{formatPrice(box.price)}</p>
      </div>

      <div className="flex-shrink-0 self-center text-white/20 group-hover:text-purple-400 transition-colors text-lg">
        <FontAwesomeIcon icon={faChevronRight} />
      </div>
    </motion.div>
  )
}

function MiniWheelCard({ wheel, onView }) {
  if (!wheel) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-dark-700/80 border border-yellow-400/20 rounded-xl p-3 hover:border-yellow-400/50 transition-all cursor-pointer group"
      onClick={onView}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">🎡</span>
        <p className="text-yellow-400 font-bold text-sm">{wheel.name || 'Vòng Quay May Mắn'}</p>
      </div>

      <p className="text-white/60 text-xs mb-2">
        Chi phí mỗi lần quay:{' '}
        <span className="text-yellow-400 font-semibold">{formatPrice(wheel.spinCost)}</span>
      </p>

      {wheel.rewards?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {wheel.rewards.slice(0, 4).map(r => (
            <span key={r.id} className="text-xs px-2 py-0.5 rounded-full bg-dark-500 text-white/70">
              {r.name}
            </span>
          ))}

          {wheel.rewards.length > 4 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-dark-500 text-white/40">
              +{wheel.rewards.length - 4} giải khác
            </span>
          )}
        </div>
      )}

      <p className="text-xs text-yellow-400/70 mt-2 group-hover:text-yellow-400 transition-colors">
        Nhấn để quay ngay →
      </p>
    </motion.div>
  )
}

function DepositCard({ depositInfo, depositAction, onNavigate }) {
  const statusConfig = {
    COMPLETED: {
      icon: faCircleCheck,
      color: 'text-green-400',
      bg: 'bg-green-500/10 border-green-500/20',
      label: 'Thành công',
    },
    PENDING: {
      icon: faHourglassHalf,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10 border-yellow-500/20',
      label: 'Đang chờ',
    },
    FAILED: {
      icon: faCircleXmark,
      color: 'text-red-400',
      bg: 'bg-red-500/10 border-red-500/20',
      label: 'Thất bại',
    },
    CANCELLED: {
      icon: faCircleXmark,
      color: 'text-white/30',
      bg: 'bg-white/5 border-white/10',
      label: 'Đã huỷ',
    },
  }

  if (depositAction === 'guide') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-dark-700/80 border border-blue-500/20 rounded-xl p-4 space-y-3"
      >
        <p className="text-xs font-semibold text-blue-400 flex items-center gap-1.5">
          <FontAwesomeIcon icon={faWallet} /> Hướng dẫn nạp tiền
        </p>

        <div className="space-y-2 text-xs text-white/60">
          {[
            '1️⃣ Vào trang <b class="text-white/80">Nạp tiền</b> trên menu',
            '2️⃣ Chọn QR ngân hàng hoặc nạp bằng thẻ cào nếu không có ATM',
            '3️⃣ Nếu nạp QR: nhập số tiền và quét mã thanh toán',
            '4️⃣ Nếu nạp thẻ cào: chọn loại thẻ, mệnh giá, nhập serial và mã thẻ',
            '5️⃣ Tiền sẽ được cộng sau khi hệ thống kiểm tra thành công ⚡',
          ].map((s, i) => (
            <p key={i} dangerouslySetInnerHTML={{ __html: s }} />
          ))}

          <p className="text-yellow-400/80 pt-1">
            ⚠️ Nạp thẻ cào có chiết khấu, số tiền nhận có thể thấp hơn mệnh giá thẻ.
          </p>
        </div>

        <button
          onClick={onNavigate}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-semibold hover:opacity-90 transition"
        >
          <FontAwesomeIcon icon={faArrowRight} /> Đi đến trang Nạp tiền
        </button>
      </motion.div>
    )
  }

  if (!depositInfo || depositInfo.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-dark-700/80 border border-white/5 rounded-xl p-3 text-xs text-white/40 text-center"
      >
        {depositAction === 'status'
          ? '✅ Không có giao dịch nào đang chờ xử lý'
          : '📭 Chưa có lịch sử nạp tiền nào'}
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-dark-700/80 border border-white/5 rounded-xl overflow-hidden"
    >
      <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between">
        <p className="text-xs font-semibold text-white/60 flex items-center gap-1.5">
          <FontAwesomeIcon icon={faMoneyBillWave} className="text-green-400" />
          {depositAction === 'status' ? 'Giao dịch đang chờ' : 'Lịch sử nạp gần đây'}
        </p>

        <button onClick={onNavigate} className="text-[10px] text-blue-400 hover:text-blue-300 transition">
          Xem tất cả →
        </button>
      </div>

      <div className="divide-y divide-white/[0.04]">
        {depositInfo.map(d => {
          const cfg = statusConfig[d.status] || statusConfig.FAILED
          const date = new Date(d.createdAt).toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })

          return (
            <div key={d.id} className="flex items-center gap-3 px-3 py-2.5">
              <span className={`text-sm ${cfg.color}`}>
                <FontAwesomeIcon icon={cfg.icon} />
              </span>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white">{formatPrice(d.amount)}</p>
                <p className="text-[10px] text-white/30">
                  {date} · {d.method}
                </p>
              </div>

              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} font-medium`}>
                {cfg.label}
              </span>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

function MessageBubble({ msg, onView, onViewBox, onViewWheel, onViewDeposit }) {
  const isBot = msg.role === 'bot'
  const showExtra = isBot && !msg.isTyping

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2 ${isBot ? 'justify-start' : 'justify-end'}`}
    >
      {isBot && (
        <div className="w-8 h-8 rounded-full flex-shrink-0 bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-sm mt-1 text-white">
          <FontAwesomeIcon icon={faRobot} />
        </div>
      )}

      <div className={`max-w-[85%] ${isBot ? '' : 'items-end flex flex-col'}`}>
        {msg.text && (
          <div
            className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
              isBot
                ? 'bg-dark-600 border border-white/5 text-white/90 rounded-tl-sm'
                : 'bg-gradient-to-br from-teal-500 to-blue-600 text-white rounded-tr-sm'
            }`}
          >
            {isBot && msg.isTyping ? (
              msg.text
            ) : (
              <span dangerouslySetInnerHTML={{ __html: msg.text }} />
            )}

            {isBot && msg.isTyping && (
              <span className="inline-block w-1.5 h-4 ml-0.5 bg-teal-400/80 animate-pulse align-middle rounded-sm" />
            )}
          </div>
        )}

        {showExtra && msg.accounts?.length > 0 && (
          <div className="mt-2 space-y-2 w-full">
            {msg.accounts.map(acc => (
              <MiniAccountCard key={acc.id} acc={acc} onView={onView} />
            ))}
          </div>
        )}

        {showExtra && msg.mysteryBoxes?.length > 0 && (
          <div className="mt-2 space-y-2 w-full">
            {msg.mysteryBoxes.map(box => (
              <MiniMysteryBoxCard key={box.id} box={box} onView={onViewBox} />
            ))}
          </div>
        )}

        {showExtra && msg.wheel && (
          <div className="mt-2 w-full">
            <MiniWheelCard wheel={msg.wheel} onView={onViewWheel} />
          </div>
        )}

        {showExtra && msg.intent === 'deposit_support' && (
          <div className="mt-2 w-full">
            <DepositCard
              depositInfo={msg.depositInfo}
              depositAction={msg.depositAction}
              onNavigate={onViewDeposit}
            />
          </div>
        )}

        <span className="text-white/20 text-[10px] mt-1 px-1">
          {new Date(msg.ts).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </motion.div>
  )
}

function TypingDots() {
  return (
    <div className="flex gap-2 items-start">
      <div className="w-8 h-8 rounded-full flex-shrink-0 bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-sm text-white">
        <FontAwesomeIcon icon={faRobot} />
      </div>

      <div className="bg-dark-600 border border-white/5 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center">
        {[0, 0.2, 0.4].map((d, i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-teal-400/70 animate-bounce"
            style={{ animationDelay: `${d}s` }}
          />
        ))}
      </div>
    </div>
  )
}

export default function AIChatBot() {
  const navigate = useNavigate()
  const location = useLocation()

  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [pulse, setPulse] = useState(true)
  const [chatHistory, setChatHistory] = useState([])
  const [messages, setMessages] = useState([WELCOME_MSG])

  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const typingTimerRef = useRef(null)

  const hidden = location.pathname.startsWith('/admin')

  useEffect(() => {
    const t = setTimeout(() => setPulse(false), 5000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        clearInterval(typingTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [open, messages])

  const startBotTyping = useCallback((botMsg, fullHtmlText) => {
    if (typingTimerRef.current) {
      clearInterval(typingTimerRef.current)
    }

    const plainText = htmlToPlainText(fullHtmlText)
    let index = 0

    setMessages(prev => [
      ...prev,
      {
        ...botMsg,
        text: '',
        isTyping: true,
      },
    ])

    typingTimerRef.current = setInterval(() => {
      index += 1

      setMessages(prev =>
        prev.map((m, i) => {
          if (i !== prev.length - 1) return m

          return {
            ...m,
            text: plainText.slice(0, index),
            isTyping: true,
          }
        })
      )

      if (index >= plainText.length) {
        clearInterval(typingTimerRef.current)
        typingTimerRef.current = null

        setMessages(prev =>
          prev.map((m, i) => {
            if (i !== prev.length - 1) return m

            return {
              ...m,
              text: fullHtmlText,
              isTyping: false,
            }
          })
        )
      }
    }, TYPE_SPEED)
  }, [])

  const sendMessage = useCallback(
    async (text) => {
      if (!text.trim() || loading) return

      if (typingTimerRef.current) {
        clearInterval(typingTimerRef.current)
        typingTimerRef.current = null
      }

      const userMsg = {
        role: 'user',
        text: text.trim(),
        ts: Date.now(),
      }

      setMessages(prev => [...prev, userMsg])
      setInput('')
      setLoading(true)

      const newHistory = [...chatHistory, { role: 'user', content: text.trim() }]

      try {
        const response = await api.post('/chatbot/chat', {
          messages: [{ role: 'user', content: text.trim() }],
          history: chatHistory,
        })

        const data = response.data?.data
        if (!data) throw new Error('Invalid response')

        const {
          intent,
          reply,
          accounts = [],
          mysteryBoxes = [],
          wheel = null,
          depositInfo = [],
          depositAction = null,
        } = data

        let replyText = reply || 'Mình đã hiểu rồi!'

        if ((intent === 'search_acc' || intent === 'search') && accounts.length === 0) {
          replyText =
            replyText +
            '\n\nHmm, hiện tại không có acc nào khớp. Bạn thử điều chỉnh tiêu chí xem sao nhé! 🔍'
        } else if ((intent === 'search_acc' || intent === 'search') && accounts.length > 0) {
          replyText = `${replyText}\n\nTìm được ${accounts.length} acc:`
        } else if (intent === 'search_mystery_box' && mysteryBoxes.length === 0) {
          replyText =
            replyText +
            '\n\nHiện không có túi mù nào khớp yêu cầu. Thử điều chỉnh tiêu chí nhé! 🎁'
        } else if (intent === 'search_mystery_box' && mysteryBoxes.length > 0) {
          replyText = `${replyText}\n\nCó ${mysteryBoxes.length} loại túi mù:`
        }

        setLoading(false)

        startBotTyping(
          {
            role: 'bot',
            accounts,
            mysteryBoxes,
            wheel,
            depositInfo,
            depositAction,
            intent,
            ts: Date.now(),
          },
          replyText
        )

        setChatHistory([...newHistory, { role: 'model', content: reply || '' }])
      } catch (err) {
        console.error('[AIChatBot] error:', err)

        setLoading(false)

        startBotTyping(
          {
            role: 'bot',
            accounts: [],
            mysteryBoxes: [],
            wheel: null,
            ts: Date.now(),
          },
          'Ối, có lỗi rồi. Bạn thử lại sau nhé!'
        )
      }
    },
    [loading, chatHistory, startBotTyping]
  )

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handleViewAccount = (id) => {
    navigate(`/shop/acc/${id}`)
    setOpen(false)
  }

  const handleViewMysteryBox = (slug) => {
    navigate(`/mystery-box/${slug}`)
    setOpen(false)
  }

  const handleViewWheel = () => {
    navigate('/lucky-wheel')
    setOpen(false)
  }

  const handleViewDeposit = () => {
    navigate('/deposit')
    setOpen(false)
  }

  const handleClear = () => {
    if (typingTimerRef.current) {
      clearInterval(typingTimerRef.current)
      typingTimerRef.current = null
    }

    setMessages([{ ...WELCOME_MSG, ts: Date.now() }])
    setChatHistory([])
    setLoading(false)
  }

  if (hidden) return null

  return (
    <div className="fixed bottom-24 lg:bottom-8 left-5 z-[9998] flex flex-col items-start gap-2">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            className="w-[340px] sm:w-[380px] flex flex-col rounded-2xl overflow-hidden shadow-2xl"
            style={{
              background: 'linear-gradient(145deg, #0f0f1a, #0a0a12)',
              border: '1px solid rgba(0,210,200,0.2)',
              boxShadow: '0 0 40px rgba(0,210,200,0.08), 0 20px 60px rgba(0,0,0,0.6)',
              maxHeight: '70vh',
            }}
          >
            <div
              className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
              style={{
                background: 'linear-gradient(90deg, rgba(0,210,200,0.12), rgba(59,130,246,0.08))',
              }}
            >
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-lg text-white">
                  <FontAwesomeIcon icon={faRobot} />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-dark-800" />
              </div>

              <div className="flex-1">
                <p className="text-white font-gaming text-sm font-bold tracking-wide">
                  Quang – AI Assistant
                </p>
                <p className="text-green-400 text-[10px] tracking-wider">● Powered by Quang</p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setOpen(false); navigate('/ai-chat') }}
                  title="Mở chat đầy đủ"
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-teal-500/20 flex items-center justify-center transition-colors text-white/40 hover:text-teal-400 text-xs font-bold"
                >
                  ⤢
                </button>
                <button
                  onClick={handleClear}
                  title="Xóa lịch sử"
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-white/40 hover:text-white/70"
                >
                  <FontAwesomeIcon icon={faTrash} className="text-xs" />
                </button>

                <button
                  onClick={() => setOpen(false)}
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-red-500/20 flex items-center justify-center transition-colors text-white/40 hover:text-red-400"
                >
                  <FontAwesomeIcon icon={faXmark} className="text-sm" />
                </button>
              </div>
            </div>

            <div
              className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(0,210,200,0.3) transparent',
              }}
            >
              {messages.map((msg, i) => (
                <MessageBubble
                  key={i}
                  msg={msg}
                  onView={handleViewAccount}
                  onViewBox={handleViewMysteryBox}
                  onViewWheel={handleViewWheel}
                  onViewDeposit={handleViewDeposit}
                />
              ))}

              {loading && <TypingDots />}
              <div ref={bottomRef} />
            </div>

            {messages.length <= 1 && (
              <div className="px-4 pb-2 flex gap-1.5 flex-wrap flex-shrink-0">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s.label}
                    onClick={() => sendMessage(s.text)}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-dark-500 border border-white/8 text-white/60 hover:border-teal-400/40 hover:text-teal-400 hover:bg-teal-400/5 transition-all"
                  >
                    <FontAwesomeIcon icon={s.icon} className="mr-1.5" />
                    {s.label}
                  </button>
                ))}
              </div>
            )}

            <div className="px-3 pb-3 pt-2 flex-shrink-0 border-t border-white/5">
              <div className="flex gap-2 items-end">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Nhập yêu cầu tìm acc hoặc hỏi gì đó..."
                  rows={1}
                  disabled={loading}
                  className="flex-1 bg-dark-500 border border-white/8 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-teal-400/40 resize-none transition-colors"
                  style={{ maxHeight: '80px', minHeight: '36px' }}
                  onInput={e => {
                    e.target.style.height = 'auto'
                    e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px'
                  }}
                />

                <button
                  onClick={() => sendMessage(input)}
                  disabled={loading || !input.trim()}
                  className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white transition-all hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
                >
                  {loading ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <FontAwesomeIcon icon={faPaperPlane} className="text-sm" />
                  )}
                </button>
              </div>

              <p className="text-white/15 text-[10px] mt-1.5 text-center tracking-wide">
                Powered by Gemini AI · Enter để gửi
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.92 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.8 }}
        className="relative w-14 h-14 rounded-full flex items-center justify-center text-white"
        style={{
          background: 'linear-gradient(135deg, #00d4c8, #3b82f6)',
          boxShadow: open
            ? '0 0 30px rgba(0,212,200,0.6), 0 0 60px rgba(0,212,200,0.3)'
            : '0 0 24px rgba(0,212,200,0.4)',
        }}
      >
        {pulse && !open && (
          <>
            <span className="absolute inset-0 rounded-full bg-teal-400/40 animate-ping" />
            <span
              className="absolute inset-0 rounded-full bg-teal-400/20 animate-ping"
              style={{ animationDelay: '0.4s' }}
            />
          </>
        )}

        <AnimatePresence mode="wait">
          {open ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="text-2xl relative z-10"
            >
              <FontAwesomeIcon icon={faXmark} />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="text-2xl relative z-10"
            >
              <FontAwesomeIcon icon={faRobot} />
            </motion.span>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!open && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ delay: 1.5, duration: 0.3 }}
              className="absolute left-16 bg-dark-600 border border-teal-400/20 text-white text-xs px-3 py-1.5 rounded-xl whitespace-nowrap pointer-events-none"
              style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}
            >
              <FontAwesomeIcon icon={faRobot} className="mr-1.5" />
              Quang – AI tìm acc
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-dark-600" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  )
}