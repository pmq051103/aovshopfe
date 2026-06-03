import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import AccountCard from '../../components/shop/AccountCard'
import {
  SkeletonCard,
  Pagination,
  EmptyState,
  Spinner
} from '../../components/common/UIComponents'
import api from '../../api/axios'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft,
  faGamepad,
  faLayerGroup,
  faFilter,
  faSearch,
  faXmark,
  faCrown,
  faGem,
  faFire,
  faStar,
  faTrophy,
  faCoins,
  faShieldHalved,
  faDice,
  faBolt,
  faDragon,
  faGhost,
  faSkull,
  faRocket,
  faMedal,
  faWandMagicSparkles,
  faHeart,
  faHammer,
  faBomb,
  faKey,
  faFolderOpen,
  faSort,
  faEnvelope,
  faPhone,
  faLink,
  faTriangleExclamation,
  faBan
} from '@fortawesome/free-solid-svg-icons'

const sortOptions = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
  { value: 'popular', label: 'Phổ biến' },
]

const defaultParams = {
  page: 1,
  limit: 12,
  sort: 'newest',
  rank: '',
  server: '',
  minPrice: '',
  maxPrice: '',
  minSkins: '',
  maxSkins: '',
  minChampions: '',
  maxChampions: '',
  skinName: '',
  search: '',
  hasEmail: false,
  hasPhone: false,
  blankInfo: false,
  gameBindFacebook: '',
}

const ICON_MAP = {
  gamepad: faGamepad,
  crown: faCrown,
  gem: faGem,
  fire: faFire,
  star: faStar,
  trophy: faTrophy,
  coins: faCoins,
  shield: faShieldHalved,
  dice: faDice,
  bolt: faBolt,
  dragon: faDragon,
  ghost: faGhost,
  skull: faSkull,
  rocket: faRocket,
  medal: faMedal,
  wand: faWandMagicSparkles,
  heart: faHeart,
  hammer: faHammer,
  bomb: faBomb,
  key: faKey,
  folder: faFolderOpen,
}

function CategoryIcon({ value, className = '' }) {
  return (
    <FontAwesomeIcon
      icon={ICON_MAP[value] || faGamepad}
      className={className}
    />
  )
}

export default function ShopPage() {
  const { slug } = useParams()
  const navigate = useNavigate()

  const [category, setCategory] = useState(null)
  const [catLoading, setCatLoading] = useState(true)
  const [accounts, setAccounts] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [filters, setFilters] = useState({
    ranks: [],
    servers: [],
    priceRange: {},
    popularSkins: []
  })
  const [loading, setLoading] = useState(true)
  const [params, setParams] = useState(defaultParams)
  const [searchInput, setSearchInput] = useState('')

  useEffect(() => {
    setCatLoading(true)

    api.get(`/categories/${slug}`)
      .then(r => setCategory(r.data.data))
      .catch(() => navigate('/shop', { replace: true }))
      .finally(() => setCatLoading(false))

    api.get('/accounts/filters')
      .then(r => setFilters(r.data.data || filters))
      .catch(() => {})

    setParams(defaultParams)
    setSearchInput('')
  }, [slug])

  const fetchAccounts = useCallback(async () => {
    if (!category?.id) return

    setLoading(true)

    try {
      const query = new URLSearchParams()
      query.append('categoryId', category.id)

      Object.entries(params).forEach(([k, v]) => {
        if (v !== '' && v !== null && v !== undefined) {
          query.append(k, v)
        }
      })

      const { data } = await api.get(`/accounts?${query}`)

      setAccounts(data.data || [])
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 })
    } catch {
      setAccounts([])
    } finally {
      setLoading(false)
    }
  }, [params, category?.id])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  const handleSearch = e => {
    e.preventDefault()
    setParams(p => ({ ...p, search: searchInput.trim(), page: 1 }))
  }

  const updateParam = (key, val) => {
    setParams(p => ({ ...p, [key]: val, page: 1 }))
  }

  const clearFilters = () => {
    setParams(defaultParams)
    setSearchInput('')
  }

  const activeFiltersCount = [
    params.rank,
    params.server,
    params.minPrice,
    params.maxPrice,
    params.minSkins,
    params.maxSkins,
    params.minChampions,
    params.maxChampions,
    params.skinName,
    params.search,
    params.hasEmail,
    params.hasPhone,
    params.blankInfo,
    params.gameBindFacebook,
  ].filter(Boolean).length

  if (catLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="pt-20 pb-20 min-h-screen">
      <div className="page-container">
        {/* Breadcrumb */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/shop')}
            className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            Tất cả danh mục
          </button>

          <span className="text-white/20">/</span>

          <span className="text-white/60 text-sm flex items-center gap-2">
            <CategoryIcon value={category?.icon} className="text-neon-pink" />
            {category?.name}
          </span>
        </div>

        {/* Category header */}
        <div className="gaming-card p-6 mb-8 flex items-center gap-5 border-neon">
          {category?.imageUrl ? (
            <img
              src={category.imageUrl}
              alt={category.name}
              className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-dark-700 flex items-center justify-center text-3xl flex-shrink-0 text-neon-pink">
              <CategoryIcon value={category?.icon} />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h1 className="font-gaming text-2xl font-bold text-white mb-1 flex items-center gap-2">
              <CategoryIcon value={category?.icon} className="text-neon-pink text-xl" />
              {category?.name}
            </h1>

            {category?.description && (
              <p className="text-white/40 text-sm line-clamp-2">
                {category.description}
              </p>
            )}
          </div>

          <div className="text-right flex-shrink-0 hidden sm:block">
            <div className="text-white/30 text-xs mb-0.5">Đang có</div>
            <div className="font-gaming text-xl font-bold text-neon-pink">
              {pagination.total ?? 0} acc
            </div>
          </div>
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 items-start">
          {/* Left sidebar */}
          <aside className="gaming-card p-5 border-neon lg:sticky lg:top-24">
            <div className="flex items-center justify-between mb-5">
              <div className="font-gaming text-white font-bold flex items-center gap-2">
                <FontAwesomeIcon icon={faFilter} className="text-neon-pink" />
                Bộ lọc
              </div>

              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-neon-pink text-black text-xs font-bold flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </div>

            {/* Search inside filter form */}
            <form onSubmit={handleSearch} className="mb-5">
              <label className="text-xs text-white/40 uppercase tracking-wider block mb-2">
                Tìm kiếm
              </label>

              <div className="relative mb-3">
                <FontAwesomeIcon
                  icon={faSearch}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 text-sm"
                />

                <input
                  type="text"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  placeholder="Tên, code, rank..."
                  className="input-gaming w-full pl-9 pr-9 text-sm"
                />

                {searchInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput('')
                      updateParam('search', '')
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
                  >
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                )}
              </div>

              <button type="submit" className="btn-primary w-full py-2.5 text-sm">
                Tìm kiếm
              </button>
            </form>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider block mb-2">
                  Sắp xếp
                </label>

                <select
                  value={params.sort}
                  onChange={e => updateParam('sort', e.target.value)}
                  className="input-gaming w-full text-sm py-2"
                >
                  {sortOptions.map(o => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider block mb-2">
                  Rank
                </label>

                <select
                  value={params.rank}
                  onChange={e => updateParam('rank', e.target.value)}
                  className="input-gaming w-full text-sm py-2"
                >
                  <option value="">Tất cả</option>
                  {filters.ranks.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider block mb-2">
                  Server
                </label>

                <select
                  value={params.server}
                  onChange={e => updateParam('server', e.target.value)}
                  className="input-gaming w-full text-sm py-2"
                >
                  <option value="">Tất cả</option>
                  {filters.servers.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider block mb-2">
                  Thông tin acc
                </label>

                <div className="flex flex-wrap gap-2 mb-3">
                  {[
                    ['hasEmail', 'Mail', faEnvelope],
                    ['hasPhone', 'SĐT', faPhone],
                  ].map(([key, label, icon]) => (
                    <button
                      type="button"
                      key={key}
                      disabled={params.blankInfo}
                      onClick={() => updateParam(key, !params[key])}
                      className={`px-3 py-1 rounded-full text-xs border transition-all flex items-center gap-1.5 ${
                        params.blankInfo
                          ? 'border-white/5 text-white/20 cursor-not-allowed opacity-40'
                          : params[key]
                          ? 'bg-neon-pink/20 border-neon-pink/50 text-neon-pink'
                          : 'border-white/10 text-white/50 hover:border-white/30'
                      }`}
                    >
                      <FontAwesomeIcon icon={icon} />
                      {label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const next = !params.blankInfo
                      updateParam('blankInfo', next)
                      if (next) {
                        updateParam('hasEmail', false)
                        updateParam('hasPhone', false)
                      }
                    }}
                    className={`px-3 py-1 rounded-full text-xs border transition-all flex items-center gap-1.5 ${
                      params.blankInfo
                        ? 'bg-green-500/20 border-green-500/50 text-green-400'
                        : 'border-white/10 text-white/50 hover:border-white/30'
                    }`}
                  >
                    <FontAwesomeIcon icon={faBan} />
                    Trắng thông tin
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    ['LIVE', 'FB sống', faLink],
                    ['RIP', 'FB RIP', faTriangleExclamation],
                    ['NONE', 'Không LK FB', faBan],
                  ].map(([value, label, icon]) => (
                    <button
                      type="button"
                      key={value}
                      onClick={() =>
                        updateParam(
                          'gameBindFacebook',
                          params.gameBindFacebook === value ? '' : value
                        )
                      }
                      className={`px-3 py-1 rounded-full text-xs border transition-all flex items-center gap-1.5 ${
                        params.gameBindFacebook === value
                          ? 'bg-neon-blue/20 border-neon-blue/50 text-neon-blue'
                          : 'border-white/10 text-white/50 hover:border-white/30'
                      }`}
                    >
                      <FontAwesomeIcon icon={icon} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider block mb-2">
                  Khoảng giá
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={params.minPrice}
                    onChange={e => updateParam('minPrice', e.target.value)}
                    placeholder="Từ"
                    className="input-gaming text-sm py-2"
                  />

                  <input
                    type="number"
                    value={params.maxPrice}
                    onChange={e => updateParam('maxPrice', e.target.value)}
                    placeholder="Đến"
                    className="input-gaming text-sm py-2"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider block mb-2">
                  Lọc nhanh giá
                </label>

                <div className="flex flex-wrap gap-2">
                  {[
                    ['< 100K', '', '100000'],
                    ['100K–300K', '100000', '300000'],
                    ['300K–500K', '300000', '500000'],
                    ['> 500K', '500000', ''],
                  ].map(([label, min, max]) => (
                    <button
                      type="button"
                      key={label}
                      onClick={() =>
                        setParams(p => ({
                          ...p,
                          minPrice: min,
                          maxPrice: max,
                          page: 1,
                        }))
                      }
                      className={`px-3 py-1 rounded-full text-xs border transition-all ${
                        params.minPrice === min && params.maxPrice === max
                          ? 'bg-neon-pink/20 border-neon-pink/50 text-neon-pink'
                          : 'border-white/10 text-white/50 hover:border-white/30'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider block mb-2">
                  Khoảng skin
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={params.minSkins}
                    onChange={e => updateParam('minSkins', e.target.value)}
                    placeholder="Từ"
                    className="input-gaming text-sm py-2"
                  />

                  <input
                    type="number"
                    value={params.maxSkins}
                    onChange={e => updateParam('maxSkins', e.target.value)}
                    placeholder="Đến"
                    className="input-gaming text-sm py-2"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider block mb-2">
                  Khoảng tướng
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={params.minChampions}
                    onChange={e => updateParam('minChampions', e.target.value)}
                    placeholder="Từ"
                    className="input-gaming text-sm py-2"
                  />

                  <input
                    type="number"
                    value={params.maxChampions}
                    onChange={e => updateParam('maxChampions', e.target.value)}
                    placeholder="Đến"
                    className="input-gaming text-sm py-2"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider block mb-2">
                  Tên skin
                </label>

                <input
                  type="text"
                  value={params.skinName}
                  onChange={e => updateParam('skinName', e.target.value)}
                  placeholder="VD: Nakroth"
                  className="input-gaming w-full text-sm py-2"
                />
              </div>

              {filters.popularSkins?.length > 0 && (
                <div>
                  <label className="text-xs text-white/40 uppercase tracking-wider block mb-2">
                    Skin phổ biến
                  </label>

                  <div className="flex flex-wrap gap-2">
                    {filters.popularSkins.slice(0, 3).map(s => (
                      <button
                        type="button"
                        key={s.skinName}
                        onClick={() =>
                          updateParam(
                            'skinName',
                            params.skinName === s.skinName ? '' : s.skinName
                          )
                        }
                        className={`px-3 py-1 rounded-full text-xs border transition-all ${
                          params.skinName === s.skinName
                            ? 'bg-neon-blue/20 border-neon-blue/50 text-neon-blue'
                            : 'border-white/10 text-white/50 hover:border-white/30'
                        }`}
                      >
                        {s.skinName}
                      </button>
                    ))}
                  </div>
                </div>
              )}





              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="w-full py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all text-sm flex items-center justify-center gap-2"
                >
                  <FontAwesomeIcon icon={faXmark} />
                  Xóa bộ lọc
                </button>
              )}
            </div>
          </aside>

          {/* Right content */}
          <main>
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div className="text-white/40 text-sm flex items-center gap-2">
                <FontAwesomeIcon icon={faLayerGroup} />
                {loading
                  ? 'Đang tải...'
                  : `${accounts.length} / ${pagination.total || 0} tài khoản`}
              </div>

              <div className="text-white/30 text-xs flex items-center gap-2">
                <FontAwesomeIcon icon={faSort} />
                {sortOptions.find(o => o.value === params.sort)?.label}
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array(9).fill(0).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : accounts.length === 0 ? (
              <EmptyState
                icon="🔍"
                title="Không tìm thấy tài khoản"
                description="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
                action={
                  <button
                    onClick={clearFilters}
                    className="btn-neon text-sm px-6 py-2.5"
                  >
                    Xóa Bộ Lọc
                  </button>
                }
              />
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={JSON.stringify(params)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
                >
                  {accounts.map((acc, i) => (
                    <motion.div
                      key={acc.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <AccountCard account={acc} />
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            )}

            <Pagination
              page={params.page}
              pages={pagination.pages}
              onPageChange={p => setParams(prev => ({ ...prev, page: p }))}
            />
          </main>
        </div>
      </div>
    </div>
  )
}