import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../api/axios'
import { formatCurrency, formatDate } from '../../utils/helpers'
import { Spinner } from '../../components/common/UIComponents'
import toast from 'react-hot-toast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCartShopping,
  faBoxOpen,
  faGift,
  faDice,
  faTrophy,
  faKey,
  faLockOpen,
  faCopy,
  faGamepad,
  faEye,
  faInbox,
  faUser,
  faEnvelope,
  faPhone,
  faXmark,
  faLink,
  faTriangleExclamation,
  faStar,
  faSearch,
  faHashtag,
} from '@fortawesome/free-solid-svg-icons'

const SOURCE_CONFIG = {
  PURCHASED: {
    label: 'Shop',
    icon: faCartShopping,
    color: 'text-neon-pink',
    bg: 'bg-neon-pink/10 border-neon-pink/30',
  },
  MYSTERY_BOX: {
    label: 'Túi Mù',
    icon: faBoxOpen,
    color: 'text-purple-400',
    bg: 'bg-purple-400/10 border-purple-400/30',
  },
  LUCKY_WHEEL: {
    label: 'Vòng Quay',
    icon: faDice,
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10 border-yellow-400/30',
  },
  // GIFTED: {
  //   label: 'Được Tặng',
  //   icon: faGift,
  //   color: 'text-green-400',
  //   bg: 'bg-green-400/10 border-green-400/30',
  // },
}

const RANK_COLORS = {
  'Thách Đấu': '#ff4757',
  'Cao Thủ': '#ff6b35',
  'Kim Cương': '#74b9ff',
  'Bạch Kim': '#a29bfe',
  'Vàng': '#fdcb6e',
  'Bạc': '#b2bec3',
  'Đồng': '#e17055',
}

const RARITY_CONFIG = {
  MYTHIC: { label: 'Huyền Thoại', color: '#ff4757', glow: 'rgba(255,71,87,0.5)' },
  LEGENDARY: { label: 'Legendary', color: '#ffd700', glow: 'rgba(255,215,0,0.5)' },
  EPIC: { label: 'Epic', color: '#a29bfe', glow: 'rgba(162,155,254,0.4)' },
  RARE: { label: 'Rare', color: '#74b9ff', glow: 'rgba(116,185,255,0.4)' },
  COMMON: { label: 'Thường', color: '#b2bec3', glow: 'rgba(178,190,195,0.3)' },
}

const maskEmail = email => {
  if (!email) return ''
  const [name, domain] = email.split('@')
  if (!domain) return email
  return `${name.slice(0, 2)}****${name.slice(-1)}@${domain}`
}

const maskPhone = phone => {
  if (!phone) return ''
  return `${phone.slice(0, 1)}******${phone.slice(-3)}`
}

const getFacebookLabel = status => {
  if (status === 'LIVE') return 'Liên kết sống'
  if (status === 'RIP') return 'Liên kết RIP'
  return 'Không liên kết'
}

// Xóa markdown link format: "[text](mailto:email)" hoặc "[text](email)" → trả về email thật
const stripMarkdownLink = (str) => {
  if (!str) return str
  // Dạng [text](mailto:email) → lấy email trong mailto
  const mailtoMatch = str.match(/\[.*?\]\(mailto:([^)]+)\)/)
  if (mailtoMatch) return mailtoMatch[1].trim()
  // Dạng [text](url) → lấy url
  const linkMatch = str.match(/\[.*?\]\(([^)]+)\)/)
  if (linkMatch) return linkMatch[1].trim()
  return str
}

// Parse gameBindInfo dạng "email/sdt" hoặc "email" hoặc "sdt"
const parseBindInfo = (bindInfo) => {
  if (!bindInfo) return { email: null, phone: null }
  // Làm sạch toàn bộ chuỗi trước (có thể có markdown link)
  const cleaned = stripMarkdownLink(bindInfo.trim())
  const parts = cleaned.split('/')
  let email = null
  let phone = null
  for (const part of parts) {
    const p = stripMarkdownLink(part.trim()) // strip từng phần nếu cần
    if (!p) continue
    if (p.includes('@')) {
      email = p
    } else if (/^\d/.test(p) || p.startsWith('0') || p.startsWith('+')) {
      phone = p
    } else if (!email) {
      // Nếu không rõ, coi là email
      email = p
    }
  }
  return { email, phone }
}

// Chuẩn hoá snapshot: nếu là túi mù (có gameBindInfo) thì parse ra email/phone
const normalizeSnap = (rawSnap, sourceType) => {
  const snap = typeof rawSnap === 'string' ? JSON.parse(rawSnap) : (rawSnap || {})
  if (sourceType === 'MYSTERY_BOX' && snap.gameBindInfo && !snap.gameBindEmail && !snap.gameBindPhone) {
    const { email, phone } = parseBindInfo(snap.gameBindInfo)
    return { ...snap, gameBindEmail: email, gameBindPhone: phone }
  }
  return snap
}

function RevealAnimation({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1800)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, delay: 1.5 }}
    >
      <div className="relative">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-neon-pink"
            style={{ top: '50%', left: '50%' }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos((i / 12) * Math.PI * 2) * 120,
              y: Math.sin((i / 12) * Math.PI * 2) * 120,
              opacity: 0,
              scale: 0,
            }}
            transition={{ duration: 0.9, delay: i * 0.05 }}
          />
        ))}

        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="text-7xl text-neon-pink drop-shadow-[0_0_30px_rgba(255,45,115,0.8)]"
        >
          <FontAwesomeIcon icon={faTrophy} />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-4 text-neon-pink font-bold text-xl font-gaming"
        >
          Tài khoản của bạn!
        </motion.p>
      </div>
    </motion.div>
  )
}

function AccountDetailModal({ record, onClose }) {
  const [revealed, setRevealed] = useState(false)
  const [showReveal, setShowReveal] = useState(false)

  const snap = normalizeSnap(record?.snapshotData, record?.sourceType)
  const src = SOURCE_CONFIG[record?.sourceType] || SOURCE_CONFIG.PURCHASED
  const rarity = snap.rarity ? RARITY_CONFIG[snap.rarity] : null

  const isMysteryBox = record?.sourceType === 'MYSTERY_BOX'
  const isLuckyWheel = record?.sourceType === 'LUCKY_WHEEL'

  const hasProtectedInfo =
    snap.gameBindEmail ||
    snap.gameBindPhone ||
    (snap.gameBindFacebook && snap.gameBindFacebook !== 'NONE')

  const copyAll = () => {
    const text = `Tài khoản: ${snap.gameUsername || ''}
Mật khẩu: ${snap.gamePassword || ''}
Email: ${snap.gameBindEmail ? maskEmail(snap.gameBindEmail) : 'Không có'}
SĐT: ${snap.gameBindPhone ? maskPhone(snap.gameBindPhone) : 'Không có'}
Facebook: ${getFacebookLabel(snap.gameBindFacebook)}`

    navigator.clipboard.writeText(text)
      .then(() => toast.success('Đã copy thông tin!'))
  }

  const copy = (val, label) => {
    navigator.clipboard.writeText(val || '')
      .then(() => toast.success(`Đã copy ${label}!`))
  }

  const loginFields = [
    {
      label: (<><FontAwesomeIcon icon={faUser} className="mr-1" />Tên đăng nhập</>),
      value: snap.gameUsername,
      key: 'username',
      copyable: true,
      copyLabel: 'tên đăng nhập',
    },
    {
      label: (<><FontAwesomeIcon icon={faKey} className="mr-1" />Mật khẩu</>),
      value: snap.gamePassword,
      key: 'password',
      copyable: true,
      copyLabel: 'mật khẩu',
    },
    {
      label: (<><FontAwesomeIcon icon={faEnvelope} className="mr-1" />Email liên kết</>),
      value: snap.gameBindEmail ? maskEmail(snap.gameBindEmail) : '',
      key: 'email',
      copyable: false,
    },
    {
      label: (<><FontAwesomeIcon icon={faPhone} className="mr-1" />Số điện thoại</>),
      value: snap.gameBindPhone ? maskPhone(snap.gameBindPhone) : '',
      key: 'phone',
      copyable: false,
    },
    {
      label: (<><FontAwesomeIcon icon={faLink} className="mr-1" />Facebook</>),
      value: snap.gameBindFacebook && snap.gameBindFacebook !== 'NONE' ? getFacebookLabel(snap.gameBindFacebook) : '',
      key: 'facebook',
      copyable: false,
    },
  ].filter(f => f.value)

  return (
    <AnimatePresence>
      {showReveal && (
        <RevealAnimation
          onDone={() => {
            setShowReveal(false)
            setRevealed(true)
          }}
        />
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative gaming-card border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-dark-800/95 backdrop-blur border-b border-white/5 p-5 flex items-start justify-between z-10">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {/* Nhãn nguồn */}
                <span className={`text-[11px] font-bold border px-2 py-0.5 rounded-full ${src.bg} ${src.color}`}>
                  <FontAwesomeIcon icon={src.icon} className="mr-1" />
                  {src.label}
                </span>

                {/* Nhãn rarity cho túi mù / vòng quay */}
                {rarity && (
                  <span
                    className="text-[11px] font-bold border px-2 py-0.5 rounded-full"
                    style={{
                      color: rarity.color,
                      borderColor: `${rarity.color}40`,
                      background: `${rarity.color}15`,
                    }}
                  >
                    <FontAwesomeIcon icon={faStar} className="mr-1" />
                    {rarity.label}
                  </span>
                )}

                <span className="text-white/30 text-xs font-mono">
                  {snap.code}
                </span>
              </div>

              <h2 className="font-gaming font-bold text-white text-lg leading-tight line-clamp-2">
                {isMysteryBox ? (snap.categoryName || 'Túi Mù') : snap.title || '—'}
              </h2>
            </div>

            <button
              onClick={onClose}
              className="ml-3 text-white/40 hover:text-white text-2xl leading-none flex-shrink-0"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Ảnh: chỉ hiển thị nếu là acc shop / vòng quay có ảnh */}
            {!isMysteryBox && (snap.images?.length > 0 || snap.thumbnailUrl) && (
              <div className="grid grid-cols-3 gap-2">
                {(snap.thumbnailUrl ? [{ url: snap.thumbnailUrl }, ...(snap.images || [])] : snap.images)
                  .slice(0, 6)
                  .map((img, i) => (
                    <img
                      key={i}
                      src={img.url}
                      alt=""
                      className="rounded-xl object-cover aspect-video w-full border border-white/5 hover:border-neon-pink/30 transition-colors"
                    />
                  ))}
              </div>
            )}

            {/* Ảnh danh mục túi mù */}
            {isMysteryBox && snap.categoryThumbnail && (
              <div className="flex justify-center">
                <img
                  src={snap.categoryThumbnail}
                  alt={snap.categoryName}
                  className="rounded-xl object-cover h-32 border border-purple-400/20"
                  style={{ boxShadow: `0 0 20px ${rarity?.glow || 'rgba(162,155,254,0.3)'}` }}
                />
              </div>
            )}

            {/* Stats - chỉ hiển thị nếu có data (acc shop / vòng quay) */}
            {!isMysteryBox && (snap.rank || snap.server || snap.skins || snap.champions) && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Rank', value: snap.rank, color: RANK_COLORS[snap.rank] },
                  { label: 'Server', value: snap.server },
                  { label: 'Skin', value: snap.skins },
                  { label: 'Tướng', value: snap.champions },
                ].map(s => (
                  <div
                    key={s.label}
                    className="bg-dark-700 rounded-xl p-3 text-center border border-white/5"
                  >
                    <div className="text-white/40 text-[10px] uppercase font-display mb-1">
                      {s.label}
                    </div>
                    <div
                      className="font-bold text-sm"
                      style={{ color: s.color || '#fff' }}
                    >
                      {s.value ?? '—'}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Thông tin đăng nhập */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-white/60 text-xs uppercase font-display tracking-wider">
                  <FontAwesomeIcon icon={faKey} className="mr-2" />
                  Thông tin đăng nhập
                </h3>

                {!revealed && (
                  <button
                    onClick={() => setShowReveal(true)}
                    className="btn-primary px-4 py-1.5 text-xs animate-pulse"
                  >
                    <FontAwesomeIcon icon={faLockOpen} className="mr-2" />
                    Mở khoá
                  </button>
                )}

                {revealed && (
                  <button
                    onClick={copyAll}
                    className="btn-neon px-3 py-1.5 text-xs"
                  >
                    <FontAwesomeIcon icon={faCopy} className="mr-2" />
                    Copy tất cả
                  </button>
                )}
              </div>

              {loginFields.length === 0 && (
                <div className="text-center py-4 text-white/30 text-sm">
                  Chưa có thông tin đăng nhập
                </div>
              )}

              {loginFields.map(f => (
                <div
                  key={f.key}
                  className="flex items-center gap-3 bg-dark-700 rounded-xl px-4 py-3 border border-white/5 group"
                >
                  <span className="text-white/40 text-xs w-28 flex-shrink-0">
                    {f.label}
                  </span>

                  <span
                    className={`flex-1 font-mono text-sm ${
                      revealed
                        ? 'text-white'
                        : 'text-white/0 bg-white/10 rounded select-none'
                    }`}
                    style={!revealed ? { filter: 'blur(6px)', userSelect: 'none' } : {}}
                  >
                    {f.value || '—'}
                  </span>

                  {revealed && f.value && f.copyable && (
                    <button
                      onClick={() => copy(f.value, f.copyLabel)}
                      className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-neon-pink transition-all text-xs"
                    >
                      <FontAwesomeIcon icon={faCopy} />
                    </button>
                  )}
                </div>
              ))}

              {revealed && hasProtectedInfo && (
                <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 text-xs text-yellow-300">
                  <FontAwesomeIcon icon={faTriangleExclamation} className="mr-2" />
                  Acc có thông tin liên kết. Vui lòng liên hệ ZALO ADMIN để đổi thông tin bảo mật.
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-white/30 pt-2 border-t border-white/5">
              <span>Nhận lúc: {formatDate(record.receivedAt)}</span>
              {snap.pricePaid != null ? (
                <span className="font-mono">Giá: {formatCurrency(snap.pricePaid)}</span>
              ) : snap.price != null ? (
                <span className="font-mono">Giá lúc mua: {formatCurrency(snap.price)}</span>
              ) : null}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function OwnedAccountsPage() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [source, setSource] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const fetchOwned = async () => {
    setLoading(true)
    try {
      const q = new URLSearchParams({ page, limit: 12 })
      if (source) q.append('source', source)
      if (search) q.append('search', search)
      const { data } = await api.get(`/owned-accounts/my?${q}`)
      setRecords(data.data || [])
      setPagination(data.pagination || {})
    } catch (e) {
      toast.error('Lỗi tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchOwned() }, [page, source, search])


  const filterTabs = [
    { value: '', label: 'Tất cả', icon: faInbox },
    { value: 'PURCHASED', label: 'Shop', icon: faCartShopping },
    { value: 'MYSTERY_BOX', label: 'Túi Mù', icon: faBoxOpen },
    { value: 'LUCKY_WHEEL', label: 'Vòng Quay', icon: faDice },
    // { value: 'GIFTED', label: 'Được Tặng', icon: faGift },
  ]

  return (
    <div className="pt-20 pb-20 min-h-screen">
      <div className="page-container">
        <div className="mb-6">
          <h1 className="font-gaming text-3xl font-bold text-gradient mb-1">
            <FontAwesomeIcon icon={faGamepad} className="mr-3" />
            Kho Tài Khoản
          </h1>
          <p className="text-white/40 text-sm">
            Tất cả tài khoản game bạn sở hữu ({pagination.total || 0})
          </p>
        </div>

        <form
          className="flex flex-wrap items-center gap-2 mb-6"
          onSubmit={e => { e.preventDefault(); setSearch(searchInput.trim()); setPage(1) }}
        >

  {/* Search */}
  <div className="flex items-center gap-2 flex-shrink-0">
    <div className="relative w-40 sm:w-52">
      <FontAwesomeIcon
        icon={faSearch}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-xs"
      />

      <input
        type="text"
        value={searchInput}
        onChange={e => setSearchInput(e.target.value)}
        placeholder="Tìm mã acc..."
        className="w-full bg-dark-700 border border-white/10 rounded-xl pl-9 pr-8 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-neon-pink/40 transition-colors"
      />

      {searchInput && (
        <button
          type="button"
          onClick={() => { setSearchInput(''); setSearch(''); setPage(1) }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
      )}
    </div>

    <button
      type="submit"
      className="flex-shrink-0 w-9 h-9 rounded-xl bg-neon-pink/20 border border-neon-pink/40 text-neon-pink hover:bg-neon-pink/30 transition-colors flex items-center justify-center"
      title="Tìm kiếm"
    >
      <FontAwesomeIcon icon={faSearch} className="text-sm" />
    </button>
  </div>

  {/* Filter */}
  <div className="flex flex-wrap gap-2">
    {filterTabs.map(t => (
      <button
        key={t.value}
        type="button"
        onClick={() => {
          setSource(t.value)
          setPage(1)
        }}
        className={`px-3 py-2 rounded-xl text-sm font-display transition-all border whitespace-nowrap ${
          source === t.value
            ? 'bg-neon-pink/20 border-neon-pink/50 text-neon-pink'
            : 'border-white/10 text-white/50 hover:border-white/30 hover:text-white'
        }`}
      >
        <FontAwesomeIcon icon={t.icon} className="mr-2" />
        {t.label}
      </button>
    ))}
  </div>

</form>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="gaming-card h-48 animate-pulse bg-dark-700" />
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-20">
            <FontAwesomeIcon icon={faInbox} className="text-6xl mb-4 text-white/20" />
            <p className="text-white/30 text-lg">Kho trống rỗng</p>
            <p className="text-white/20 text-sm mt-1">Mua acc hoặc quay để nhận tài khoản</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {records.map((rec, i) => {
              const snap = normalizeSnap(rec.snapshotData, rec.sourceType)
              const src = SOURCE_CONFIG[rec.sourceType] || SOURCE_CONFIG.PURCHASED
              const isMysteryBox = rec.sourceType === 'MYSTERY_BOX'
              const isLuckyWheel = rec.sourceType === 'LUCKY_WHEEL'
              const rarity = snap.rarity ? RARITY_CONFIG[snap.rarity] : null

              // Ảnh hiển thị: túi mù dùng categoryThumbnail, còn lại dùng thumbnailUrl/images
              const thumbUrl = isMysteryBox
                ? snap.categoryThumbnail
                : (snap.thumbnailUrl || snap.images?.[0]?.url)

              // Tiêu đề: túi mù dùng categoryName + rarity, còn lại dùng title
              const displayTitle = isMysteryBox
                ? snap.categoryName || 'Túi Mù'
                : snap.title || '—'

              return (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelected(rec)}
                  className="gaming-card cursor-pointer hover:border-neon-pink/30 transition-all group overflow-hidden"
                  style={rarity ? { boxShadow: `0 0 0 1px ${rarity.color}30` } : {}}
                >
                  <div className="relative aspect-video bg-dark-700 overflow-hidden">
                    {thumbUrl ? (
                      <img
                        src={thumbUrl}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl text-white/10">
                        <FontAwesomeIcon icon={isMysteryBox ? faBoxOpen : faGamepad} />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 to-transparent" />

                    {/* Nhãn nguồn */}
                    <span className={`absolute top-2 right-2 text-[10px] font-bold border px-1.5 py-0.5 rounded-full ${src.bg} ${src.color}`}>
                      <FontAwesomeIcon icon={src.icon} className="mr-1" />
                      {src.label}
                    </span>

                    {/* Rarity badge cho túi mù / vòng quay */}
                    {rarity && (
                      <span
                        className="absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{
                          color: rarity.color,
                          background: `${rarity.color}20`,
                          border: `1px solid ${rarity.color}50`,
                        }}
                      >
                        {rarity.label}
                      </span>
                    )}

                    {/* Rank cho acc shop */}
                    {!isMysteryBox && snap.rank && (
                      <span
                        className="absolute bottom-2 left-2 text-[10px] font-bold text-white drop-shadow"
                        style={{ color: RANK_COLORS[snap.rank] || '#fff' }}
                      >
                        {snap.rank}
                      </span>
                    )}
                  </div>

                  <div className="p-3">
                    <p className="text-white text-xs font-medium line-clamp-2 mb-1 leading-snug">
                      {displayTitle}
                    </p>

                    {/* Mã acc - hiển thị cho tất cả loại */}
                    {snap.code && (
                      <p className="text-white/40 text-[10px] font-mono mb-2">
                        <FontAwesomeIcon icon={faHashtag} className="mr-0.5" />
                        {snap.code}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      {isMysteryBox ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400">
                          <FontAwesomeIcon icon={faBoxOpen} className="mr-1" />
                          Acc túi mù
                        </span>
                      ) : isLuckyWheel ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
                          <FontAwesomeIcon icon={faDice} className="mr-1" />
                          Acc vòng quay
                        </span>
                      ) : (
                        <span className="text-white/30 text-[10px]">
                          {snap.skins != null ? `${snap.skins} skin` : ''}{snap.champions != null ? ` · ${snap.champions} tướng` : ''}
                        </span>
                      )}

                      <span className="text-neon-pink text-[10px] font-bold">
                        <FontAwesomeIcon icon={faEye} className="mr-1" />
                        Xem
                      </span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {[...Array(pagination.pages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${
                  page === i + 1
                    ? 'bg-neon-pink text-white'
                    : 'bg-dark-700 text-white/40 hover:bg-dark-600'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <AccountDetailModal
            record={selected}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}