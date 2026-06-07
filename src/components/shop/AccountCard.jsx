import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { formatCurrency, getRankColor } from '../../utils/helpers'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faFire,
  faUserCheck,
  faCrown,
  faUsers,
  faVest,
  faTrophy,
  faServer,
  faCartShopping,
  faCircleXmark,
  faShirt,
  faFolderOpen,
  faGamepad,
  faGem,
  faStar,
  faBullseye,
  faMoneyBillWave,
  faGift,
  faMoon,
  faShieldHalved,
  faDice,
  faCoins,
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
  faLock,
  faEnvelope,
  faPhone,
  faLink,
  faBan,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons'

const CATEGORY_ICON_MAP = {
  gamepad: faGamepad,
  crown: faCrown,
  gem: faGem,
  fire: faFire,
  star: faStar,
  trophy: faTrophy,
  target: faBullseye,
  money: faMoneyBillWave,
  gift: faGift,
  moon: faMoon,
  folder: faFolderOpen,
  shield: faShieldHalved,
  dice: faDice,
  coins: faCoins,
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
  lock: faLock,
}

function CategoryIcon({ value, className = '' }) {
  return (
    <FontAwesomeIcon
      icon={CATEGORY_ICON_MAP[value] || faFolderOpen}
      className={className}
    />
  )
}

function getBindFacebookInfo(status) {
  switch (status) {
    case 'LIVE':
      return {
        label: 'Liên kết sống',
        icon: faLink,
        className: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
      }

    case 'RIP':
      return {
        label: 'Liên kết RIP',
        icon: faTriangleExclamation,
        className: 'bg-red-500/10 border-red-500/30 text-red-300',
      }

    case 'NONE':
    default:
      return {
        label: 'Không liên kết',
        icon: faBan,
        className: 'bg-white/5 border-white/10 text-white/45',
      }
  }
}

export default function AccountCard({ account }) {
  const rankColor = getRankColor(account.rank)
  const isAvailable = account.status === 'AVAILABLE'
  const category = account.categoryRelations?.[0]?.category
  const fbInfo = getBindFacebookInfo(account.gameBindFacebook)

  return (
    <motion.div whileHover={{ y: -4 }} className="gaming-card group h-full flex flex-col overflow-hidden">
      <div className="relative h-24 sm:h-44 overflow-hidden">
        <img
          src={account.thumbnailUrl || account.images?.[0]?.url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=250&fit=crop'}
          alt={account.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={e => {
            e.target.src = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=250&fit=crop'
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 via-transparent to-transparent" />

        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {account.isFeatured && (
            <span className="px-2 py-0.5 bg-yellow-500/90 text-dark-900 text-[10px] font-black rounded uppercase flex items-center gap-1">
              <FontAwesomeIcon icon={faFire} />
              Hot
            </span>
          )}

          {account.isNew && (
            <span className="px-2 py-0.5 bg-neon-green/90 text-dark-900 text-[10px] font-black rounded uppercase flex items-center gap-1">
              <FontAwesomeIcon icon={faShirt} />
              New
            </span>
          )}

          {account.isVerified && (
            <span className="px-2 py-0.5 bg-neon-blue/90 text-dark-900 text-[10px] font-black rounded uppercase flex items-center gap-1">
              <FontAwesomeIcon icon={faUserCheck} />
              Xác minh
            </span>
          )}

          {category && (
            <span className="px-2 py-0.5 bg-neon-purple/90 text-dark-900 text-[10px] font-black rounded uppercase flex items-center gap-1">
              <CategoryIcon value={category.icon} />
              {category.name}
            </span>
          )}
        </div>

        {!isAvailable && (
          <div className="absolute inset-0 bg-dark-900/70 backdrop-blur-sm flex items-center justify-center">
            <span className="font-gaming text-2xl font-bold text-red-400 border-2 border-red-400/50 px-4 py-1 rounded rotate-[-10deg]">
              ĐÃ BÁN
            </span>
          </div>
        )}

        <div className="absolute bottom-2 right-2">
          <div className="bg-dark-900/90 backdrop-blur-sm border border-neon-pink/30 rounded-lg px-3 py-1">
            {account.originalPrice && parseFloat(account.originalPrice) > parseFloat(account.price) && (
              <div className="text-[10px] text-white/40 line-through text-right">
                {formatCurrency(account.originalPrice)}
              </div>
            )}

            <div className="font-gaming font-bold text-neon-pink text-xs sm:text-sm">
              {formatCurrency(account.price)}
            </div>
          </div>
        </div>
      </div>

      <div className="p-2.5 sm:p-4 flex flex-col flex-1 gap-1.5 sm:gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-mono text-white/30 bg-white/5 px-1.5 py-0.5 rounded">
            #{account.code}
          </span>

          <span
            className="text-xs font-bold px-2 py-0.5 rounded"
            style={{
              color: rankColor,
              background: `${rankColor}20`,
              border: `1px solid ${rankColor}40`,
            }}
          >
            <FontAwesomeIcon icon={faCrown} className="mr-1" />
            {account.rank}
          </span>
        </div>

        <h3 className="font-display font-semibold text-white text-xs sm:text-sm leading-snug line-clamp-2 group-hover:text-neon-pink transition-colors">
          {account.title}
        </h3>

        {category && (
          <div className="hidden sm:flex text-xs text-purple-300 bg-neon-purple/10 border border-neon-purple/20 rounded-lg px-2 py-1 w-fit items-center gap-1">
            <CategoryIcon value={category.icon} />
            {category.name}
          </div>
        )}

        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
          {[
            { icon: <FontAwesomeIcon icon={faUsers} />, val: account.champions, label: 'Tướng' },
            { icon: <FontAwesomeIcon icon={faVest} />, val: account.skins, label: 'Skin' },
            { icon: <FontAwesomeIcon icon={faCrown} />, val: account.level, label: 'Cấp' },
          ].map(s => (
            <div key={s.label} className="text-center bg-dark-700/50 rounded-lg py-1.5">
              <div className="text-sm text-neon-pink">{s.icon}</div>
              <div className="font-bold text-white text-xs">{s.val}</div>
              <div className="text-[10px] text-white/30">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-1">
          {account.gameBindEmail && (
            <span className="px-2 py-1 rounded-lg bg-neon-green/10 border border-neon-green/25 text-neon-green text-[11px] flex items-center gap-1">
              <FontAwesomeIcon icon={faEnvelope} />
              Mail
            </span>
          )}

          {account.gameBindPhone && (
            <span className="px-2 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/25 text-yellow-300 text-[11px] flex items-center gap-1">
              <FontAwesomeIcon icon={faPhone} />
              SĐT
            </span>
          )}

          <span className={`px-2 py-1 rounded-lg border text-[11px] flex items-center gap-1 ${fbInfo.className}`}>
            <FontAwesomeIcon icon={fbInfo.icon} />
            {fbInfo.label}
          </span>
        </div>

        <div className="hidden sm:flex text-xs text-white/40 items-center gap-1">
          <FontAwesomeIcon icon={faServer} />
          {account.server}

          {account.winRate && (
            <span className="ml-auto text-neon-green">
              {parseFloat(account.winRate).toFixed(0)}% WR
            </span>
          )}
        </div>

        <div className="mt-auto pt-2">
  <Link
    to={`/shop/acc/${account.id}`}
    className={`w-full h-11 sm:h-12 rounded-xl font-display font-black uppercase tracking-wide transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base ${
      isAvailable
        ? 'bg-gradient-to-r from-neon-pink via-pink-500 to-neon-purple hover:from-pink-500 hover:to-purple-500 text-white shadow-[0_0_18px_rgba(255,45,115,0.28)] hover:shadow-[0_0_28px_rgba(255,45,115,0.5)] hover:-translate-y-0.5 active:scale-[0.98]'
        : 'bg-white/5 text-white/30 cursor-not-allowed'
    }`}
  >
    {isAvailable ? (
      <>
        <FontAwesomeIcon icon={faCartShopping} className="text-base" />
        <span>Mua Ngay</span>
      </>
    ) : (
      <>
        <FontAwesomeIcon icon={faCircleXmark} className="text-base" />
        <span>Đã Bán</span>
      </>
    )}
  </Link>
</div>
      </div>
    </motion.div>
  )
}