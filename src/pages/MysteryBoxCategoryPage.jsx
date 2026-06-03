import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import { formatCurrency, getRarityColor, getRarityLabel } from '../utils/helpers'
import { SectionHeader, RarityBadge, Spinner } from '../components/common/UIComponents'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBoxOpen,
  faRightToBracket,
  faGem,
  faMoneyBillWave,
  faLayerGroup,
  faChevronRight,
  faFire,
  faShieldHalved,
  faChevronLeft,
  faChevronRight as faChevronRightPage,
} from '@fortawesome/free-solid-svg-icons'

const RARITY_BG = {
  COMMON: 'from-gray-500/10 via-dark-700/70 to-dark-800',
  RARE: 'from-blue-500/15 via-dark-700/70 to-dark-800',
  EPIC: 'from-purple-500/20 via-dark-700/70 to-dark-800',
  LEGENDARY: 'from-yellow-500/20 via-dark-700/70 to-dark-800',
  MYTHIC: 'from-red-500/25 via-dark-700/70 to-dark-800',
}

const RARITY_BORDER = {
  COMMON: 'rgba(156,163,175,0.35)',
  RARE: 'rgba(96,165,250,0.45)',
  EPIC: 'rgba(167,139,250,0.55)',
  LEGENDARY: 'rgba(251,191,36,0.55)',
  MYTHIC: 'rgba(248,113,113,0.65)',
}

const RARITY_GLOW = {
  COMMON: 'none',
  RARE: '0 0 18px rgba(96,165,250,0.12)',
  EPIC: '0 0 20px rgba(167,139,250,0.16)',
  LEGENDARY: '0 0 24px rgba(251,191,36,0.18)',
  MYTHIC: '0 0 28px rgba(248,113,113,0.22)',
}

function CategoryCard({ category, index }) {
  const color = getRarityColor(category.rarity)
  const borderColor = RARITY_BORDER[category.rarity] || RARITY_BORDER.COMMON
  const glowShadow = RARITY_GLOW[category.rarity] || 'none'

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      whileHover={{ y: -5, scale: 1.01 }}
      className="relative group h-full"
    >
      <Link to={`/mystery-box/${category.slug}`} className="block h-full">
        <div
          className={`relative h-full min-h-[330px] overflow-hidden rounded-xl bg-gradient-to-b ${RARITY_BG[category.rarity]} flex flex-col`}
          style={{
            border: `1px solid ${borderColor}`,
            boxShadow: glowShadow,
          }}
        >
          <div
            className="absolute top-0 left-0 right-0 h-0.5 opacity-80"
            style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
          />

          <div className="relative h-40 overflow-hidden bg-dark-800 shrink-0">
            {category.thumbnail ? (
              <motion.img
                src={category.thumbnail}
                alt={category.name}
                className="w-full h-full object-cover"
                whileHover={{ scale: 1.06 }}
                transition={{ duration: 0.4 }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <FontAwesomeIcon icon={faBoxOpen} className="text-5xl opacity-20" style={{ color }} />
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-dark-900/85 via-transparent to-transparent" />

            <div className="absolute top-2 right-2">
              <RarityBadge rarity={category.rarity} size="sm" />
            </div>

            <div className="absolute bottom-2 left-2">
              <div
                className="text-[11px] font-mono px-2 py-1 rounded-lg backdrop-blur-sm"
                style={{
                  background: 'rgba(0,0,0,0.72)',
                  border: `1px solid ${color}30`,
                  color,
                }}
              >
                <FontAwesomeIcon icon={faLayerGroup} className="mr-1.5" />
                {category.availableCount ?? 0} acc
              </div>
            </div>
          </div>

          <div className="p-4 flex flex-col flex-1">
            <div className="flex items-start justify-between gap-2 mb-2 min-h-[44px]">
              <h3 className="font-gaming text-base font-bold text-white leading-tight line-clamp-2">
                {category.name}
              </h3>

              <FontAwesomeIcon
                icon={faChevronRight}
                className="text-xs mt-1 opacity-35 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200 shrink-0"
                style={{ color }}
              />
            </div>

            <div className="flex items-center gap-2 mb-3 min-h-[20px]">
              <div className="flex items-center gap-1 text-[11px] text-white/55">
                <FontAwesomeIcon icon={faFire} style={{ color }} />
                <span>{category.soldCount || 0} đã bán</span>
              </div>

              <div className="w-px h-3 bg-white/10" />

              <div className="flex items-center gap-1 text-[11px] text-white/55">
                <FontAwesomeIcon icon={faShieldHalved} style={{ color }} />
                <span>{getRarityLabel(category.rarity)}</span>
              </div>
            </div>

            <div className="mt-auto pt-3 border-t border-white/10">
              <div className="flex items-end justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-white/45 text-[10px] uppercase tracking-wider mb-1">
                    Giá mỗi túi
                  </div>

                  <div
                    className="font-gaming text-lg font-black whitespace-nowrap"
                    style={{ color, textShadow: `0 0 14px ${color}50` }}
                  >
                    {formatCurrency(category.price)}
                  </div>
                </div>

                <motion.div
                  className="shrink-0 px-3 py-2 rounded-lg text-xs font-bold text-black flex items-center gap-1.5 whitespace-nowrap"
                  style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                >
                  <FontAwesomeIcon icon={faBoxOpen} />
                  Xem
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default function MysteryBoxCategoryPage() {
  const { user } = useSelector(s => s.auth)

  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  const [page, setPage] = useState(1)
  const [limit] = useState(12)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchCategories()
  }, [page])

  const fetchCategories = async () => {
    setLoading(true)

    try {
      const { data } = await api.get('/mystery-box/categories', {
        params: {
          page,
          limit,
        },
      })

      setCategories(data.data || [])
      setTotal(data.pagination?.total || 0)
      setTotalPages(data.pagination?.pages || 1)
    } catch {
      setCategories([])
      setTotal(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  const goToPage = p => {
    if (p < 1 || p > totalPages || p === page) return
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="pt-20 pb-20 min-h-screen">
      <div className="page-container">
        <SectionHeader
          title={
            <>
              <FontAwesomeIcon icon={faBoxOpen} className="mr-3 text-neon-pink" />
              Túi Mù AOV
            </>
          }
          subtitle={`Mở túi mù — nhận acc game thật với rank và skin xịn. Tổng ${total} loại túi.`}
        />

        {user && (
          <div className="flex justify-center mb-10">
            <div className="gaming-card px-6 py-3 border-yellow-500/20 flex items-center gap-4">
              <FontAwesomeIcon icon={faGem} className="text-2xl text-yellow-400" />

              <div>
                <div className="text-white/40 text-xs">Số dư hiện tại</div>
                <div className="font-gaming text-xl font-bold text-yellow-400">
                  {formatCurrency(user.balance)}
                </div>
              </div>

              <Link to="/deposit" className="btn-neon border-yellow-500/30 text-yellow-400 text-xs px-4 py-1.5">
                <FontAwesomeIcon icon={faMoneyBillWave} className="mr-1" />
                Nạp thêm
              </Link>
            </div>
          </div>
        )}

        {!user && (
          <div className="text-center mb-10">
            <div className="gaming-card inline-block p-6 border-neon-purple/30">
              <p className="text-white/60 mb-3">Đăng nhập để mua túi mù ngay</p>

              <Link to="/login" className="btn-primary px-8 py-2.5 text-sm">
                <FontAwesomeIcon icon={faRightToBracket} className="mr-2" />
                Đăng Nhập
              </Link>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4 opacity-20">📦</div>
            <div className="text-white/40 font-display">Chưa có túi mù nào. Hãy quay lại sau!</div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
              {categories.map((cat, i) => (
                <CategoryCard key={cat.id} category={cat} index={i} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-10">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                  className="w-9 h-9 rounded-lg bg-dark-800 border border-white/10 text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
                </button>

                {[...Array(totalPages)].map((_, i) => {
                  const p = i + 1

                  return (
                    <button
                      key={p}
                      onClick={() => goToPage(p)}
                      className={`w-9 h-9 rounded-lg border text-sm font-bold transition-colors ${
                        page === p
                          ? 'bg-neon-pink/20 border-neon-pink/40 text-neon-pink'
                          : 'bg-dark-800 border-white/10 text-white/50 hover:text-white'
                      }`}
                    >
                      {p}
                    </button>
                  )
                })}

                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages}
                  className="w-9 h-9 rounded-lg bg-dark-800 border border-white/10 text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <FontAwesomeIcon icon={faChevronRightPage} className="text-xs" />
                </button>
              </div>
            )}
          </>
        )}

        <div className="gaming-card p-6 mt-12">
          <h3 className="font-gaming text-sm font-bold text-gradient mb-4 uppercase tracking-wider">
            Hệ Thống Độ Hiếm Acc
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {['COMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC'].map(r => (
              <div
                key={r}
                className="text-center p-3 rounded-lg"
                style={{
                  background: `${getRarityColor(r)}10`,
                  border: `1px solid ${getRarityColor(r)}30`,
                }}
              >
                <div className="font-bold text-sm mb-1" style={{ color: getRarityColor(r) }}>
                  {getRarityLabel(r)}
                </div>

                <div className="text-white/30 text-xs">
                  {r === 'COMMON'
                    ? 'Phổ thông'
                    : r === 'RARE'
                      ? 'Tốt'
                      : r === 'EPIC'
                        ? 'Xịn'
                        : r === 'LEGENDARY'
                          ? 'Siêu hiếm'
                          : 'Cực hiếm'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}