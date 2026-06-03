import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination, EffectFade, Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/effect-fade'
import 'swiper/css/navigation'
import api from '../api/axios'
import { useSiteSettings } from '../context/SiteSettingsContext'
import { SectionHeader } from '../components/common/UIComponents'
import { formatCurrency } from '../utils/helpers'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import {
  faShieldHalved,
  faBolt,
  faLock,
  faGamepad,
  faGift,
  faTicket,
  faCartShopping,
  faCoins,
  faStar,
  faUsers,
  faCircleCheck,
  faTrophy,
  faBoxOpen,
  faDice,
  faXmark,
  faCopy,
  faTag,
  faMoneyBillWave,
  faChevronRight,
  faArrowRight,
  faMedal,
  faAward,
  faCalendar,
  faEye,
  faNewspaper,
  faLayerGroup,
  faFire,
  faCrown,
  faGem,
  faFolderOpen,
  faKey,
  faRocket,
  faWandMagicSparkles,
} from '@fortawesome/free-solid-svg-icons'

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
}

const stagger = {
  visible: {
    transition: { staggerChildren: 0.1 },
  },
}

const ICON_MAP = {
  gamepad: faGamepad,
  crown: faCrown,
  gem: faGem,
  fire: faFire,
  star: faStar,
  shield: faShieldHalved,
  coins: faCoins,
  box: faBoxOpen,
  folder: faFolderOpen,
  key: faKey,
  rocket: faRocket,
  wand: faWandMagicSparkles,
}

function CategoryIcon({ value, className = '' }) {
  return (
    <FontAwesomeIcon
      icon={ICON_MAP[value] || faGamepad}
      className={className}
    />
  )
}

function fillArray(arr, minCount = 12) {
  if (!arr.length) return []
  const result = []
  while (result.length < minCount) result.push(...arr)
  return result
}

function getYoutubeEmbedUrl(url = '') {
  if (!url) return ''

  const regExp =
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&?/]+)/

  const match = url.match(regExp)

  if (match?.[1]) {
    return `https://www.youtube.com/embed/${match[1]}`
  }

  return url
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-white/40 text-sm shrink-0">{label}</span>
      <span className="text-white text-sm font-medium text-right">{value}</span>
    </div>
  )
}

function CouponModal({ coupon, onClose }) {
  const isPercent = coupon.type === 'PERCENT'
  const valueText = isPercent ? `${coupon.value}%` : formatCurrency(coupon.value)
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(coupon.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.88, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.88, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="relative w-full max-w-sm"
        >
          <div className="gaming-card overflow-hidden border border-neon-pink/30 shadow-[0_0_60px_rgba(255,45,115,0.2)]">
            <div className="h-1.5 w-full bg-gradient-to-r from-neon-pink via-neon-purple to-neon-blue" />

            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/30 hover:text-white text-2xl leading-none transition-colors"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>

            <div className="p-7">
              <div className="text-center mb-6">
                <div className="text-5xl mb-3 text-neon-pink">
                  <FontAwesomeIcon icon={faGift} />
                </div>

                <div className="font-gaming text-xl font-black text-white mb-1">
                  Mã Giảm Giá
                </div>

                <div className="text-white/40 text-sm">
                  Sử dụng khi thanh toán
                </div>
              </div>

              <div
                onClick={copy}
                className="flex items-center justify-between gap-3 px-5 py-3.5 rounded-2xl mb-5 bg-neon-pink/10 border-2 border-dashed border-neon-pink/40 cursor-pointer hover:bg-neon-pink/15 transition-colors group"
              >
                <span className="font-gaming text-2xl font-black text-neon-pink tracking-widest">
                  {coupon.code}
                </span>

                <span
                  className={`text-xs font-display font-bold px-3 py-1.5 rounded-lg transition-all ${copied
                    ? 'bg-neon-green/20 text-neon-green border border-neon-green/40'
                    : 'bg-white/10 text-white/60 border border-white/10 group-hover:text-white'
                    }`}
                >
                  {copied ? (
                    <>
                      <FontAwesomeIcon icon={faCircleCheck} className="mr-1" />
                      Đã sao chép
                    </>
                  ) : (
                    <FontAwesomeIcon icon={faCopy} />
                  )}
                </span>
              </div>

              <div className="space-y-3">
                <InfoRow
                  label="Loại giảm"
                  value={
                    <span className="inline-flex items-center gap-1.5">
                      <FontAwesomeIcon icon={isPercent ? faTag : faMoneyBillWave} />
                      {isPercent ? 'Giảm theo %' : 'Giảm tiền mặt'}
                    </span>
                  }
                />

                <InfoRow
                  label="Giảm giá"
                  value={
                    <span className="text-neon-green font-bold text-lg">
                      Giảm {valueText}
                    </span>
                  }
                />

                {Number(coupon.minPurchase) > 0 && (
                  <InfoRow
                    label="Đơn tối thiểu"
                    value={formatCurrency(coupon.minPurchase)}
                  />
                )}

                {isPercent && coupon.maxDiscount && Number(coupon.maxDiscount) > 0 && (
                  <InfoRow
                    label="Giảm tối đa"
                    value={formatCurrency(coupon.maxDiscount)}
                  />
                )}

                {coupon.usageLimit > 0 && (
                  <InfoRow
                    label="Lượt dùng còn"
                    value={`${coupon.usageLimit - (coupon.usageCount || 0)} lượt`}
                  />
                )}

                <InfoRow label="Lượt/người" value={`${coupon.perUserLimit || 1} lượt`} />

                {coupon.startDate && (
                  <InfoRow
                    label="Ngày bắt đầu"
                    value={new Date(coupon.startDate).toLocaleDateString('vi-VN')}
                  />
                )}

                {coupon.endDate && (
                  <InfoRow
                    label="Ngày hết hạn"
                    value={new Date(coupon.endDate).toLocaleDateString('vi-VN')}
                  />
                )}

                {coupon.description && (
                  <div className="pt-2 mt-2 border-t border-white/5 text-white/40 text-xs leading-relaxed">
                    {coupon.description}
                  </div>
                )}
              </div>
            </div>

            <div className="px-7 pb-7">
              <Link
                to="/shop"
                onClick={onClose}
                className="btn-primary w-full py-3 text-sm text-center block"
              >
                <FontAwesomeIcon icon={faCartShopping} className="mr-2" />
                Dùng ngay khi mua acc
              </Link>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function CouponPill({ coupon, onClick }) {
  const isPercent = coupon.type === 'PERCENT'
  const valueText = isPercent
    ? `Giảm ${coupon.value}%`
    : `Giảm ${formatCurrency(coupon.value)}`

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-5 py-2.5 rounded-2xl shrink-0 border border-white/10 bg-dark-800/70 backdrop-blur-sm hover:border-neon-pink/50 hover:bg-dark-700/80 hover:shadow-[0_0_20px_rgba(255,45,115,0.15)] transition-all duration-200 cursor-pointer group"
    >
      <FontAwesomeIcon icon={faTicket} className="text-neon-pink text-sm" />

      <span className="font-gaming text-xs font-bold tracking-widest px-2 py-1 rounded-lg bg-neon-pink/15 border border-neon-pink/25 text-neon-pink group-hover:bg-neon-pink/25 transition-colors">
        {coupon.code}
      </span>

      <span className="h-3.5 w-px bg-white/15" />

      <span className="text-white/80 font-display text-sm whitespace-nowrap group-hover:text-white transition-colors">
        {valueText}
      </span>

      <FontAwesomeIcon
        icon={faChevronRight}
        className="text-white/20 text-xs group-hover:text-neon-pink/60 transition-colors"
      />
    </button>
  )
}

function CouponMarquee({ coupons, onPillClick }) {
  const filled = fillArray(coupons, 12)

  return (
    <>
      <style>{`
        @keyframes marquee-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-track {
          display: flex;
          width: max-content;
          animation: marquee-scroll 25s linear infinite;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute left-0 top-0 h-full w-20 z-10 bg-gradient-to-r from-dark-900 to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 h-full w-20 z-10 bg-gradient-to-l from-dark-900 to-transparent" />

        <div className="marquee-track gap-3 py-1">
          {filled.map((coupon, i) => (
            <div key={`a-${i}`} className="mr-3">
              <CouponPill coupon={coupon} onClick={() => onPillClick(coupon)} />
            </div>
          ))}

          {filled.map((coupon, i) => (
            <div key={`b-${i}`} className="mr-3">
              <CouponPill coupon={coupon} onClick={() => onPillClick(coupon)} />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function ActivityTicker({ items = [] }) {
  if (!items.length) return null

  const filled = fillArray(items, 16)

  const ACTION_CONFIG = {
    PURCHASE: { text: 'vừa mua acc', icon: faCartShopping, color: 'text-neon-pink' },
    SPIN: { text: 'vừa quay vòng quay', icon: faDice, color: 'text-yellow-400' },
    MYSTERY_BOX: { text: 'vừa mở túi mù', icon: faBoxOpen, color: 'text-purple-400' },
    TOPUP_PURCHASE: { text: 'vừa nạp Quân Huy', icon: faCoins, color: 'text-yellow-300' },
  }

  return (
    <>
      <style>{`
        @keyframes activity-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .activity-track {
          display: flex;
          width: max-content;
          animation: activity-scroll 40s linear infinite;
        }
      `}</style>

      <div className="relative overflow-hidden py-1.5">
        <div className="pointer-events-none absolute left-0 top-0 h-full w-16 z-10 bg-gradient-to-r from-dark-900 to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 h-full w-16 z-10 bg-gradient-to-l from-dark-900 to-transparent" />

        <div className="activity-track gap-0">
          {[...filled, ...filled].map((item, i) => {
            const cfg = ACTION_CONFIG[item.type] || ACTION_CONFIG.PURCHASE
            const maskedName = item.username
              ? item.username.length > 3
                ? item.username.slice(0, 3) + '***'
                : item.username.slice(0, 1) + '***'
              : 'Người dùng***'

            return (
              <span
                key={i}
                className="flex items-center gap-1.5 px-4 text-xs text-white/50 whitespace-nowrap shrink-0"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-neon-green/70 animate-pulse shrink-0" />
                <span className="text-white/70 font-medium">{maskedName}</span>
                <span className={`flex items-center gap-1 font-display font-bold ${cfg.color}`}>
                  <FontAwesomeIcon icon={cfg.icon} className="text-[10px]" />
                  {cfg.text}
                </span>
                {item.detail && (
                  <span className="text-white/35 italic truncate max-w-[120px]">
                    "{item.detail}"
                  </span>
                )}
                <span className="text-white/20 ml-2">·</span>
              </span>
            )
          })}
        </div>
      </div>
    </>
  )
}

function CategoryCard({ category, index }) {
  return (
    <motion.div
      key={category.id}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -8, scale: 1.01 }}
    >
      <Link to={`/shop/${category.slug}`} className="gaming-card block overflow-hidden group h-full">
        <div className="relative h-44 bg-dark-800">
          {category.imageUrl ? (
            <img
              src={category.imageUrl}
              alt={category.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neon-pink text-5xl">
              <CategoryIcon value={category.icon} />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-dark-900/90 via-transparent to-transparent" />

          <div className="absolute top-3 right-3">
            <div className="px-2 py-1 rounded-lg bg-black/60 border border-white/10 text-white/70 text-xs flex items-center gap-1.5">
              <FontAwesomeIcon icon={faLayerGroup} />
              {category.availableCount ?? category._count?.accounts ?? 0} acc
            </div>
          </div>

          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="font-gaming text-white font-bold text-lg flex items-center gap-2">
              <CategoryIcon value={category.icon} className="text-neon-pink" />
              {category.name}
            </h3>
          </div>
        </div>

        <div className="p-4">
          <p className="text-white/45 text-sm line-clamp-2 min-h-[40px]">
            {category.description || 'Xem danh sách tài khoản trong danh mục này'}
          </p>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
            <div className="text-white/30 text-xs">
              {category.minPrice ? (
                <>
                  Giá từ{' '}
                  <span className="text-neon-pink font-bold">
                    {formatCurrency(category.minPrice)}
                  </span>
                </>
              ) : (
                'Xem chi tiết'
              )}
            </div>

            <span className="text-neon-pink text-sm font-bold">
              Xem <FontAwesomeIcon icon={faArrowRight} className="ml-1" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

function MysteryBoxCard({ box, index }) {
  const rarityColors = {
    COMMON: '#9ca3af',
    RARE: '#3b82f6',
    EPIC: '#a855f7',
    LEGENDARY: '#f59e0b',
    MYTHIC: '#ec4899',
  }
  const topReward = box.rewards?.sort((a, b) => parseFloat(b.probability) - parseFloat(a.probability))?.[0]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08 }}
      whileHover={{ y: -6, scale: 1.01 }}
    >
      <Link to={`/mystery-box/${box.slug}`} className="gaming-card block overflow-hidden group h-full border border-purple-500/20 hover:border-purple-500/40 transition-colors">
        {/* Image */}
        <div className="relative h-44 bg-gradient-to-br from-dark-800 to-dark-900 overflow-hidden">
          {box.imageUrl ? (
            <img
              src={box.imageUrl}
              alt={box.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-90"
              onError={e => { e.target.style.display = 'none' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl text-purple-400/40">
              <FontAwesomeIcon icon={faBoxOpen} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-dark-900/90 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-pink-600/5 group-hover:from-purple-600/15 group-hover:to-pink-600/15 transition-all duration-500" />

          {/* Open count badge */}
          <div className="absolute top-3 right-3">
            <div className="px-2 py-1 rounded-lg bg-black/70 border border-purple-500/30 text-purple-300 text-xs flex items-center gap-1.5 font-mono">
              <FontAwesomeIcon icon={faBoxOpen} className="text-[10px]" />
              {(box.openCount || 0).toLocaleString()} lần mở
            </div>
          </div>

          {/* Rank badge */}
          {index === 0 && (
            <div className="absolute top-3 left-3">
              <div className="px-2 py-1 rounded-lg bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 text-xs flex items-center gap-1 font-bold">
                <FontAwesomeIcon icon={faFire} />
                Hot
              </div>
            </div>
          )}

          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="font-gaming text-white font-bold text-base flex items-center gap-2">
              <FontAwesomeIcon icon={faBoxOpen} className="text-purple-400 text-sm" />
              {box.name}
            </h3>
          </div>
        </div>

        <div className="p-4">
          <p className="text-white/45 text-xs mb-3 line-clamp-2 min-h-[32px]">
            {box.description ? (
  <div
    className="text-white/45 text-xs mb-3 line-clamp-2 min-h-[32px] [&_*]:text-inherit [&_*]:text-xs [&_p]:m-0 [&_strong]:font-bold [&_em]:italic [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4"
    dangerouslySetInnerHTML={{ __html: box.description }}
  />
) : (
  <p className="text-white/45 text-xs mb-3 line-clamp-2 min-h-[32px]">
    Mở hộp để nhận phần thưởng bí ẩn siêu giá trị!
  </p>
)}
          </p>

          {/* Reward previews or rarity badge */}
          {box.rewards?.length > 0 ? (
            <div className="flex flex-wrap gap-1 mb-3">
              {box.rewards.sort((a, b) => parseFloat(b.probability) - parseFloat(a.probability)).slice(0, 3).map(r => (
                <span
                  key={r.id}
                  className="text-[10px] px-1.5 py-0.5 rounded"
                  style={{ color: rarityColors[r.rarity] || '#9ca3af', background: `${rarityColors[r.rarity] || '#9ca3af'}18`, border: `1px solid ${rarityColors[r.rarity] || '#9ca3af'}30` }}
                >
                  {r.name}
                </span>
              ))}
            </div>
          ) : box.rarity ? (
            <div className="flex flex-wrap gap-1 mb-3">
              <span
                className="text-[10px] px-1.5 py-0.5 rounded"
                style={{ color: rarityColors[box.rarity] || '#9ca3af', background: `${rarityColors[box.rarity] || '#9ca3af'}18`, border: `1px solid ${rarityColors[box.rarity] || '#9ca3af'}30` }}
              >
                {box.rarity === 'COMMON' ? 'Thường' : box.rarity === 'RARE' ? 'Hiếm' : box.rarity === 'EPIC' ? 'Sử thi' : box.rarity === 'LEGENDARY' ? 'Huyền thoại' : 'Thần thoại'}
              </span>
            </div>
          ) : null}

          <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
            <div>
              <div className="text-white/30 text-xs">Giá mở hộp</div>
              <div className="font-gaming text-lg font-bold text-neon-pink">
                {formatCurrency(box.price)}
              </div>
            </div>
            <span className="text-purple-400 text-sm font-bold group-hover:text-purple-300 transition-colors">
              Mở Ngay <FontAwesomeIcon icon={faArrowRight} className="ml-1" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

function HeroRankingCard({ topUsers = [] }) {
  // Luôn hiển thị card, ngay cả khi chưa có data ranking
  return (
    <motion.div
      initial={{ opacity: 0, x: 35 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, delay: 0.12 }}
      className="w-full"
    >
      <div className="relative overflow-hidden rounded-3xl border border-yellow-400/20 bg-dark-800/70 backdrop-blur-xl p-4 shadow-[0_0_40px_rgba(250,204,21,0.08)]">
        <div className="absolute -top-20 -right-16 w-40 h-40 rounded-full bg-yellow-400/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-16 w-40 h-40 rounded-full bg-neon-pink/10 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-yellow-400/15 border border-yellow-400/20 flex items-center justify-center text-yellow-400">
                <FontAwesomeIcon icon={faTrophy} />
              </div>

              <div>
                <h3 className="font-gaming text-white font-bold text-sm">
                  BXH NẠP THÁNG
                </h3>
                <p className="text-white/35 text-xs">Top người nạp nhiều nhất</p>
              </div>
            </div>

            <Link to="/ranking" className="text-[11px] text-white/35 hover:text-yellow-400 transition">
              Xem tất cả
            </Link>
          </div>

          <div className="space-y-2">
            {topUsers.length > 0 ? topUsers.slice(0, 5).map((entry, i) => {
              const colors = [
                'bg-yellow-400/20 text-yellow-400 border-yellow-400/30',
                'bg-slate-300/20 text-slate-200 border-slate-300/20',
                'bg-orange-400/20 text-orange-400 border-orange-400/25',
                'bg-white/10 text-white/50 border-white/10',
                'bg-white/10 text-white/50 border-white/10',
              ]

              return (
                <Link
                  key={entry.id || i}
                  to="/ranking"
                  className="flex items-center gap-3 p-2 rounded-2xl bg-white/[0.035] hover:bg-white/[0.07] border border-white/[0.04] transition group"
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-gaming font-black border ${colors[i]}`}
                  >
                    {i + 1}
                  </div>

                  {/* <img
                    src={
                      entry.user?.avatar ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.user?.username}`
                    }
                    alt=""
                    className="w-9 h-9 rounded-full border border-white/10"
                  /> */}

                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-bold truncate group-hover:text-yellow-400 transition">
                      {entry.user?.displayName || entry.user?.username || '???'}
                    </p>
                    <p className="text-white/30 text-[10px]">
                      Top {i + 1} tháng này
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-yellow-400 text-xs font-gaming font-bold whitespace-nowrap">
                      {formatCurrency(entry.totalDeposit || 0)}
                    </p>
                  </div>
                </Link>
              )
            }) : (
              // Placeholder khi chưa có data ranking tháng này
              Array.from({ length: 5 }).map((_, i) => {
                const colors = [
                  'bg-yellow-400/20 text-yellow-400 border-yellow-400/30',
                  'bg-slate-300/20 text-slate-200 border-slate-300/20',
                  'bg-orange-400/20 text-orange-400 border-orange-400/25',
                  'bg-white/10 text-white/50 border-white/10',
                  'bg-white/10 text-white/50 border-white/10',
                ]
                return (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-gaming font-black border ${colors[i]}`}>
                      {i + 1}
                    </div>
                    <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/20 text-xs">
                      <FontAwesomeIcon icon={faUsers} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="h-2.5 w-24 bg-white/10 rounded-full mb-1.5" />
                      <div className="h-2 w-16 bg-white/5 rounded-full" />
                    </div>
                    <div className="h-2.5 w-16 bg-white/10 rounded-full" />
                  </div>
                )
              })
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 text-center text-white/25 text-[11px]">
            BXH được cập nhật tự động
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function HeroSlide({ banner }) {
  return (
    <SwiperSlide key={banner.id}>
      <div className="relative h-full bg-dark-900 overflow-hidden">
        {/* Background blur */}
        <img
          src={banner.imageUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-35 blur-md scale-110"
        />

        {/* Main image */}
        <img
          src={banner.imageUrl}
          alt={banner.title}
          className="relative z-10 w-full h-full object-contain"
        />

        {/* Overlay */}
        <div className="absolute inset-0 z-20 bg-gradient-to-r from-dark-900/90 via-dark-900/45 to-transparent" />
        <div className="absolute inset-0 z-20 bg-gradient-to-t from-dark-900/85 via-transparent to-transparent" />

        {/* Content */}
        <div className="absolute inset-0 z-30 flex items-center">
          <div className="pl-20 sm:pl-24 lg:pl-28 pr-6 max-w-md">
            <div className="text-neon-pink text-xs font-display font-bold uppercase tracking-[0.25em] mb-3 flex items-center gap-2">
              <span className="w-8 h-0.5 bg-neon-pink" />
              LQ SHOP
            </div>

            <h1 className="font-gaming text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight mb-3">
              {banner.title}
            </h1>

            {banner.subtitle && (
              <p className="text-white/70 text-sm md:text-base mb-5 font-body line-clamp-2">
                {banner.subtitle}
              </p>
            )}

            {banner.linkUrl && (
              <Link
                to={banner.linkUrl}
                className="btn-primary text-sm px-6 py-2.5 inline-flex items-center gap-2"
              >
                {banner.linkText || 'Khám Phá Ngay'}
                <FontAwesomeIcon icon={faArrowRight} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </SwiperSlide>
  )
}

function FallbackHero({ siteSettings }) {
  return (
    <div className="relative h-[520px] lg:h-[620px] flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-pink/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-purple/5 rounded-full blur-[100px]" />
      </div>

      <div className="page-container relative z-10">
        <motion.div initial="hidden" animate="visible" variants={stagger} className="max-w-2xl">
          <motion.div
            variants={fadeInUp}
            className="text-neon-pink text-sm font-display font-bold uppercase tracking-[0.3em] mb-4 flex items-center gap-2"
          >
            <span className="w-8 h-0.5 bg-neon-pink" />
            LIÊN QUÂN MOBILE SHOP
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="font-gaming text-5xl md:text-6xl lg:text-7xl font-black text-white leading-tight mb-6"
          >
            {siteSettings.hero_title ? (
              <span dangerouslySetInnerHTML={{ __html: siteSettings.hero_title }} />
            ) : (
              <>
                MUA BÁN ACC
                <br />
                <span className="text-gradient">UY TÍN #1</span>
                <br />
                VIỆT NAM
              </>
            )}
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="text-white/60 text-lg mb-8 font-body max-w-lg"
          >
            {siteSettings.hero_subtitle ||
              'Hàng ngàn tài khoản chất lượng cao, giá tốt nhất thị trường. Giao hàng tức thì, bảo hành 7 ngày.'}
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-wrap gap-4">
            <Link to="/shop" className="btn-primary text-sm px-8 py-3.5 inline-flex items-center gap-2">
              <FontAwesomeIcon icon={faGamepad} />
              Xem Danh Mục Acc
            </Link>

            {siteSettings.show_wheel_section !== 'false' && (
              <Link to="/lucky-wheel" className="btn-neon text-sm px-8 py-3.5 inline-flex items-center gap-2">
                <FontAwesomeIcon icon={faDice} />
                Vòng Quay May Mắn
              </Link>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default function HomePage() {
  const { settings: siteSettings } = useSiteSettings()
  const [banners, setBanners] = useState([])
  const [categories, setCategories] = useState([])
  const [recentWinners, setRecentWinners] = useState([])
  const [loading, setLoading] = useState(true)
  const [coupons, setCoupons] = useState([])
  const [selectedCoupon, setSelectedCoupon] = useState(null)
  const [topUsers, setTopUsers] = useState([])
  const [latestNews, setLatestNews] = useState([])
  const [recentActivities, setRecentActivities] = useState([])
  const [topMysteryBoxes, setTopMysteryBoxes] = useState([])
  const [wheelRewards, setWheelRewards] = useState([])

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [
          bannersRes,
          categoriesRes,
          winnersRes,
          couponsRes,
          rankingRes,
          newsRes,
          mysteryBoxRes,
          wheelRes,
        ] = await Promise.allSettled([
          api.get('/banners'),
          api.get('/categories'),
          api.get('/wheel/winners'),
          api.get('/coupons/public'),
          api.get('/ranking?period=monthly&limit=5'),
          api.get('/news?limit=4'),
          api.get('/mystery-box'),
          api.get('/wheel'),
        ])

        if (bannersRes.status === 'fulfilled') setBanners(bannersRes.value.data.data || [])
        if (categoriesRes.status === 'fulfilled') setCategories(categoriesRes.value.data.data || [])
        if (winnersRes.status === 'fulfilled') setRecentWinners(winnersRes.value.data.data || [])
        if (couponsRes.status === 'fulfilled') setCoupons(couponsRes.value.data.data || [])
        if (rankingRes.status === 'fulfilled') setTopUsers(rankingRes.value.data.data || [])
        if (newsRes.status === 'fulfilled') setLatestNews(newsRes.value.data.data || [])
        if (mysteryBoxRes.status === 'fulfilled') {
          const allBoxes = mysteryBoxRes.value.data.data || []
          const sorted = [...allBoxes].sort((a, b) => (b.openCount || 0) - (a.openCount || 0))
          setTopMysteryBoxes(sorted.slice(0, 4))
        }
        if (wheelRes.status === 'fulfilled') {
          setWheelRewards(wheelRes.value.data.data?.rewards || [])
        }

        // Tạo activity feed từ wheel winners (dữ liệu thực có sẵn)
        // Kết hợp thêm activity type mua acc dựa trên ranking nếu có
        const winners = winnersRes.status === 'fulfilled' ? (winnersRes.value.data.data || []) : []
        const rankUsers = rankingRes.status === 'fulfilled' ? (rankingRes.value.data.data || []) : []

        const activities = []

        winners.slice(0, 8).forEach(w => {
          activities.push({
            username: w.user?.username || w.username,
            type: 'SPIN',
            detail: w.prize?.name || w.prizeName,
          })
        })

        rankUsers.slice(0, 5).forEach(r => {
          activities.push({
            username: r.user?.username,
            type: 'PURCHASE',
            detail: null,
          })
        })

        // Nếu chưa đủ 8, thêm activity giả dựa trên tên game phổ biến
        if (activities.length < 6) {
          const fakeNames = ['Minh***', 'Hoa***', 'Long***', 'Ngoc***', 'Tuan***', 'Linh***']
          const fakeTypes = ['PURCHASE', 'MYSTERY_BOX', 'SPIN', 'TOPUP_PURCHASE']
          fakeNames.forEach((name, i) => {
            activities.push({
              username: name,
              type: fakeTypes[i % fakeTypes.length],
              detail: null,
              isMock: true,
            })
          })
        }

        setRecentActivities(activities)
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
  }, [])

  const totalAvailable = categories.reduce(
    (sum, c) => sum + Number(c.availableCount ?? c._count?.accounts ?? 0),
    0
  )

  const features = [
    {
      icon: faShieldHalved,
      title: 'Bảo Hành 1 Tháng',
      desc: 'Cam kết bảo hành tài khoản trong 30 ngày sau khi mua',
    },
    {
      icon: faBolt,
      title: 'Hỗ trợ 24/7',
      desc: 'Hỗ trợ khách hàng mọi lúc, mọi nơi',
    },
    {
      icon: faLock,
      title: 'Bảo Mật Tuyệt Đối',
      desc: 'Thông tin giao dịch được mã hóa SSL 256-bit',
    },
    {
      icon: faGamepad,
      title: 'Hàng Ngàn Tài Khoản',
      desc: 'Kho acc đa dạng từ Đồng đến Chinh Phục',
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero / Banner */}
      {/* Hero / Banner */}
      <section className="relative pt-24 lg:pt-28">
        <div className="page-container">
          {banners.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 items-stretch">
              <div className="min-w-0">
                <Swiper
                  modules={[Autoplay, Pagination, EffectFade, Navigation]}
                  effect="fade"
                  autoplay={{ delay: 5000, disableOnInteraction: false }}
                  pagination={{ clickable: true }}
                  navigation
                  loop
                  className="homepage-hero-swiper w-full h-[340px] lg:h-[430px] rounded-3xl overflow-hidden border border-white/10 bg-dark-800 shadow-[0_0_50px_rgba(255,45,115,0.12)]"
                >
                  {banners.map((banner) => (
                    <SwiperSlide key={banner.id}>
                      <div className="relative h-full bg-dark-900 overflow-hidden">
                        {/* Background blur layer */}
                        {banner.mediaType === 'video' ? (
                          <video
                            src={banner.imageUrl}
                            className="absolute inset-0 w-full h-full object-cover opacity-40 blur-md scale-110"
                            muted
                            loop
                            autoPlay
                            playsInline
                          />
                        ) : (
                          <img
                            src={banner.imageUrl}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover opacity-40 blur-md scale-110"
                          />
                        )}

                        {/* Main media */}
                        {banner.mediaType === 'video' ? (
                          <video
                            src={banner.imageUrl}
                            className="relative z-10 w-full h-full object-contain"
                            muted
                            loop
                            autoPlay
                            playsInline
                          />
                        ) : (
                          <img
                            src={banner.imageUrl}
                            alt={banner.title}
                            className="relative z-10 w-full h-full object-contain"
                          />
                        )}

                        <div className="absolute inset-0 z-20 bg-gradient-to-r from-dark-900/95 via-dark-900/45 to-transparent" />
                        <div className="absolute inset-0 z-20 bg-gradient-to-t from-dark-900/85 via-transparent to-transparent" />

                        <div className="absolute inset-0 z-30 flex items-center">
                          <div className="pl-20 sm:pl-24 lg:pl-28 pr-6 max-w-md">
                            <div className="text-neon-pink text-xs font-display font-bold uppercase tracking-[0.25em] mb-3 flex items-center gap-2">
                              <span className="w-8 h-0.5 bg-neon-pink" />
                              LQ SHOP EXCLUSIVE
                            </div>

                            <h1 className="font-gaming text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight mb-3">
                              {banner.title}
                            </h1>

                            {banner.subtitle && (
                              <p className="text-white/70 text-sm md:text-base mb-5 font-body line-clamp-2">
                                {banner.subtitle}
                              </p>
                            )}

                            {banner.linkUrl && (
                              <Link
                                to={banner.linkUrl}
                                className="btn-primary text-sm px-6 py-2.5 inline-flex items-center gap-2"
                              >
                                {banner.linkText || 'Khám Phá Ngay'}
                                <FontAwesomeIcon icon={faArrowRight} />
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>

              <div className="hidden lg:block w-[360px] shrink-0">
                <HeroRankingCard topUsers={topUsers} />
              </div>
            </div>
          ) : (
            <FallbackHero siteSettings={siteSettings} />
          )}
        </div>
      </section>

      {/* Coupon Marquee */}
      {coupons.length > 0 && (
        <section className="relative z-10 py-4">
          <div className="page-container mb-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-display font-bold uppercase tracking-widest text-neon-pink/70 whitespace-nowrap">
                Mã giảm giá
              </span>
              <span className="flex-1 h-px bg-gradient-to-r from-neon-pink/30 to-transparent" />
              <span className="text-white/25 text-xs whitespace-nowrap">Bấm để xem chi tiết</span>
            </div>
          </div>

          <CouponMarquee coupons={coupons} onPillClick={setSelectedCoupon} />

          <div className="page-container mt-3">
            <span className="block h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
          </div>
        </section>
      )}

      {/* Activity Ticker — hoạt động gần đây */}
      {recentActivities.length > 0 && (
        <section className="relative z-10 py-2 bg-dark-900/50 border-y border-white/[0.04]">
          <div className="flex items-center gap-3 pl-4 pr-0 overflow-hidden">
            <span className="text-[10px] font-display font-bold uppercase tracking-widest text-neon-green/60 whitespace-nowrap shrink-0 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
              Trực tiếp
            </span>
            <div className="flex-1 overflow-hidden">
              <ActivityTicker items={recentActivities} />
            </div>
          </div>
        </section>
      )}

      {selectedCoupon && (
        <CouponModal coupon={selectedCoupon} onClose={() => setSelectedCoupon(null)} />
      )}

      {/* Stats */}
      <section className="relative z-10">
        <div className="page-container py-6">
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3"
          >
            {[
              { label: 'Danh Mục', value: categories.length || '10+', icon: faLayerGroup },
              { label: 'Acc Có Sẵn', value: totalAvailable || '1000+', icon: faGamepad },
              { label: 'Khách Hàng', value: '10K+', icon: faUsers },
              { label: 'Uy Tín', value: '5 Sao', icon: faStar },
            ].map((stat, i) => (
              <div key={i} className="gaming-card p-4 text-center border-neon">
                <div className="text-2xl mb-1 text-neon-pink">
                  <FontAwesomeIcon icon={stat.icon} />
                </div>
                <div className="font-gaming text-xl font-bold text-gradient">{stat.value}</div>
                <div className="text-white/40 text-xs font-body">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="page-container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {features.map((f, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                whileHover={{ y: -6 }}
                className="gaming-card p-6 text-center group cursor-default"
              >
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300 text-neon-pink">
                  <FontAwesomeIcon icon={f.icon} />
                </div>
                <h3 className="font-display font-bold text-white mb-2 text-lg">
                  {f.title}
                </h3>
                <p className="text-white/50 text-sm leading-relaxed">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Account Categories */}
      {categories.length > 0 && (
        <section className="py-10 pb-20">
          <div className="page-container">
            <SectionHeader
              title="Danh Mục Tài Khoản"
              subtitle="Chọn loại acc bạn muốn xem trước khi mua"
            />

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
            >
              {categories.slice(0, 8).map((cat, i) => (
                <CategoryCard key={cat.id} category={cat} index={i} />
              ))}
            </motion.div>

            <div className="text-center mt-10">
              <Link to="/shop" className="btn-neon px-10 py-3.5 text-sm">
                Xem Tất Cả Danh Mục
                <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Wheel + Mystery Box */}
      {(siteSettings.show_wheel_section !== 'false' ||
        siteSettings.show_mystery_box !== 'false') && (
          <section className="py-10">
            <div className="page-container space-y-10">

              {/* ── Túi Mù — hiển thị trước ── */}
              {siteSettings.show_mystery_box !== 'false' && (
                <div>
                  <SectionHeader
                    title={<><FontAwesomeIcon icon={faBoxOpen} className="mr-3 text-purple-400" />Túi Mù</>}
                    subtitle="Mở hộp để nhận vật phẩm siêu hiếm! Có thể là tài khoản Huyền Thoại."
                  />

                  {topMysteryBoxes.length > 0 ? (
                    <>
                      <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={stagger}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
                      >
                        {topMysteryBoxes.map((box, i) => (
                          <MysteryBoxCard key={box.id} box={box} index={i} />
                        ))}
                      </motion.div>
                      <div className="text-center mt-8">
                        <Link to="/mystery-box" className="btn-neon border-purple-500/50 text-purple-400 hover:bg-purple-500/10 px-10 py-3.5 text-sm inline-flex items-center gap-2">
                          <FontAwesomeIcon icon={faBoxOpen} />
                          Xem Tất Cả Túi Mù
                          <FontAwesomeIcon icon={faArrowRight} />
                        </Link>
                      </div>
                    </>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      className="relative gaming-card overflow-hidden p-8 group cursor-pointer"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent" />
                      <FontAwesomeIcon icon={faBoxOpen} className="absolute -right-10 -bottom-10 text-[120px] opacity-10 group-hover:opacity-20 transition-all duration-500 text-purple-400" />
                      <div className="relative z-10">
                        <div className="text-5xl mb-4 text-purple-400"><FontAwesomeIcon icon={faBoxOpen} /></div>
                        <h3 className="font-gaming text-2xl font-bold text-purple-400 mb-2">Túi Mù</h3>
                        <p className="text-white/60 text-sm mb-6">Mở hộp để nhận vật phẩm siêu hiếm! Có thể là tài khoản Huyền Thoại.</p>
                        <Link to="/mystery-box" className="btn-neon border-purple-500/50 text-purple-400 hover:bg-purple-500/10 text-sm px-6 py-2.5 inline-block">
                          Mở Hộp <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* ── Vòng Quay May Mắn — hiển thị sau, layout 2 cột ── */}
              {siteSettings.show_wheel_section !== 'false' && (() => {
                // Build segments từ wheelRewards thật, fallback nếu chưa load
                const FALLBACK_COLORS = ['#f59e0b', '#1e40af', '#7c3aed', '#065f46', '#dc2626', '#0369a1', '#059669', '#be185d']
                const segments = wheelRewards.length > 0
                  ? wheelRewards.map((r, i) => ({
                    color: r.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
                    label: r.name,
                    imageUrl: r.imageUrl || null,
                    rarity: r.rarity,
                  }))
                  : FALLBACK_COLORS.map((c, i) => ({ color: c, label: '...', imageUrl: null, rarity: null }))

                const n = segments.length
                const sliceDeg = 360 / n
                const R = 118
                const CX = 130, CY = 130

                // Lấy tối đa 5 rewards có imageUrl để làm floating chips
                const floatChips = segments
                  .filter(s => s.imageUrl)
                  .slice(0, 5)

                // Vị trí floating chip xung quanh vòng quay
                const chipPositions = [
                  { top: '6%', left: '4%', delay: 0 },
                  { top: '10%', right: '6%', delay: 0.7 },
                  { bottom: '16%', left: '2%', delay: 1.3 },
                  { bottom: '8%', right: '4%', delay: 1.0 },
                  { top: '44%', left: '-2%', delay: 0.4 },
                ]

                return (
                  <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="relative gaming-card overflow-visible group"
                    style={{ borderColor: 'rgba(234,179,8,0.25)', boxShadow: '0 0 60px rgba(234,179,8,0.06)' }}
                  >
                    {/* Backgrounds */}
                    <div className="absolute inset-0 bg-gradient-to-r from-dark-900 via-dark-800/80 to-dark-900/40" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,rgba(234,179,8,0.08),transparent_60%)]" />
                    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(234,179,8,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(234,179,8,0.5) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 min-h-[340px]">

                      {/* LEFT — text + danh sách phần thưởng thật */}
                      <div className="flex flex-col justify-center p-8 md:p-10">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="px-3 py-1 rounded-full text-xs font-bold font-display uppercase tracking-widest" style={{ background: 'rgba(234,179,8,0.15)', color: '#f59e0b', border: '1px solid rgba(234,179,8,0.3)' }}>
                            🎰 Mini Game
                          </span>
                        </div>

                        <h3 className="font-gaming text-4xl font-black leading-tight mb-3" style={{ color: '#fbbf24', textShadow: '0 0 40px rgba(234,179,8,0.5)' }}>
                          Vòng Quay<br /><span className="text-white">May Mắn</span>
                        </h3>

                        <p className="text-white/55 text-sm mb-5 leading-relaxed max-w-sm">
                          Thử vận may mỗi ngày! Quay để nhận phần thưởng giá trị.
                        </p>

                        {/* Prize list từ data thật */}
                        <div className="grid grid-cols-2 gap-1.5 mb-7 max-w-xs">
                          {(wheelRewards.length > 0 ? wheelRewards : []).slice(0, 6).map((r, i) => {
                            const col = r.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length]
                            return (
                              <div key={r.id || i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg" style={{ background: `${col}12`, border: `1px solid ${col}28` }}>
                                {r.imageUrl
                                  ? <img src={r.imageUrl} alt={r.name} className="w-5 h-5 rounded object-cover flex-shrink-0" onError={e => { e.target.style.display = 'none' }} />
                                  : <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: col, boxShadow: `0 0 5px ${col}` }} />
                                }
                                <span className="text-white/55 text-[11px] truncate flex-1">{r.name}</span>
                              </div>
                            )
                          })}
                          {wheelRewards.length === 0 && [1, 2, 3, 4].map(i => (
                            <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg animate-pulse bg-white/5 border border-white/5">
                              <div className="w-2 h-2 rounded-full bg-white/20 flex-shrink-0" />
                              <div className="h-2 bg-white/10 rounded flex-1" />
                            </div>
                          ))}
                        </div>

                        <Link
                          to="/lucky-wheel"
                          className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-gaming font-black text-sm text-black w-fit transition-all duration-300 hover:scale-105"
                          style={{ background: 'linear-gradient(135deg,#f59e0b 0%,#fcd34d 50%,#f59e0b 100%)', boxShadow: '0 6px 20px rgba(234,179,8,0.4)' }}
                        >
                          <FontAwesomeIcon icon={faDice} className="text-base" />
                          Quay Ngay!
                          <FontAwesomeIcon icon={faArrowRight} />
                        </Link>
                      </div>

                      {/* RIGHT — vòng quay + floating thumbnails */}
                      <div className="relative flex items-center justify-center py-10 md:py-0 overflow-visible min-h-[340px]">

                        {/* Floating thumbnail chips */}
                        {floatChips.map((chip, i) => {
                          const pos = chipPositions[i] || chipPositions[0]
                          return (
                            <motion.div
                              key={i}
                              className="absolute z-20 pointer-events-none"
                              style={{ top: pos.top, left: pos.left, right: pos.right, bottom: pos.bottom }}
                              animate={{ y: [-7, 7, -7] }}
                              transition={{ duration: 3.2 + i * 0.5, repeat: Infinity, ease: 'easeInOut', delay: pos.delay }}
                            >
                              <div className="flex items-center justify-center">
                                <img
                                  src={chip.imageUrl}
                                  alt={chip.label}
                                  className="w-14 h-14 object-contain"
                                  style={{
                                    filter: `
      drop-shadow(0 0 8px ${chip.color})
      drop-shadow(0 0 16px ${chip.color}80)
    `
                                  }}
                                />
                              </div>
                            </motion.div>
                          )
                        })}

                        {/* Pulse glow */}
                        <motion.div
                          className="absolute rounded-full pointer-events-none"
                          style={{ width: 290, height: 290, background: 'radial-gradient(circle,rgba(234,179,8,0.12) 0%,transparent 70%)' }}
                          animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
                          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        />

                        {/* Arrow pointer */}
                        <div className="absolute z-30" style={{ left: 'calc(50% - 153px)', top: '50%', transform: 'translateY(-50%)' }}>
                          <motion.div animate={{ x: [0, -4, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}>
                            <div className="w-0 h-0" style={{ borderTop: '13px solid transparent', borderBottom: '13px solid transparent', borderRight: '24px solid #f59e0b', filter: 'drop-shadow(0 0 8px rgba(234,179,8,1))' }} />
                          </motion.div>
                        </div>

                        {/* Spinning wheel SVG từ data thật */}
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
                          style={{ width: 260, height: 260, position: 'relative', zIndex: 10 }}
                        >
                          <svg viewBox="0 0 260 260" width="260" height="260">
                            <defs>
                              <radialGradient id="hubGrad2" cx="40%" cy="40%">
                                <stop offset="0%" stopColor="#fcd34d" />
                                <stop offset="100%" stopColor="#f59e0b" />
                              </radialGradient>
                              {segments.map((_, i) => (
                                <clipPath key={i} id={`seg-clip-${i}`}>
                                  <path d={(() => {
                                    const a1 = ((i * sliceDeg) - sliceDeg / 2) * Math.PI / 180
                                    const a2 = ((i * sliceDeg) + sliceDeg / 2) * Math.PI / 180
                                    return `M${CX},${CY} L${CX + R * Math.cos(a1)},${CY + R * Math.sin(a1)} A${R},${R} 0 0,1 ${CX + R * Math.cos(a2)},${CY + R * Math.sin(a2)} Z`
                                  })()} />
                                </clipPath>
                              ))}
                            </defs>

                            <circle cx={CX} cy={CY} r="128" fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="4" />
                            <circle cx={CX} cy={CY} r="125" fill="none" stroke="rgba(234,179,8,0.5)" strokeWidth="2.5" strokeDasharray="8 4" />

                            {segments.map((seg, i) => {
                              const midDeg = i * sliceDeg
                              const a1 = (midDeg - sliceDeg / 2) * Math.PI / 180
                              const a2 = (midDeg + sliceDeg / 2) * Math.PI / 180
                              const mid = midDeg * Math.PI / 180
                              const tx = CX + 75 * Math.cos(mid)
                              const ty = CY + 75 * Math.sin(mid)
                              const imgX = CX + 78 * Math.cos(mid)
                              const imgY = CY + 78 * Math.sin(mid)
                              const imgSize = 22
                              return (
                                <g key={i}>
                                  <path
                                    d={`M${CX},${CY} L${CX + R * Math.cos(a1)},${CY + R * Math.sin(a1)} A${R},${R} 0 0,1 ${CX + R * Math.cos(a2)},${CY + R * Math.sin(a2)} Z`}
                                    fill={seg.color}
                                    stroke="rgba(0,0,0,0.4)"
                                    strokeWidth="2"
                                  />
                                  {seg.imageUrl ? (
                                    <image
                                      href={seg.imageUrl}
                                      x={imgX - imgSize / 2}
                                      y={imgY - imgSize / 2}
                                      width={imgSize}
                                      height={imgSize}
                                      preserveAspectRatio="xMidYMid slice"
                                      clipPath={`url(#seg-clip-${i})`}
                                      style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.8))' }}
                                    />
                                  ) : (
                                    <text
                                      x={tx} y={ty}
                                      textAnchor="middle"
                                      dominantBaseline="middle"
                                      fill="white"
                                      fontSize={n > 8 ? '9' : '11'}
                                      fontWeight="900"
                                      transform={`rotate(${midDeg + 90}, ${tx}, ${ty})`}
                                      style={{ fontFamily: 'monospace' }}
                                    >{seg.label?.length > 6 ? seg.label.slice(0, 5) + '…' : seg.label}</text>
                                  )}
                                </g>
                              )
                            })}

                            {/* Dividers */}
                            {segments.map((_, i) => {
                              const a = (i * sliceDeg - sliceDeg / 2) * Math.PI / 180
                              return <line key={i} x1={CX} y1={CY} x2={CX + R * Math.cos(a)} y2={CY + R * Math.sin(a)} stroke="rgba(0,0,0,0.6)" strokeWidth="1.5" />
                            })}

                            {/* Center hub */}
                            <circle cx={CX} cy={CY} r="22" fill="#0f0f1a" stroke="rgba(234,179,8,0.9)" strokeWidth="3.5" />
                            <circle cx={CX} cy={CY} r="13" fill="url(#hubGrad2)" />
                            <circle cx={CX - 4} cy={CY - 4} r="4" fill="rgba(255,255,255,0.4)" />

                            {/* Outer dots */}
                            {segments.map((_, i) => {
                              const a = (i * sliceDeg) * Math.PI / 180
                              return <circle key={i} cx={CX + 121 * Math.cos(a)} cy={CY + 121 * Math.sin(a)} r="5" fill="#f59e0b" stroke="rgba(0,0,0,0.5)" strokeWidth="1.5" />
                            })}
                          </svg>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                )
              })()}

            </div>
          </section>
        )}

      {/* Recent Winners */}
      {recentWinners.length > 0 && siteSettings.show_wheel_section !== 'false' && (
        <section className="py-10 pb-20">
          <div className="page-container">
            <SectionHeader
              title="Người Thắng Gần Đây"
              subtitle="Những may mắn nhất từ vòng quay"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {recentWinners.slice(0, 5).map((w, i) => (
                <motion.div
                  key={w.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="gaming-card p-4 text-center"
                  style={{
                    borderColor: `${['#ffd700', '#c0c0c0', '#cd7f32', '#3498db', '#9b59b6'][i]}30`,
                  }}
                >
                  <img
                    src={
                      w.user?.avatar ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${w.user?.username}`
                    }
                    alt=""
                    className="w-12 h-12 rounded-full mx-auto mb-2 border-2 border-neon-pink/30"
                  />
                  <div className="font-display font-bold text-white text-sm truncate">
                    {w.user?.displayName || w.user?.username}
                  </div>
                  <div className="text-xs text-white/40 mt-0.5 mb-2">nhận được</div>
                  <div className="text-neon-yellow font-bold text-sm truncate">
                    {w.rewardName}
                  </div>
                  <div className="mt-2">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        color: '#fbbf24',
                        background: 'rgba(251,191,36,0.1)',
                      }}
                    >
                      {w.rarity}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Ranking Full Section
      {siteSettings.show_ranking !== 'false' && topUsers.length > 0 && (
        <section className="py-10 pb-4">
          <div className="page-container">
            <SectionHeader
              title="Bảng Xếp Hạng Tháng"
              subtitle="Top người nạp nhiều nhất tháng này"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
              {topUsers.slice(0, 5).map((entry, i) => {
                const rankIcons = [faTrophy, faMedal, faAward, faStar, faStar]
                const rankLabels = ['Top 1', 'Top 2', 'Top 3', 'Top 4', 'Top 5']
                const colors = [
                  'text-yellow-400',
                  'text-slate-300',
                  'text-orange-400',
                  'text-white/60',
                  'text-white/60',
                ]
                const borders = [
                  'border-yellow-400/30',
                  'border-slate-300/20',
                  'border-orange-400/20',
                  'border-white/10',
                  'border-white/10',
                ]

                return (
                  <motion.div
                    key={entry.id || i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className={`gaming-card p-4 text-center border ${borders[i]}`}
                  >
                    <div className={`text-3xl mb-2 ${colors[i]}`}>
                      <FontAwesomeIcon icon={rankIcons[i]} />
                    </div>

                    <div className="text-[11px] text-white/35 font-display uppercase tracking-wider mb-2">
                      {rankLabels[i]}
                    </div>

                    <img
                      src={
                        entry.user?.avatar ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.user?.username}`
                      }
                      alt=""
                      className="w-12 h-12 rounded-full mx-auto mb-2 border-2 border-white/10"
                    />

                    <div className="font-display font-bold text-white text-sm truncate">
                      {entry.user?.displayName || entry.user?.username || '???'}
                    </div>

                    <div className={`font-gaming font-bold text-sm mt-1 ${colors[i]}`}>
                      {formatCurrency(entry.totalDeposit || 0)}
                    </div>
                  </motion.div>
                )
              })}
            </div>

            <div className="text-center">
              <Link to="/ranking" className="btn-neon px-8 py-2.5 text-sm">
                <FontAwesomeIcon icon={faTrophy} className="mr-2" />
                Xem Bảng Xếp Hạng Đầy Đủ
                <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
              </Link>
            </div>
          </div>
        </section>
      )} */}

      {/* CTA */}
      <section className="py-20">
        <div className="page-container">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative gaming-card overflow-hidden p-12 text-center"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-neon-pink/10 via-neon-purple/10 to-neon-blue/10" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-neon-pink/20 blur-[60px] rounded-full" />

            <div className="relative z-10">
              <div className="font-gaming text-4xl md:text-5xl font-black text-gradient mb-4">
                NẠP TIỀN NGAY
              </div>

              <p className="text-white/60 text-lg mb-8 max-w-md mx-auto">
                Nạp tiền qua QR Banking tức thì. An toàn, nhanh chóng, không mất phí.
              </p>

              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  to="/deposit"
                  className="btn-primary px-10 py-4 text-base flex items-center gap-2 justify-center"
                >
                  <FontAwesomeIcon icon={faCoins} />
                  Nạp Tiền Ngay
                </Link>

                <Link
                  to="/shop"
                  className="btn-neon px-10 py-4 text-base flex items-center gap-2 justify-center"
                >
                  <FontAwesomeIcon icon={faCartShopping} />
                  Xem Danh Mục Acc
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Video Section */}
      {siteSettings.show_video_section !== 'false' && siteSettings.video_section_url && (
        <section className="py-10 pb-20">
          <div className="page-container">
            <SectionHeader
              title={siteSettings.video_section_title || 'Hướng Dẫn Sử Dụng'}
              subtitle="Xem video hướng dẫn để trải nghiệm dịch vụ tốt nhất"
            />

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_60px_rgba(255,45,115,0.1)] bg-dark-800"
            >
              <div className="aspect-video w-full">
                <iframe
                  src={getYoutubeEmbedUrl(siteSettings.video_section_url)}
                  title={siteSettings.video_section_title || 'Video hướng dẫn'}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  frameBorder="0"
                />
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Latest News */}
      {latestNews.length > 0 && (
        <section className="py-10 pb-20">
          <div className="page-container">
            <SectionHeader
              title="Tin Tức Mới Nhất"
              subtitle="Cập nhật khuyến mãi, sự kiện và thông báo mới nhất"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              {latestNews.slice(0, 4).map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="gaming-card overflow-hidden group"
                >
                  <Link to={`/news/${item.slug}`} className="block">
                    <div className="relative h-40 overflow-hidden">
                      <img
                        src={
                          item.thumbnailUrl ||
                          'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=500&h=300&fit=crop'
                        }
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 via-transparent to-transparent" />

                      <div className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-neon-pink/90 text-white text-[10px] font-bold uppercase flex items-center gap-1">
                        <FontAwesomeIcon icon={faNewspaper} />
                        Tin tức
                      </div>
                    </div>

                    <div className="p-4">
                      <h3 className="font-display font-bold text-white text-sm line-clamp-2 group-hover:text-neon-pink transition-colors mb-2">
                        {item.title}
                      </h3>

                      {item.summary && (
                        <p className="text-white/45 text-xs leading-relaxed line-clamp-2 mb-3">
                          {item.summary}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-white/30 text-xs">
                        <span className="flex items-center gap-1">
                          <FontAwesomeIcon icon={faCalendar} />
                          {new Date(item.publishedAt || item.createdAt).toLocaleDateString('vi-VN')}
                        </span>

                        <span className="flex items-center gap-1">
                          <FontAwesomeIcon icon={faEye} />
                          {item.viewCount || 0}
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-10">
              <Link to="/news" className="btn-neon px-10 py-3.5 text-sm">
                Xem Tất Cả Tin Tức
                <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}