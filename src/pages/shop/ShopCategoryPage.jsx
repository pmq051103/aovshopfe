import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import { formatCurrency } from '../../utils/helpers'
import { SectionHeader, Spinner } from '../../components/common/UIComponents'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faGamepad,
  faChevronRight,
  faChevronLeft,
  faLayerGroup,
  faShieldHalved,
  faCoins,
  faFire,
  faBoxOpen,
} from '@fortawesome/free-solid-svg-icons'

const CARD_GRADIENTS = [
  'from-neon-pink/25 via-dark-700/80 to-dark-800',
  'from-neon-blue/25 via-dark-700/80 to-dark-800',
  'from-purple-500/25 via-dark-700/80 to-dark-800',
  'from-yellow-500/25 via-dark-700/80 to-dark-800',
  'from-green-500/25 via-dark-700/80 to-dark-800',
  'from-red-500/25 via-dark-700/80 to-dark-800',
]

const BORDER_COLORS = [
  'rgba(255,45,115,0.55)',
  'rgba(0,212,255,0.55)',
  'rgba(139,92,246,0.55)',
  'rgba(251,191,36,0.55)',
  'rgba(34,197,94,0.55)',
  'rgba(239,68,68,0.55)',
]

const TEXT_COLORS = [
  '#ff4f8b',
  '#22d3ee',
  '#a855f7',
  '#facc15',
  '#22c55e',
  '#ef4444',
]

const GLOW_COLORS = [
  'rgba(255,45,115,0.18)',
  'rgba(0,212,255,0.18)',
  'rgba(139,92,246,0.18)',
  'rgba(251,191,36,0.18)',
  'rgba(34,197,94,0.18)',
  'rgba(239,68,68,0.18)',
]

const ICON_MAP = {
  gamepad: faGamepad,
  coins: faCoins,
  fire: faFire,
  shield: faShieldHalved,
  box: faBoxOpen,
}

function CategoryCard({ category, index }) {
  const grad = CARD_GRADIENTS[index % CARD_GRADIENTS.length]
  const border = BORDER_COLORS[index % BORDER_COLORS.length]
  const glow = GLOW_COLORS[index % GLOW_COLORS.length]
  const textColor = TEXT_COLORS[index % TEXT_COLORS.length]

  const count = category.availableCount ?? 0
  const hasAccounts = count > 0

  const minPrice = category.minPrice ? parseFloat(category.minPrice) : null
  const maxPrice = category.maxPrice ? parseFloat(category.maxPrice) : null
  const hasRange = minPrice && maxPrice && maxPrice !== minPrice

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      whileHover={{ y: -6, scale: 1.01 }}
      className="h-full"
    >
      <Link to={`/shop/${category.slug}`} className="block h-full">
        <div
          className={`relative h-full min-h-[280px] sm:min-h-[360px] overflow-hidden rounded-2xl bg-gradient-to-b ${grad} group transition-all duration-300 flex flex-col`}
          style={{
            border: `1px solid ${border}`,
            boxShadow: `0 4px 24px ${glow}`,
          }}
        >
          <div
            className="absolute top-0 left-0 right-0 h-0.5"
            style={{ background: `linear-gradient(90deg, transparent, ${border}, transparent)` }}
          />

          <div className="relative h-28 sm:h-44 shrink-0 overflow-hidden bg-dark-800">
            {category.imageUrl ? (
              <motion.img
                src={category.imageUrl}
                alt={category.name}
                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <FontAwesomeIcon
                  icon={ICON_MAP[category.icon] || faGamepad}
                  className="text-5xl opacity-30"
                  style={{ color: textColor }}
                />
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-dark-900/85 via-dark-900/10 to-transparent" />

            <div className="absolute bottom-3 left-3">
              <div
                className="text-xs font-mono px-2.5 py-1 rounded-lg backdrop-blur-sm flex items-center gap-1.5"
                style={{
                  background: 'rgba(0,0,0,0.75)',
                  border: `1px solid ${border}`,
                  color: textColor,
                }}
              >
                <FontAwesomeIcon icon={faLayerGroup} className="text-[10px]" />
                {hasAccounts ? `${count} acc` : 'Hết hàng'}
              </div>
            </div>

            {!hasAccounts && (
              <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                <span className="text-white/70 text-sm font-bold tracking-widest uppercase">
                  Hết hàng
                </span>
              </div>
            )}
          </div>

          <div className="p-2.5 sm:p-4 flex flex-col flex-1">
            <div className="flex items-start justify-between gap-3 mb-3 min-h-[36px]">
              <div className="min-w-0 flex items-center gap-2">
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: border,
                    color: '#ffffff',
                  }}
                >
                  <FontAwesomeIcon icon={ICON_MAP[category.icon] || faGamepad} className="text-sm" />
                </span>

                <h3 className="font-gaming text-xs sm:text-base font-bold text-white leading-tight line-clamp-1">
                  {category.name}
                </h3>
              </div>

              <FontAwesomeIcon
                icon={faChevronRight}
                className="text-sm mt-2 opacity-35 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200 shrink-0"
                style={{ color: textColor }}
              />
            </div>

            <p className="hidden sm:block text-white/65 text-xs mb-4 line-clamp-2 leading-relaxed min-h-[40px]">
              {category.description || 'Xem danh sách tài khoản trong danh mục này'}
            </p>

            <div className="mt-auto pt-4 border-t border-white/10">
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-white/50 text-[10px] uppercase tracking-wider mb-1">
                    Giá từ
                  </div>

                  {minPrice ? (
                    <div className="min-h-[44px]">
                      <div
                        className="font-gaming font-black text-[13px] sm:text-[17px] leading-none whitespace-nowrap"
                        style={{ color: textColor }}
                      >
                        {formatCurrency(minPrice)}
                      </div>

                      {hasRange ? (
                        <div className="text-white/55 text-[11px] mt-1 whitespace-nowrap overflow-hidden text-ellipsis">
                          đến {formatCurrency(maxPrice)}
                        </div>
                      ) : (
                        <div className="text-white/30 text-[11px] mt-1">
                          Giá cố định
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="min-h-[44px] text-white/40 text-sm">
                      Đang cập nhật
                    </div>
                  )}
                </div>

                <motion.div
                  className="shrink-0 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-[10px] sm:text-[11px] font-bold flex items-center gap-1 whitespace-nowrap"
                  style={{
                    background: hasAccounts ? `${border}25` : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${hasAccounts ? border : 'rgba(255,255,255,0.12)'}`,
                    color: hasAccounts ? textColor : 'rgba(255,255,255,0.35)',
                  }}
                  whileHover={hasAccounts ? { scale: 1.05 } : {}}
                >
                  <FontAwesomeIcon icon={faGamepad} />
                  Xem acc
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default function ShopCategoryPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalAccounts, setTotalAccounts] = useState(0)

  const [page, setPage] = useState(1)
  const [limit] = useState(12)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCategories, setTotalCategories] = useState(0)

  useEffect(() => {
    fetchCategories()
  }, [page])

  const fetchCategories = async () => {
    setLoading(true)

    try {
      const r = await api.get('/categories', {
        params: {
          page,
          limit,
        },
      })

      const cats = r.data.data || []

      setCategories(cats)
      setTotalAccounts(cats.reduce((sum, c) => sum + (c.availableCount ?? 0), 0))
      setTotalCategories(r.data.pagination?.total || cats.length)
      setTotalPages(r.data.pagination?.pages || r.data.pagination?.totalPages || 1)
    } catch {
      setCategories([])
      setTotalAccounts(0)
      setTotalCategories(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  const goToPage = newPage => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return

    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const prices = categories
    .filter(c => c.minPrice)
    .map(c => parseFloat(c.minPrice))

  const cheapestPrice = prices.length > 0 ? formatCurrency(Math.min(...prices)) : '—'

  const bestSelling =
    [...categories].sort((a, b) => (b.availableCount ?? 0) - (a.availableCount ?? 0))[0]?.name || '—'

  return (
    <div className="pt-24 pb-20 min-h-screen">
      <div className="page-container">
        <SectionHeader
          title={
            <>
              <FontAwesomeIcon icon={faGamepad} className="mr-3 text-neon-pink" />
              Shop Tài Khoản AOV
            </>
          }
          subtitle={`${totalCategories} danh mục — ${totalAccounts} tài khoản đang có sẵn trong trang này`}
        />

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4 opacity-20">🎮</div>
            <div className="text-white/40 font-display">Chưa có danh mục nào</div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-stretch">
              {categories.map((cat, i) => (
                <CategoryCard key={cat.id} category={cat} index={i} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 mt-10">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                  className="w-9 h-9 rounded-lg flex items-center justify-center gaming-card disabled:opacity-30 hover:border-neon-pink/40 transition-colors"
                >
                  <FontAwesomeIcon icon={faChevronLeft} className="text-sm" />
                </button>

                <span className="text-white/50 text-sm">
                  Trang {page} / {totalPages}
                </span>

                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages}
                  className="w-9 h-9 rounded-lg flex items-center justify-center gaming-card disabled:opacity-30 hover:border-neon-pink/40 transition-colors"
                >
                  <FontAwesomeIcon icon={faChevronRight} className="text-sm" />
                </button>
              </div>
            )}
          </>
        )}

        {!loading && categories.length > 0 && (
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                icon: faLayerGroup,
                label: 'Danh mục',
                value: totalCategories,
                color: 'text-neon-pink',
              },
              {
                icon: faShieldHalved,
                label: 'Acc trang này',
                value: totalAccounts,
                color: 'text-neon-blue',
              },
              {
                icon: faCoins,
                label: 'Giá thấp nhất',
                value: cheapestPrice,
                color: 'text-neon-green',
              },
              {
                icon: faFire,
                label: 'Nổi bật',
                value: bestSelling,
                color: 'text-yellow-400',
              },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.05 }}
                className="gaming-card p-4 text-center"
              >
                <FontAwesomeIcon icon={s.icon} className={`text-2xl mb-2 ${s.color}`} />
                <div className={`font-gaming font-bold text-sm ${s.color} line-clamp-1`}>
                  {s.value}
                </div>
                <div className="text-white/45 text-xs mt-0.5">{s.label}</div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}