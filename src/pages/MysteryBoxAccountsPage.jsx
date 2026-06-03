import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSelector, useDispatch } from 'react-redux'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { updateBalance } from '../store/slices/authSlice'
import api from '../api/axios'
import { formatCurrency, getRarityColor, getRarityLabel } from '../utils/helpers'
import { RarityBadge, Spinner } from '../components/common/UIComponents'
import toast from 'react-hot-toast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import 'react-quill/dist/quill.snow.css'
import {
  faBoxOpen,
  faGem,
  faLayerGroup,
  faArrowLeft,
  faLock,
  faUnlock,
  faChevronLeft,
  faChevronRight,
  faFire,
  faWandMagicSparkles,
  faCircleCheck,
  faHashtag,
  faEye,
  faMoneyBillWave,
  faShieldHalved,
  faClock,
  faCircleInfo,
  faSearch,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'

const RARITIES = ['ALL', 'COMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC']

function MysteryAccountCard({ account, index, onViewDetail }) {
  const color = getRarityColor(account.rarity)
  const isSold = account.isSold || account.status === 'SOLD'

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -8, scale: 1.01 }}
      className="relative group cursor-pointer"
      onClick={() => onViewDetail(account)}
    >
      <div
        className="relative overflow-hidden rounded-2xl bg-dark-600"
        style={{
          border: `1px solid ${color}45`,
          boxShadow: ['LEGENDARY', 'MYTHIC'].includes(account.rarity)
            ? `0 0 35px ${color}25`
            : `0 8px 24px ${color}10`
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-0.5 opacity-80"
          style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
        />

        <div className="relative h-40 overflow-hidden bg-dark-800">
          {account.category?.thumbnail ? (
            <motion.img
              src={account.category.thumbnail}
              alt={account.category.name}
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.08 }}
              transition={{ duration: 0.5 }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FontAwesomeIcon icon={faBoxOpen} className="text-6xl opacity-20" style={{ color }} />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-dark-900/90 via-dark-900/35 to-transparent" />

          <div className="absolute top-3 right-3">
            <RarityBadge rarity={account.rarity} size="sm" />
          </div>

          <div className="absolute top-3 left-3">
            <div
              className="text-xs font-mono px-2 py-1 rounded-lg backdrop-blur-sm"
              style={{
                background: 'rgba(0,0,0,0.65)',
                border: `1px solid ${color}35`,
                color
              }}
            >
              <FontAwesomeIcon icon={faHashtag} className="mr-1" />
              {account.code}
            </div>
          </div>

          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
            <div
              className="text-xs px-2 py-1 rounded-lg backdrop-blur-sm flex items-center gap-1.5"
              style={{
                background: 'rgba(0,0,0,0.65)',
                border: `1px solid ${color}30`,
                color
              }}
            >
              <FontAwesomeIcon icon={faLock} />
              Ẩn thông tin
            </div>

            <div
              className={`text-xs px-2 py-1 rounded-lg font-bold ${isSold
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-green-500/20 text-green-400 border border-green-500/30'
                }`}
            >
              {isSold ? 'Đã bán' : 'Còn acc'}
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-gaming text-sm font-bold text-white leading-tight line-clamp-1">
                Acc Túi Mù {account.code}
              </h3>
              <p className="text-white/35 text-xs mt-1">
                {account.category?.name || 'Túi mù'}
              </p>
            </div>

            <FontAwesomeIcon
              icon={faEye}
              className="text-sm mt-1 opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
              style={{ color }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="rounded-xl p-3 bg-dark-800/80 border border-white/5">
              <div className="text-white/30 text-[10px] uppercase tracking-wider mb-1">
                Độ hiếm
              </div>
              <div className="font-bold text-sm" style={{ color }}>
                {getRarityLabel(account.rarity)}
              </div>
            </div>

            <div className="rounded-xl p-3 bg-dark-800/80 border border-white/5">
              <div className="text-white/30 text-[10px] uppercase tracking-wider mb-1">
                Trạng thái
              </div>
              <div className={`font-bold text-sm ${isSold ? 'text-red-400' : 'text-green-400'}`}>
                {isSold ? 'Đã bán' : 'Có sẵn'}
              </div>
            </div>
          </div>

          <div className="rounded-xl p-3 mb-4" style={{ background: `${color}10`, border: `1px solid ${color}25` }}>
            <div className="flex items-center gap-2 text-white/55 text-xs leading-relaxed">
              <FontAwesomeIcon icon={faCircleInfo} style={{ color }} />
              Acc ngẫu nhiên trong túi. Thông tin đăng nhập chỉ hiện sau khi mở thành công.
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <div>
              <div className="text-white/30 text-[10px] uppercase tracking-wider">Giá mở</div>
              <div
                className="font-gaming text-base font-black whitespace-nowrap"
                style={{ color, textShadow: `0 0 18px ${color}55` }}
              >
                {formatCurrency(account.category?.price)}
              </div>
            </div>

            <div
              className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-black flex items-center gap-1.5 whitespace-nowrap"
              style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
            >
              <FontAwesomeIcon icon={faBoxOpen} />
              Xem
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

const stripMarkdownLink = str => {
  if (!str) return str

  const mailtoMatch = str.match(/\[.*?\]\(mailto:([^)]+)\)/)
  if (mailtoMatch) return mailtoMatch[1].trim()

  const linkMatch = str.match(/\[.*?\]\(([^)]+)\)/)
  if (linkMatch) return linkMatch[1].trim()

  return str
}

const parseBindInfo = bindInfo => {
  if (!bindInfo) return { email: null, phone: null }

  const cleaned = stripMarkdownLink(bindInfo.trim())

  let email = null
  let phone = null

  const parts = cleaned.includes('/')
    ? cleaned.split('/')
    : [cleaned]

  for (const part of parts) {
    const p = stripMarkdownLink(part.trim())

    if (!p) continue

    if (p.includes('@')) {
      email = p
    } else {
      phone = p
    }
  }

  return { email, phone }
}

function OpenResultModal({ result, onClose }) {
  const [revealed, setRevealed] = useState(false)

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
          style={{
            borderColor: `${color}60`,
            boxShadow: `0 0 80px ${color}40, 0 0 160px ${color}20`
          }}
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

          <div className="text-white/50 text-sm mb-4">
            Từ {result.category?.name}
          </div>

          <div
            className="rounded-xl p-4 mb-4"
            style={{ background: `${color}15`, border: `1px solid ${color}30` }}
          >
            <div className="font-mono text-sm text-white/50 mb-2">
              Mã acc: <span className="text-white font-bold">{result.account?.code}</span>
            </div>

            <RarityBadge rarity={result.account.rarity} size="md" />

            {result.account.gameUsername && (
              <div className="bg-dark-900/80 rounded-lg p-3 text-left space-y-1.5 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs text-white/30 uppercase tracking-wider flex items-center gap-2">
                    <FontAwesomeIcon icon={revealed ? faUnlock : faLock} style={{ color }} />
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

                <div className="text-sm text-white/70">
                  <span className="text-white/40">Username: </span>
                  <span
                    className={`font-mono ${revealed
                      ? 'text-white'
                      : 'text-white/60 bg-white/10 rounded px-2 select-none inline-block min-w-[120px]'
                      }`}
                    style={!revealed ? { filter: 'blur(5px)', userSelect: 'none' } : {}}
                  >
                    {result.account.gameUsername}
                  </span>
                </div>

                {result.account.gamePassword && (
                  <div className="text-sm text-white/70 mt-1">
                    <span className="text-white/40">Password: </span>
                    <span
                      className={`font-mono ${revealed
                          ? 'text-white'
                          : 'text-white/60 bg-white/10 rounded px-2 select-none inline-block min-w-[120px]'
                        }`}
                      style={!revealed ? { filter: 'blur(5px)', userSelect: 'none' } : {}}
                    >
                      {result.account.gamePassword}
                    </span>
                  </div>
                )}

                {bindEmail && (
                  <div className="text-sm text-white/70">
                    <span className="text-white/40">Email: </span>
                    <span
                      className={`font-mono ${revealed
                        ? 'text-white'
                        : 'text-white/60 bg-white/10 rounded px-2 select-none inline-block min-w-[120px]'
                        }`}
                      style={!revealed ? { filter: 'blur(5px)', userSelect: 'none' } : {}}
                    >
                      {bindEmail}
                    </span>
                  </div>
                )}

                {bindPhone && (
                  <div className="text-sm text-white/70">
                    <span className="text-white/40">SĐT: </span>
                    <span
                      className={`font-mono ${revealed
                        ? 'text-white'
                        : 'text-white/60 bg-white/10 rounded px-2 select-none inline-block min-w-[120px]'
                        }`}
                      style={!revealed ? { filter: 'blur(5px)', userSelect: 'none' } : {}}
                    >
                      {bindPhone}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="text-white/40 text-xs mt-2">
            Đã trừ {formatCurrency(result.pricePaid)} • Số dư: {formatCurrency(result.newBalance)}
          </div>

          <div className="flex gap-3 mt-6">
            <Link
              to="/owned-accounts"
              className="flex-1 btn-neon text-sm py-2.5 text-center"
              style={{ borderColor: `${color}60`, color }}
            >
              Kho Acc
            </Link>

            <button
              onClick={onClose}
              className="flex-1 btn-primary py-2.5 text-sm"
            >
              <FontAwesomeIcon icon={faCircleCheck} className="mr-2" />
              Mở tiếp
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

const normalizeHtml = html => {
  if (!html) return ''

  const textarea = document.createElement('textarea')
  textarea.innerHTML = html
  const decoded = textarea.value

  return decoded
    .replace(/^<p>/i, '')
    .replace(/<\/p>$/i, '')
}

export default function MysteryBoxAccountsPage() {
  const { slug } = useParams()
  const { user } = useSelector(s => s.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [category, setCategory] = useState(null)
  const [accounts, setAccounts] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [opening, setOpening] = useState(false)
  const [result, setResult] = useState(null)
  const [rarityFilter, setRarityFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')

  const fetchData = async (p = 1, rarity = 'ALL', keyword = search) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: p, limit: 8 })

      if (rarity !== 'ALL') {
        params.append('rarity', rarity)
      }
      if (keyword.trim()) {
        params.append('search', keyword.trim())
      }

      const { data } = await api.get(`/mystery-box/categories/${slug}?${params}`)

      setCategory(data.data.category)
      setAccounts(data.data.accounts || [])
      setPagination(data.data.pagination || { page: p, pages: 1, total: 0 })
    } catch (e) {
      toast.error(e.response?.data?.message || 'Không thể tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(1, rarityFilter, search)
    setPage(1)
  }, [slug, rarityFilter, search])

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 400)

    return () => clearTimeout(t)
  }, [searchInput])

  const handleOpen = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để mở túi mù')
      return
    }

    if (!category) return

    if (parseFloat(user.balance) < parseFloat(category.price)) {
      toast.error(`Số dư không đủ! Cần ${formatCurrency(category.price)}`)
      return
    }

    setOpening(true)

    try {
      const { data } = await api.post(`/mystery-box/categories/${category.id}/open`)

      dispatch(updateBalance(data.data.newBalance))
      setResult(data.data)
      fetchData(page, rarityFilter)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi mở túi mù')
    } finally {
      setOpening(false)
    }
  }

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.pages) return

    setPage(newPage)
    fetchData(newPage, rarityFilter, search)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const color = category ? getRarityColor(category.rarity) : '#9ca3af'

  return (
    <div className="pt-20 pb-20 min-h-screen">
      {category && (
        <div
          className="page-container flex flex-col sm:flex-row items-center gap-5 mb-8 pt-4"
          style={{ borderBottom: `1px solid ${color}20`, paddingBottom: '1.5rem' }}
        >
          {category.thumbnail && (
            <img
              src={category.thumbnail}
              alt={category.name}
              className="w-52 h-28 rounded-xl object-cover shrink-0"
              style={{
                border: `1px solid ${color}40`,
                boxShadow: `0 0 16px ${color}25`
              }}
            />
          )}
          <div className="flex-1 text-center sm:text-left">
            <div className="mb-1.5">
              <RarityBadge rarity={category.rarity} size="sm" />
            </div>
            <h1
              className="font-gaming text-2xl md:text-3xl font-black text-white mb-2"
              style={{ textShadow: `0 0 20px ${color}50` }}
            >
              {category.name}
            </h1>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-white/55 text-sm">
              <span>
                <FontAwesomeIcon icon={faLayerGroup} className="mr-1.5" style={{ color }} />
                {pagination.total} acc còn lại
              </span>
              <span className="text-white/20">•</span>
              <span>
                <FontAwesomeIcon icon={faFire} className="mr-1.5" style={{ color }} />
                {category.soldCount} đã bán
              </span>
              <span className="text-white/20">•</span>
              <span>
                <FontAwesomeIcon icon={faMoneyBillWave} className="mr-1.5" style={{ color }} />
                {formatCurrency(category.price)} / lượt
              </span>
            </div>
          </div>
        </div>
      )}
      <div className="page-container">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <button
            onClick={() => navigate('/mystery-box')}
            className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm w-fit"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            Tất cả túi mù
          </button>

          {category && (
            <div className="flex items-center gap-3">
              {user && (
                <div className="text-right hidden sm:block">
                  <div className="text-white/30 text-xs">Số dư</div>
                  <div className="font-gaming text-sm font-bold text-yellow-400">
                    {formatCurrency(user.balance)}
                  </div>
                </div>
              )}

              <motion.button
                onClick={handleOpen}
                disabled={opening || !user}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="relative px-6 py-3 rounded-xl font-gaming font-bold text-sm text-black flex items-center gap-2 disabled:opacity-50"
                style={{
                  background: `linear-gradient(135deg, ${color}, ${color}bb)`,
                  boxShadow: `0 0 20px ${color}40`
                }}
              >
                {opening ? (
                  <>
                    <Spinner size="sm" color="white" />
                    Đang mở...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faBoxOpen} />
                    Mở Túi — {formatCurrency(category?.price)}
                  </>
                )}
              </motion.button>
            </div>
          )}
        </div>

        {category && (
          <div
            className="gaming-card p-5 mb-6"
            style={{ borderColor: `${color}25` }}
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: `${color}18`, border: `1px solid ${color}35` }}
                >
                  <FontAwesomeIcon icon={faBoxOpen} style={{ color }} />
                </div>
                <div>
                  <div className="text-white/30 text-xs">Loại túi</div>
                  <div className="text-white font-bold text-sm">{category.name}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: `${color}18`, border: `1px solid ${color}35` }}
                >
                  <FontAwesomeIcon icon={faShieldHalved} style={{ color }} />
                </div>
                <div>
                  <div className="text-white/30 text-xs">Độ hiếm</div>
                  <div className="text-white font-bold text-sm">{getRarityLabel(category.rarity)}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: `${color}18`, border: `1px solid ${color}35` }}
                >
                  <FontAwesomeIcon icon={faGem} style={{ color }} />
                </div>
                <div>
                  <div className="text-white/30 text-xs">Acc còn</div>
                  <div className="text-white font-bold text-sm">{pagination.total}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: `${color}18`, border: `1px solid ${color}35` }}
                >
                  <FontAwesomeIcon icon={faClock} style={{ color }} />
                </div>
                <div>
                  <div className="text-white/30 text-xs">Giao acc</div>
                  <div className="text-white font-bold text-sm">Tự động sau khi mở</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {category?.description && (
          <div
            className="gaming-card p-5 mb-6"
            style={{ borderColor: `${color}25` }}
          >
            <div className="flex items-center gap-2 text-white/40 text-xs uppercase tracking-wider font-display mb-3">
              <FontAwesomeIcon icon={faCircleInfo} style={{ color }} />
              Túi mù này có gì?
            </div>

            <div className="ql-snow">
              <div
                className="ql-editor !p-0 !text-white/80 !leading-relaxed
          [&_h1]:!text-white [&_h2]:!text-white [&_h3]:!text-white
          [&_p]:!text-white/80
          [&_strong]:!text-white
          [&_a]:!text-neon-pink
          [&_ul]:!text-white/80 [&_ol]:!text-white/80
          [&_li]:!text-white/80
          [&_img]:!rounded-xl [&_img]:!border [&_img]:!border-white/10"
                dangerouslySetInnerHTML={{ __html: normalizeHtml(category.description) }}
              />
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-6">
          {RARITIES.map(r => {
            const rColor = r === 'ALL' ? '#e5e7eb' : getRarityColor(r)

            return (
              <button
                key={r}
                onClick={() => setRarityFilter(r)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200"
                style={rarityFilter === r
                  ? {
                    background: rColor,
                    color: '#000',
                    boxShadow: `0 0 12px ${rColor}60`
                  }
                  : {
                    background: `${rColor}15`,
                    color: rColor,
                    border: `1px solid ${rColor}30`
                  }
                }
              >
                {r === 'ALL' ? 'Tất cả' : getRarityLabel(r)}
              </button>
            )
          })}
        </div>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="relative w-full sm:w-64 md:w-72">
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
                onClick={() => setSearchInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4 opacity-20">🔍</div>
            <div className="text-white/40 font-display">Không có acc nào khớp</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {accounts.map((acc, i) => (
              <MysteryAccountCard
                key={acc.id}
                account={acc}
                index={i}
                onViewDetail={() => navigate(`/mystery-box/account/${acc.id}`)}
              />
            ))}
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="w-9 h-9 rounded-lg flex items-center justify-center gaming-card disabled:opacity-30 hover:border-neon-pink/40 transition-colors"
            >
              <FontAwesomeIcon icon={faChevronLeft} className="text-sm" />
            </button>

            <span className="text-white/50 text-sm">
              Trang {page} / {pagination.pages}
            </span>

            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= pagination.pages}
              className="w-9 h-9 rounded-lg flex items-center justify-center gaming-card disabled:opacity-30 hover:border-neon-pink/40 transition-colors"
            >
              <FontAwesomeIcon icon={faChevronRight} className="text-sm" />
            </button>
          </div>
        )}

        {!user && (
          <div className="mt-10 text-center gaming-card p-6 border-neon-purple/30">
            <p className="text-white/60 mb-3">
              Đăng nhập để mua và nhận acc túi mù
            </p>

            <Link to="/login" className="btn-primary px-8 py-2.5 text-sm">
              <FontAwesomeIcon icon={faWandMagicSparkles} className="mr-2" />
              Đăng Nhập Ngay
            </Link>
          </div>
        )}
      </div>

      {result && (
        <OpenResultModal
          result={result}
          onClose={() => setResult(null)}
        />
      )}
    </div>
  )
}