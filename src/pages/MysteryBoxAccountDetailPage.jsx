import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSelector, useDispatch } from 'react-redux'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { updateBalance } from '../store/slices/authSlice'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.bubble.css'
import api from '../api/axios'
import { formatCurrency, getRarityColor, getRarityLabel, formatDate } from '../utils/helpers'
import { RarityBadge, Spinner } from '../components/common/UIComponents'
import toast from 'react-hot-toast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBoxOpen, faShieldHalved, faStar, faArrowLeft,
  faLock, faUnlock, faUsers, faWandMagicSparkles,
  faMoneyBillWave, faCircleCheck, faGem, faFire,
  faCircleInfo, faLayerGroup, faHistory, faClock,
  faHashtag, faCheck, faTag, faEnvelope, faPhone, faEye
} from '@fortawesome/free-solid-svg-icons'

// Helpers parse/mask bind info
const stripMarkdownLink = (str) => {
  if (!str) return str
  const mailtoMatch = str.match(/\[.*?\]\(mailto:([^)]+)\)/)
  if (mailtoMatch) return mailtoMatch[1].trim()
  const linkMatch = str.match(/\[.*?\]\(([^)]+)\)/)
  if (linkMatch) return linkMatch[1].trim()
  return str
}

const maskEmail = (email) => {
  if (!email) return ''
  const [name, domain] = email.split('@')
  if (!domain) return email
  return `${name.slice(0, 2)}****${name.slice(-1)}@${domain}`
}

const maskPhone = (phone) => {
  if (!phone) return ''
  return `${phone.slice(0, 3)}****${phone.slice(-3)}`
}

const parseBindInfo = (bindInfo) => {
  if (!bindInfo) return { email: null, phone: null }
  const cleaned = stripMarkdownLink(bindInfo.trim())
  const parts = cleaned.split('/')
  let email = null
  let phone = null
  for (const part of parts) {
    const p = stripMarkdownLink(part.trim())
    if (!p) continue
    if (p.includes('@')) {
      email = p
    } else if (/^\d/.test(p) || p.startsWith('0') || p.startsWith('+')) {
      phone = p
    } else if (!email) {
      email = p
    }
  }
  return { email, phone }
}

// Modal mở túi
function OpenResultModal({ result, onClose }) {
  const [revealed, setRevealed] = useState(false)
  const [showReveal, setShowReveal] = useState(false)
  if (!result) return null
  const color = getRarityColor(result.account.rarity)
  const isHighRarity = ['LEGENDARY', 'MYTHIC'].includes(result.account.rarity)
  const { email: bindEmail, phone: bindPhone } = parseBindInfo(result.account.gameBindInfo)

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/90 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ scale: 0.2, opacity: 0, y: 60 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 240, damping: 18 }}
          className="relative gaming-card p-8 text-center max-w-md w-full z-10"
          style={{ borderColor: `${color}60`, boxShadow: `0 0 80px ${color}40, 0 0 160px ${color}20` }}
        >
          {isHighRarity && [...Array(10)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full pointer-events-none"
              style={{ background: color, left: `${5 + i * 9}%`, top: '15%' }}
              animate={{ y: [-10, -60, -10], opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
              transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}

          <motion.div
            animate={{ rotateY: [0, 360] }}
            transition={{ duration: 1, delay: 0.3 }}
            className="text-7xl mb-4"
            style={{ color }}
          >
            <FontAwesomeIcon icon={faBoxOpen} />
          </motion.div>

          <div className="font-gaming text-2xl font-black text-white mb-1">
            {isHighRarity ? '🎉 JACKPOT!!!' : 'Mở Túi Thành Công!'}
          </div>
          <div className="text-white/50 text-sm mb-4">Từ {result.category?.name}</div>

          <div className="rounded-xl p-4 mb-4" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
            <div className="font-mono text-sm text-white/50 mb-2">
              Mã: <span className="text-white font-bold">{result.account?.code}</span>
            </div>
            {result.account.gameUsername && (
  <div className="bg-dark-900/80 rounded-lg p-3 text-left space-y-2">
    <div className="flex items-center justify-between mb-2">
      <div className="text-xs text-white/30 uppercase tracking-wider flex items-center gap-2">
        <FontAwesomeIcon
          icon={revealed ? faUnlock : faLock}
          style={{ color }}
        />
        Thông tin đăng nhập
      </div>

      {!revealed && (
        <button
          onClick={() => setRevealed(true)}
          className="btn-primary px-3 py-1 text-xs"
        >
          <FontAwesomeIcon icon={faEye} className="mr-1" />
                                Xem
        </button>
      )}
    </div>

    <div className="text-sm">
      <span className="text-white/40">Username: </span>
      <span
        className={`font-mono ${
          revealed
            ? 'text-white'
            : 'text-white/60 bg-white/10 rounded px-2 inline-block'
        }`}
        style={!revealed ? { filter: 'blur(5px)' } : {}}
      >
        {result.account.gameUsername}
      </span>
    </div>

    {result.account.gamePassword && (
      <div className="text-sm">
        <span className="text-white/40">Password: </span>
        <span
          className={`font-mono ${
            revealed
              ? 'text-white'
              : 'text-white/60 bg-white/10 rounded px-2 inline-block'
          }`}
          style={!revealed ? { filter: 'blur(5px)' } : {}}
        >
          {result.account.gamePassword}
        </span>
      </div>
    )}

    {bindEmail && (
      <div className="text-sm">
        <span className="text-white/40">Email: </span>
        <span
          className={`font-mono ${
            revealed
              ? 'text-white'
              : 'text-white/60 bg-white/10 rounded px-2 inline-block'
          }`}
          style={!revealed ? { filter: 'blur(5px)' } : {}}
        >
          {maskEmail(bindEmail)}
        </span>
      </div>
    )}

    {bindPhone && (
      <div className="text-sm">
        <span className="text-white/40">SĐT: </span>
        <span
          className={`font-mono ${
            revealed
              ? 'text-white'
              : 'text-white/60 bg-white/10 rounded px-2 inline-block'
          }`}
          style={!revealed ? { filter: 'blur(5px)' } : {}}
        >
          {maskPhone(bindPhone)}
        </span>
      </div>
    )}
  </div>
)}
          </div>

          <RarityBadge rarity={result.account.rarity} size="md" />
          <div className="text-white/40 text-xs mt-2">
            Đã trừ {formatCurrency(result.pricePaid)} • Số dư: {formatCurrency(result.newBalance)}
          </div>
          <div className="flex gap-3 mt-6">
            <Link to="/owned-accounts" className="flex-1 btn-neon text-sm py-2.5 text-center" style={{ borderColor: `${color}60`, color }}>
              Kho Acc
            </Link>
            <button onClick={onClose} className="flex-1 btn-primary py-2.5 text-sm">
              <FontAwesomeIcon icon={faCircleCheck} className="mr-2" /> Đóng
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

// Guarantee item checkmark row
function GuaranteeItem({ children, color }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <div
        className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}25`, border: `1px solid ${color}50` }}
      >
        <FontAwesomeIcon icon={faCheck} className="text-[10px]" style={{ color }} />
      </div>
      <span className="text-white/75 text-sm">{children}</span>
    </div>
  )
}

export default function MysteryBoxAccountDetailPage() {
  const { id } = useParams()
  const { user } = useSelector(s => s.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [account, setAccount] = useState(null)
  const [loading, setLoading] = useState(true)
  const [opening, setOpening] = useState(false)
  const [result, setResult] = useState(null)
  const [recentHistory, setRecentHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)

  useEffect(() => {
    api.get(`/mystery-box/accounts/${id}`)
      .then(r => {
        setAccount(r.data.data)
        // Fetch recent history for this category
        if (r.data.data?.category?.id) {
          fetchRecentHistory(r.data.data.category.id)
        }
      })
      .catch(() => toast.error('Không tìm thấy acc'))
      .finally(() => setLoading(false))
  }, [id])

  const fetchRecentHistory = async (categoryId) => {
    setHistoryLoading(true)
    try {
      const { data } = await api.get(`/mystery-box/categories/${categoryId}/recent-history`)
      setRecentHistory(data.data || [])
    } catch { }
    finally { setHistoryLoading(false) }
  }

  const handleOpen = async () => {
    if (!user) { toast.error('Vui lòng đăng nhập'); return }
    if (!account?.category) return
    if (parseFloat(user.balance) < parseFloat(account.category.price)) {
      toast.error(`Số dư không đủ! Cần ${formatCurrency(account.category.price)}`)
      return
    }
    setOpening(true)
    try {
      const { data } = await api.post(`/mystery-box/categories/${account.category.id}/open`, {
        accountId: account.id
      })
      dispatch(updateBalance(data.data.newBalance))
      setResult(data.data)
      // Cập nhật trạng thái acc ngay sau khi mua thành công (không cần reload trang)
      setAccount(prev => prev ? { ...prev, isSold: true } : prev)
      const accCode = data.data?.account?.code || account.code
      toast.success(`Mở thành công túi mù ${accCode}!`)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi mở túi mù')
    } finally {
      setOpening(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!account) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="text-5xl mb-4 opacity-30">🔍</div>
          <div className="text-white/40">Không tìm thấy acc</div>
          <Link to="/mystery-box" className="mt-4 inline-block text-neon-pink text-sm hover:underline">
            Quay lại Mystery Box
          </Link>
        </div>
      </div>
    )
  }

  const color = getRarityColor(account.rarity)
  const catColor = getRarityColor(account.category?.rarity || account.rarity)

  const hasHtmlDesc = account.category?.description &&
    (account.category.description.includes('<') || account.category.description.includes('&'))

  // Parse guarantee list from description or build from category data
  // Showing as example guarantee items (customize as needed)
  const guaranteeItems = [
    'Nhận được 1 trong những phần quà trong hộp',
    'Acc sẽ hiển thị ngay trong Kho Acc sau khi mở',
    'Thông tin đăng nhập đầy đủ, không bị trùng',
    'Hỗ trợ 24/7 nếu có vấn đề',
  ]

  return (
    <div className="pt-20 pb-20 min-h-screen">
      {/* Banner */}
      <div
        className="relative h-56 md:h-72 overflow-hidden bg-dark-950"
        style={{ borderBottom: `1px solid ${catColor}25` }}
      >
        {account.category?.bannerImage ? (
          <>
            {/* Nền blur lấp khoảng trống 2 bên */}
            <img
              src={account.category.bannerImage}
              alt=""
              className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-30"
            />

            {/* Ảnh chính hiển thị full */}
            <img
              src={account.category.bannerImage}
              alt=""
              className="relative z-10 w-full h-full object-contain opacity-95"
            />
          </>
        ) : account.category?.thumbnail ? (
          <>
            <img
              src={account.category.thumbnail}
              alt=""
              className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-25"
            />

            <img
              src={account.category.thumbnail}
              alt=""
              className="relative z-10 w-full h-full object-contain opacity-90"
            />
          </>
        ) : (
          <div className="w-full h-full bg-dark-800" />
        )}

        {/* Overlay tối dưới cho chữ/khối dưới nổi hơn */}
        <div
          className="absolute inset-0 z-20 pointer-events-none"
          style={{
            background: `
        linear-gradient(to bottom, ${catColor}05 0%, rgba(10,10,20,0.35) 45%, rgba(10,10,20,0.98) 100%),
        radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.45) 100%)
      `,
          }}
        />
      </div>

      <div className="page-container max-w-6xl mx-auto -mt-10 relative z-30">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm mb-6"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          Quay lại
        </button>

        {/* ── MAIN PRODUCT LAYOUT: Left image + Right info ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

          {/* LEFT: Detail image / grid preview */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            {/* Main image — detailImage if set, else thumbnail */}
            <div
              className="relative rounded-2xl overflow-hidden min-h-[560px] lg:min-h-[670px]"
              style={{
                border: `1px solid ${color}30`,
                boxShadow: `0 0 40px ${color}15`,
                background: 'rgba(255,255,255,0.02)'
              }}
            >
              {account.category?.detailImage || account.category?.thumbnail ? (
                <img
                  src={account.category.detailImage || account.category.thumbnail}
                  alt={account.category?.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-dark-800">
                  <FontAwesomeIcon icon={faBoxOpen} className="text-8xl opacity-10" style={{ color }} />
                </div>
              )}
              {/* Mystery overlay + lock */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl backdrop-blur-sm"
                  style={{ background: `${color}20`, border: `1px solid ${color}40` }}
                >
                  <FontAwesomeIcon icon={faHashtag} className="text-xs" style={{ color }} />
                  <span className="font-mono text-sm font-bold" style={{ color }}>{account.code}</span>
                </div>
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl backdrop-blur-sm"
                  style={{ background: 'rgba(0,0,0,0.5)', border: `1px solid ${color}30` }}
                >
                  <FontAwesomeIcon icon={faLock} className="text-xs" style={{ color: color, opacity: 0.7 }} />
                  <span className="text-white/50 text-xs">Ẩn đến khi mở</span>
                </div>
              </div>
              {/* Top rarity badge */}
              <div className="absolute top-3 right-3">
                <RarityBadge rarity={account.rarity} size="sm" />
              </div>
            </div>

          </motion.div>

          {/* RIGHT: Product info + CTA */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 }}
            className="flex flex-col gap-4"
          >
            {/* Title block */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-white/30 text-xs uppercase tracking-wider font-medium">
                  <FontAwesomeIcon icon={faLayerGroup} className="mr-1.5" />
                  {account.category?.name}
                </span>
              </div>
              <h1
                className="font-gaming text-2xl md:text-3xl font-black text-white mb-1"
                style={{ textShadow: `0 0 30px ${color}40` }}
              >
                Tài khoản {account.code}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <RarityBadge rarity={account.rarity} size="sm" />
                <span className="text-white/30 text-xs">•</span>
                <span className="text-white/40 text-xs flex items-center gap-1">
                  <FontAwesomeIcon icon={faTag} className="text-[10px]" />
                  Mã: <span className="font-mono text-white/60">{account.code}</span>
                </span>
                <span className="text-white/30 text-xs">•</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-bold ${account.isSold
                    ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                    : 'bg-green-500/15 text-green-400 border border-green-500/30'
                    }`}
                >
                  {account.isSold ? 'Đã bán' : 'Acc còn'}
                </span>
              </div>
            </div>

            {/* Price */}
            <div
              className="flex items-center gap-4 p-4 rounded-xl"
              style={{ background: `${catColor}10`, border: `1px solid ${catColor}25` }}
            >
              <div>
                <div className="text-white/30 text-xs mb-0.5">Giá mở túi</div>
                <div
                  className="font-gaming text-3xl font-black"
                  style={{ color: catColor, textShadow: `0 0 20px ${catColor}60` }}
                >
                  {formatCurrency(account.category?.price)}
                </div>
              </div>
              {user && (
                <div className="ml-auto text-right">
                  <div className="text-white/30 text-xs mb-0.5">Số dư của bạn</div>
                  <div className={`font-gaming text-lg font-bold ${parseFloat(user.balance) >= parseFloat(account.category?.price) ? 'text-yellow-400' : 'text-red-400'}`}>
                    {formatCurrency(user.balance)}
                  </div>
                </div>
              )}
            </div>

            {/* CTA Buttons — same as original */}
            <div className="flex flex-col gap-3">
              {user ? (
                <>
                  <motion.button
                    onClick={handleOpen}
                    disabled={opening || account.isSold}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-4 rounded-xl font-gaming font-black text-black text-base flex items-center justify-center gap-3 disabled:opacity-50"
                    style={{
                      background: account.isSold ? '#444' : `linear-gradient(135deg, ${catColor}, ${catColor}bb)`,
                      boxShadow: account.isSold ? 'none' : `0 0 30px ${catColor}50`,
                    }}
                  >
                    {opening ? (
                      <><Spinner size="sm" color="white" /> Đang mở...</>
                    ) : account.isSold ? (
                      'Acc đã bán'
                    ) : (
                      <><FontAwesomeIcon icon={faBoxOpen} /> MỞ THẺ NGAY &nbsp;{formatCurrency(account.category?.price)}</>
                    )}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-3.5 rounded-xl font-gaming font-bold text-sm flex items-center justify-center gap-2"
                    style={{
                      background: 'rgba(59,130,246,0.12)',
                      border: '1px solid rgba(59,130,246,0.35)',
                      color: '#60a5fa'
                    }}
                    onClick={() => window.open('https://zalo.me/', '_blank')}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.869 4.326-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.829.941z" /></svg>
                    Chat mua qua Zalo
                  </motion.button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="w-full py-4 rounded-xl font-gaming font-black text-black text-base flex items-center justify-center gap-3"
                  style={{ background: `linear-gradient(135deg, ${catColor}, ${catColor}bb)` }}
                >
                  <FontAwesomeIcon icon={faWandMagicSparkles} /> Đăng nhập để mở
                </Link>
              )}
            </div>

            {/* Guarantee info block */}
            <div
              className="rounded-xl p-4"
              style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${color}20` }}
            >
              <div className="font-gaming text-sm font-bold text-white mb-3 flex items-center gap-2">
                <FontAwesomeIcon icon={faCircleCheck} style={{ color }} />
                THÔNG TIN ĐỐI VỚI ACC BẢO HÀNH
              </div>
              <div className="font-bold text-white/60 text-xs mb-2 uppercase tracking-wider">
                CHẮC CHẮN NHẬN MỘT TRONG NHỮNG PHẦN QUÀ SAU:
              </div>
              {guaranteeItems.map((item, i) => (
                <GuaranteeItem key={i} color={color}>{item}</GuaranteeItem>
              ))}
            </div>

            {/* Lock hint */}
            <div
              className="flex items-start gap-3 p-3 rounded-xl"
              style={{ background: `${color}06`, border: `1px solid ${color}15` }}
            >
              <FontAwesomeIcon icon={faLock} className="text-base mt-0.5 flex-shrink-0 opacity-50" style={{ color }} />
              <p className="text-white/35 text-xs leading-relaxed">
                Thông tin đăng nhập được ẩn cho đến khi mở túi. Hiển thị ngay trong <strong className="text-white/55">Kho Acc</strong> sau khi mua thành công.
              </p>
            </div>
          </motion.div>
        </div>

        {/* ── BOTTOM SECTION: Description + Recent History ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Description (2/3 width) */}
          {account.category?.description && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="lg:col-span-2 gaming-card overflow-hidden"
              style={{ borderColor: `${catColor}25` }}
            >
              <div
                className="px-6 py-4 flex items-center gap-3"
                style={{
                  background: `linear-gradient(90deg, ${catColor}15, transparent)`,
                  borderBottom: `1px solid ${catColor}20`
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${catColor}20`, border: `1px solid ${catColor}40` }}
                >
                  <FontAwesomeIcon icon={faCircleInfo} style={{ color: catColor }} className="text-sm" />
                </div>
                <div>
                  <div className="font-gaming font-bold text-sm text-white">Giới Thiệu Về Túi Mù</div>
                  <div className="text-white/30 text-xs">{account.category.name}</div>
                </div>
              </div>

              <div className="px-6 py-5">
                {hasHtmlDesc ? (
                  <div className="mystery-quill-viewer">
                    <style>{`
                      .mystery-quill-viewer .ql-editor {
                        padding: 0;
                        color: rgba(226,232,240,0.75);
                        font-size: 0.9rem;
                        line-height: 1.75;
                        font-family: 'Exo 2', sans-serif;
                      }
                      .mystery-quill-viewer .ql-editor h1,
                      .mystery-quill-viewer .ql-editor h2,
                      .mystery-quill-viewer .ql-editor h3 {
                        font-family: 'Orbitron', sans-serif;
                        color: ${catColor};
                        margin-bottom: 0.5rem;
                        text-shadow: 0 0 15px ${catColor}50;
                      }
                      .mystery-quill-viewer .ql-editor h1 { font-size: 1.4rem; }
                      .mystery-quill-viewer .ql-editor h2 { font-size: 1.2rem; }
                      .mystery-quill-viewer .ql-editor h3 { font-size: 1.05rem; }
                      .mystery-quill-viewer .ql-editor p {
                        margin-bottom: 0.75rem;
                        color: rgba(226,232,240,0.7);
                      }
                      .mystery-quill-viewer .ql-editor strong { color: rgba(226,232,240,0.95); }
                      .mystery-quill-viewer .ql-editor em { color: ${catColor}cc; font-style: italic; }
                      .mystery-quill-viewer .ql-editor ul,
                      .mystery-quill-viewer .ql-editor ol {
                        padding-left: 1.5rem;
                        margin-bottom: 0.75rem;
                        color: rgba(226,232,240,0.7);
                      }
                      .mystery-quill-viewer .ql-editor li { margin-bottom: 0.3rem; }
                      .mystery-quill-viewer .ql-editor li::before { color: ${catColor} !important; }
                      .mystery-quill-viewer .ql-editor blockquote {
                        border-left: 3px solid ${catColor};
                        padding: 0.75rem 1rem;
                        color: rgba(226,232,240,0.5);
                        font-style: italic;
                        margin: 0.75rem 0;
                        background: ${catColor}08;
                        border-radius: 0 0.5rem 0.5rem 0;
                      }
                      .mystery-quill-viewer .ql-editor a { color: ${catColor}; text-decoration: underline; }
                      .mystery-quill-viewer .ql-editor img { max-width: 100%; border-radius: 0.75rem; margin: 0.5rem 0; }
                      .mystery-quill-viewer .ql-container.ql-bubble { border: none !important; background: transparent !important; }
                    `}</style>
                    <ReactQuill
                      value={account.category.description}
                      readOnly={true}
                      theme="bubble"
                      modules={{ toolbar: false }}
                    />
                  </div>
                ) : (
                  <p className="text-white/60 text-sm leading-relaxed whitespace-pre-wrap">
                    {account.category.description}
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* Recent History (1/3 width) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`gaming-card overflow-hidden ${!account.category?.description ? 'lg:col-span-3' : ''}`}
            style={{ borderColor: `${catColor}20` }}
          >
            <div
              className="px-5 py-4 flex items-center gap-3"
              style={{
                background: `linear-gradient(90deg, ${catColor}10, transparent)`,
                borderBottom: `1px solid ${catColor}15`
              }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${catColor}15`, border: `1px solid ${catColor}35` }}
              >
                <FontAwesomeIcon icon={faHistory} style={{ color: catColor }} className="text-xs" />
              </div>
              <div>
                <div className="font-gaming font-bold text-sm text-white">Lịch Sử Mua Gần Đây</div>
                <div className="text-white/25 text-xs">{account.category?.name}</div>
              </div>
            </div>

            <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
              {historyLoading ? (
                <div className="flex justify-center py-8"><Spinner size="sm" /></div>
              ) : recentHistory.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-3xl mb-2 opacity-20">🎁</div>
                  <div className="text-white/25 text-xs">Chưa có lịch sử mua</div>
                </div>
              ) : (
                recentHistory.map((h, i) => {
                  const hColor = getRarityColor(h.account?.rarity || 'COMMON')
                  return (
                    <motion.div
                      key={h.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/3 transition-colors"
                      style={{ border: `1px solid ${hColor}15` }}
                    >
                      {/* Avatar */}
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden"
                        style={{ background: `${hColor}20`, border: `1px solid ${hColor}40`, color: hColor }}
                      >
                        {h.user?.avatar ? (
                          <img src={h.user.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          (h.user?.displayName || h.user?.username || '?')[0].toUpperCase()
                        )}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="text-white/70 text-xs font-medium truncate">
                          {h.user?.displayName || h.user?.username || 'Ẩn danh'}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                            style={{ background: `${hColor}15`, color: hColor }}
                          >
                            {getRarityLabel(h.account?.rarity || 'COMMON')}
                          </span>
                          <span className="text-white/25 text-[10px] font-mono">#{h.account?.code || '---'}</span>
                        </div>
                      </div>
                      {/* Time */}
                      <div className="flex items-center gap-1 text-white/30 text-[11px]">
                        <FontAwesomeIcon icon={faClock} className="text-[10px]" />
                        {new Date(h.createdAt).toLocaleString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </div>
                    </motion.div>
                  )
                })
              )}
            </div>

            {/* Promo notice */}
            <div
              className="px-4 py-3 text-center text-xs text-white/25 flex items-center justify-center gap-2"
              style={{ borderTop: `1px solid ${catColor}10` }}
            >
              <FontAwesomeIcon icon={faFire} className="text-neon-pink/50" />
              + LIÊN HỆ ZALO MUA ACC ĐỂ ĐƯỢC TƯ VẤN TỐT HƠN!
            </div>
          </motion.div>
        </div>
      </div>

      {/* Open result modal */}
      {result && <OpenResultModal result={result} onClose={() => setResult(null)} />}
    </div>
  )
}