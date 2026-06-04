import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Thumbs, Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/thumbs'
import 'swiper/css/navigation'
import { useSelector, useDispatch } from 'react-redux'
import { updateBalance } from '../../store/slices/authSlice'
import api from '../../api/axios'
import { formatCurrency, formatDate, getRankColor } from '../../utils/helpers'
import { Spinner } from '../../components/common/UIComponents'
import toast from 'react-hot-toast'
import 'react-quill/dist/quill.snow.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUsers,
  faVest,
  faCrown,
  faChartSimple,
  faGamepad,
  faGem,
  faServer,
  faCartShopping,
  faCircleXmark,
  faTag,
  faTriangleExclamation,
  faBoxOpen,
  faClipboardList,
  faFileLines,
  faWandMagicSparkles,
  faShieldHalved,
  faRightToBracket,
  faCopy,
  faGift,
  faBolt,
  faLock,
  faUser,
  faEnvelope,
  faPhone,
  faCircleCheck,
  faXmark,

  faFire,
  faStar,
  faTrophy,
  faCoins,
  faDice,
  faDragon,
  faGhost,
  faSkull,
  faRocket,
  faMedal,
  faHeart,
  faHammer,
  faBomb,
  faKey,
  faFolderOpen,
} from '@fortawesome/free-solid-svg-icons'

import {
  faSquareFacebook
} from '@fortawesome/free-brands-svg-icons'

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

export default function AccountDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user } = useSelector(s => s.auth)

  const [account, setAccount] = useState(null)
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [credentials, setCredentials] = useState(null)
  const [thumbsSwiper, setThumbsSwiper] = useState(null)
  const [activeTab, setActiveTab] = useState('info')
  const [previewImage, setPreviewImage] = useState(null)

  const [couponInput, setCouponInput] = useState('')
  const [couponData, setCouponData] = useState(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get(`/accounts/${id}`)
        setAccount(data.data)
      } catch (e) {
        toast.error('Không tìm thấy tài khoản')
        navigate(-1)
      } finally {
        setLoading(false)
      }
    }

    fetch()
  }, [id, navigate])

  const applyCoupon = async () => {
    if (!couponInput.trim()) return

    setCouponLoading(true)
    setCouponError('')
    setCouponData(null)

    try {
      const { data } = await api.post('/accounts/coupon/preview', {
        couponCode: couponInput.trim(),
        accountId: id,
      })

      setCouponData(data.data)
      toast.success(`Áp dụng "${couponInput.toUpperCase()}" — giảm ${formatCurrency(data.data.discount)}`)
    } catch (e) {
      setCouponError(e.response?.data?.message || 'Coupon không hợp lệ')
      setCouponData(null)
    } finally {
      setCouponLoading(false)
    }
  }

  const removeCoupon = () => {
    setCouponData(null)
    setCouponInput('')
    setCouponError('')
  }

  const handleBuy = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập')
      navigate('/login')
      return
    }

    setBuying(true)

    try {
      const { data } = await api.post(`/accounts/${id}/buy`, {
        couponCode: couponData ? couponInput.trim() : undefined,
      })

      setCredentials(data.data.gameCredentials)
      setAccount(prev => ({ ...prev, status: 'SOLD' }))
      dispatch(updateBalance(data.data.newBalance))
      setShowConfirm(false)
      toast.success(data.message || 'Mua tài khoản thành công!')
    } catch (e) {
      const msg = e.response?.data?.message || 'Lỗi mua tài khoản'
      toast.error(msg)

      if (msg.includes('Số dư')) navigate('/deposit')
    } finally {
      setBuying(false)
    }
  }

  if (loading) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!account) return null

  const images = account.images?.length > 0 ? account.images : [{ url: account.thumbnailUrl }]
  const rankColor = getRankColor(account.rank)
  const balance = parseFloat(user?.balance || 0)
  const originalPrice = parseFloat(account.price)
  const discountAmt = couponData?.discount || 0
  const finalPrice = couponData?.finalPrice ?? originalPrice
  const category = account.categoryRelations?.[0]?.category

  const hasProtectedInfo =
    credentials?.bindEmail ||
    credentials?.bindPhone ||
    (credentials?.bindFacebook && credentials.bindFacebook !== 'NONE')

  const stats = [
    { icon: <FontAwesomeIcon icon={faUsers} />, label: 'Tướng', value: account.champions },
    { icon: <FontAwesomeIcon icon={faVest} />, label: 'Skin', value: account.skins },
    { icon: <FontAwesomeIcon icon={faCrown} />, label: 'Cấp độ', value: account.level },
    {
      icon: <FontAwesomeIcon icon={faChartSimple} />,
      label: 'Tỉ lệ thắng',
      value: account.winRate ? `${parseFloat(account.winRate).toFixed(1)}%` : 'N/A',
    },
    {
      icon: <FontAwesomeIcon icon={faGamepad} />,
      label: 'Trận đấu',
      value: account.matches?.toLocaleString() || 0,
    },
    {
      icon: <FontAwesomeIcon icon={faGem} />,
      label: 'Quân Huy',
      value: account.gems?.toLocaleString() || 0,
    },
    {
      icon: <FontAwesomeIcon icon={faTag} />,
      label: 'Loại acc',
      value: category?.name || 'Chưa phân loại',
    },
    {
      icon: <FontAwesomeIcon icon={faServer} />,
      label: 'Server',
      value: account.server,
    },
  ]

  const credentialRows = credentials
    ? [
        {
          key: 'username',
          label: (
            <>
              <FontAwesomeIcon icon={faUser} className="mr-1" />
              Tên đăng nhập
            </>
          ),
          value: credentials.username,
          copyable: true,
        },
        {
          key: 'password',
          label: (
            <>
              <FontAwesomeIcon icon={faLock} className="mr-1" />
              Mật khẩu
            </>
          ),
          value: credentials.password,
          copyable: true,
        },
        {
          key: 'email',
          label: (
            <>
              <FontAwesomeIcon icon={faEnvelope} className="mr-1" />
              Email liên kết
            </>
          ),
          value: maskEmail(credentials.bindEmail),
          copyable: false,
        },
        {
          key: 'phone',
          label: (
            <>
              <FontAwesomeIcon icon={faPhone} className="mr-1" />
              SĐT liên kết
            </>
          ),
          value: maskPhone(credentials.bindPhone),
          copyable: false,
        },
        {
          key: 'facebook',
          label: (
            <>
              <FontAwesomeIcon icon={faShieldHalved} className="mr-1" />
              Facebook
            </>
          ),
          value: getFacebookLabel(credentials.bindFacebook),
          copyable: false,
        },
      ].filter(row => row.value)
    : []

  return (
    <div className="pt-20 pb-20 min-h-screen">
      <div className="page-container">
        <div className="flex items-center gap-2 text-sm text-white/40 mb-6">
          <Link to="/" className="hover:text-white transition-colors">
            Trang chủ
          </Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-white transition-colors">
            Shop
          </Link>
          <span>/</span>
          <span className="text-white/70">{account.code}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div>
            <Swiper
              modules={[Thumbs, Navigation]}
              thumbs={{ swiper: thumbsSwiper }}
              navigation
              loop={images.length > 1}
              className="rounded-xl overflow-hidden mb-3 h-72 sm:h-96"
            >
              {images.map((img, i) => (
                <SwiperSlide key={i}>
                  <img
                    src={img.url}
                    alt={account.title}
                    className="w-full h-full object-cover cursor-zoom-in"
                    onClick={() => setPreviewImage(img.url)}
                    onError={e => {
                      e.target.src =
                        'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&h=400&fit=crop'
                    }}
                  />
                </SwiperSlide>
              ))}
            </Swiper>

            {images.length > 1 && (
              <Swiper
                onSwiper={setThumbsSwiper}
                slidesPerView={4}
                spaceBetween={8}
                watchSlidesProgress
                className="rounded-lg overflow-hidden"
              >
                {images.map((img, i) => (
                  <SwiperSlide key={i} className="cursor-pointer opacity-60 hover:opacity-100 transition-opacity">
                    <img
                      src={img.url}
                      alt=""
                      className="w-full h-16 object-cover rounded-lg"
                      onError={e => {
                        e.target.src =
                          'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=100&h=80&fit=crop'
                      }}
                    />
                  </SwiperSlide>
                ))}
              </Swiper>
            )}

            {account.skins_rel?.length > 0 && (
              <div className="mt-4">
                <div className="text-xs text-white/40 uppercase tracking-wider font-display mb-2">
                  Skin nổi bật
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {account.skins_rel.slice(0, 3).map((s, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 rounded-lg text-xs font-medium border bg-neon-purple/10 border-neon-purple/30 text-purple-300 hover:bg-neon-purple/20 transition-colors cursor-default"
                    >
                      <FontAwesomeIcon icon={faWandMagicSparkles} className="mr-1" />
                      {s.skinName}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-xs font-mono text-white/30 bg-white/5 px-2 py-0.5 rounded">
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
                  {account.rank}
                </span>

                {category && (
  <span className="text-xs bg-purple-500/20 text-purple-300 border border-purple-400/30 px-2 py-0.5 rounded flex items-center gap-1">
    <CategoryIcon value={category.icon} />
    {category.name}
  </span>
)}

                {account.isVerified && (
                  <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-400/30 px-2 py-0.5 rounded">
                    <FontAwesomeIcon icon={faShieldHalved} className="mr-1" />
                    Xác minh
                  </span>
                )}
              </div>

              <h1 className="font-gaming text-2xl md:text-3xl font-bold text-white mb-3">
                {account.title}
              </h1>

              <div className="flex items-baseline gap-3 flex-wrap">
                {discountAmt > 0 ? (
                  <>
                    <span className="font-gaming text-3xl font-black text-neon-green">
                      {formatCurrency(finalPrice)}
                    </span>
                    <span className="text-white/30 line-through text-lg">
                      {formatCurrency(originalPrice)}
                    </span>
                    <span className="text-xs bg-red-500/20 text-red-400 border border-red-400/30 px-2 py-0.5 rounded-full font-bold">
                      -{formatCurrency(discountAmt)}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-gaming text-3xl font-black text-neon-pink">
                      {formatCurrency(account.price)}
                    </span>

                    {account.originalPrice && parseFloat(account.originalPrice) > parseFloat(account.price) && (
                      <span className="text-white/30 line-through text-lg">
                        {formatCurrency(account.originalPrice)}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {stats.map(s => (
                <div key={s.label} className="gaming-card p-2 text-center">
                  <div className="text-lg">{s.icon}</div>
                  <div className="font-bold text-white text-sm">{s.value}</div>
                  <div className="text-[10px] text-white/30">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="gaming-card p-4 border border-white/5">
              <div className="text-xs text-white/40 uppercase tracking-wider font-display mb-3">
                <FontAwesomeIcon icon={faShieldHalved} className="mr-2" />
                Thông tin liên kết
              </div>

              <div className="flex flex-wrap gap-2">
                {account.hasBindEmail && (
                  <span className="px-3 py-1.5 rounded-lg bg-neon-green/10 border border-neon-green/25 text-neon-green text-xs flex items-center gap-1">
                    <FontAwesomeIcon icon={faEnvelope} />
                    Mail
                  </span>
                )}

                {account.hasBindPhone && (
                  <span className="px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/25 text-yellow-300 text-xs flex items-center gap-1">
                    <FontAwesomeIcon icon={faPhone} />
                    SĐT
                  </span>
                )}

                <span className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/25 text-blue-300 text-xs flex items-center gap-1">
                  <FontAwesomeIcon icon={faSquareFacebook } />
                  {getFacebookLabel(account.gameBindFacebook)}
                </span>

                {!account.hasBindEmail && !account.hasBindPhone && account.gameBindFacebook === 'NONE' && (
                  <span className="text-white/35 text-xs">
                    Acc không có thông tin liên kết
                  </span>
                )}
              </div>
            </div>

            {account.status === 'AVAILABLE' && user && (
              <div className="gaming-card p-4 border border-white/5">
                <div className="text-xs text-white/40 uppercase tracking-wider font-display mb-2">
                  <FontAwesomeIcon icon={faTag} className="mr-2" />
                  Mã Giảm Giá
                </div>

                {couponData ? (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-neon-green/10 border border-neon-green/30">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-neon-green text-sm">
                          {couponInput.toUpperCase()}
                        </span>
                        <span className="text-xs bg-neon-green/20 text-neon-green px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                          <FontAwesomeIcon icon={faCircleCheck} />
                          Hợp lệ
                        </span>
                      </div>

                      <div className="text-white/50 text-xs mt-0.5">
                        Giảm: <span className="text-neon-green font-bold">{formatCurrency(couponData.discount)}</span>
                      </div>
                    </div>

                    <button
                      onClick={removeCoupon}
                      className="text-white/30 hover:text-red-400 text-lg transition-colors"
                    >
                      <FontAwesomeIcon icon={faXmark} />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        value={couponInput}
                        onChange={e => {
                          setCouponInput(e.target.value.toUpperCase())
                          setCouponError('')
                        }}
                        onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                        placeholder="Nhập mã giảm giá..."
                        className={`input-gaming py-2 pr-3 font-mono uppercase tracking-wider text-sm w-full ${
                          couponError ? 'border-red-500/50' : ''
                        }`}
                        maxLength={30}
                      />
                    </div>

                    <button
                      onClick={applyCoupon}
                      disabled={!couponInput.trim() || couponLoading}
                      className="btn-neon px-4 py-2 text-sm flex items-center gap-1.5 disabled:opacity-40 whitespace-nowrap"
                    >
                      {couponLoading ? (
                        <Spinner size="sm" />
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faTag} />
                          Áp dụng
                        </>
                      )}
                    </button>
                  </div>
                )}

                {couponError && (
                  <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                    <FontAwesomeIcon icon={faTriangleExclamation} />
                    {couponError}
                  </p>
                )}
              </div>
            )}

            {user && balance < finalPrice && account.status === 'AVAILABLE' && (
              <div className="gaming-card border border-yellow-500/30 p-3 bg-yellow-500/5">
                <div className="flex items-center gap-2 text-yellow-400 text-sm">
                  <FontAwesomeIcon icon={faTriangleExclamation} />
                  <span>
                    Số dư không đủ. Cần thêm <strong>{formatCurrency(finalPrice - balance)}</strong>
                  </span>
                </div>

                <Link
                  to="/deposit"
                  className="mt-2 block text-center btn-neon border-yellow-500/40 text-yellow-400 text-xs py-1.5"
                >
                  Nạp Tiền Ngay →
                </Link>
              </div>
            )}

            {credentials ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="gaming-card border border-neon-green/30 p-5 bg-neon-green/5"
              >
                <div className="flex items-center gap-2 text-neon-green font-bold mb-4">
                  <FontAwesomeIcon icon={faGift} className="text-2xl" />
                  <span className="font-gaming text-lg">Mua Thành Công!</span>
                </div>

                <div className="space-y-2">
                  {credentialRows.map(row => (
                    <div key={row.key} className="flex items-center justify-between bg-dark-700 rounded-lg px-3 py-2">
                      <span className="text-white/50 text-xs">{row.label}</span>

                      <div className="flex items-center gap-2">
                        <span className="font-mono text-white font-bold text-sm">{row.value}</span>

                        {row.copyable && (
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(row.value)
                              toast.success('Đã sao chép!')
                            }}
                            className="text-neon-pink text-xs"
                          >
                            <FontAwesomeIcon icon={faCopy} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {hasProtectedInfo && (
                  <div className="mt-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 text-xs text-yellow-300">
                    <FontAwesomeIcon icon={faTriangleExclamation} className="mr-2" />
                    Acc có thông tin liên kết. Vui lòng liên hệ ZALO ADMIN để đổi thông tin bảo mật.
                  </div>
                )}

                <Link
                  to="/owned-accounts"
                  className="mt-3 block text-center text-neon-pink text-sm hover:text-neon-pink/80 transition-colors"
                >
                  <FontAwesomeIcon icon={faBoxOpen} className="mr-2" />
                  Xem trong Kho Acc →
                </Link>

                <p className="text-white/40 text-xs mt-2">
                  <FontAwesomeIcon icon={faTriangleExclamation} className="mr-1" />
                  Lưu lại thông tin đăng nhập tài khoản
                </p>
              </motion.div>
            ) : (
              <div className="flex flex-col gap-3">
                {account.status === 'AVAILABLE' ? (
                  !user ? (
                    <Link to="/login" className="btn-primary text-center py-4 text-base">
                      <FontAwesomeIcon icon={faRightToBracket} className="mr-2" />
                      Đăng Nhập Để Mua
                    </Link>
                  ) : (
                    <motion.button
                      onClick={() => setShowConfirm(true)}
                      disabled={balance < finalPrice}
                      whileHover={{ scale: balance >= finalPrice ? 1.01 : 1 }}
                      whileTap={{ scale: 0.99 }}
                      className={`btn-primary py-4 text-base w-full flex items-center justify-center gap-2 ${
                        balance < finalPrice ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <FontAwesomeIcon icon={faCartShopping} className="mr-2" />
                      Mua Tài Khoản
                      {discountAmt > 0 ? (
                        <span className="font-gaming">
                          {formatCurrency(finalPrice)}{' '}
                          <span className="line-through opacity-60 text-sm">{formatCurrency(originalPrice)}</span>
                        </span>
                      ) : (
                        <span className="font-gaming">— {formatCurrency(account.price)}</span>
                      )}
                    </motion.button>
                  )
                ) : (
                  <div className="text-center py-4 text-red-400 font-gaming text-lg border border-red-500/30 rounded-xl bg-red-500/5">
                    <FontAwesomeIcon icon={faCircleXmark} className="mr-2" />
                    Tài Khoản Đã Được Bán
                  </div>
                )}

                <div className="flex items-center justify-center gap-4 text-white/30 text-xs flex-wrap">
                  <span className="flex items-center gap-1">
                    <FontAwesomeIcon icon={faShieldHalved} />
                    Bảo hành 30 ngày
                  </span>

                  <span className="flex items-center gap-1">
                    <FontAwesomeIcon icon={faBolt} />
                    Nhận Acc ngay
                  </span>

                  <span className="flex items-center gap-1">
                    <FontAwesomeIcon icon={faLock} />
                    An toàn
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12">
          <div className="flex gap-2 mb-6 border-b border-white/10 pb-2">
            {[
              [
                'info',
                <>
                  <FontAwesomeIcon icon={faClipboardList} className="mr-2" />
                  Thông tin
                </>,
              ],
              [
                'desc',
                <>
                  <FontAwesomeIcon icon={faFileLines} className="mr-2" />
                  Mô tả
                </>,
              ],
              [
                'skins',
                <>
                  <FontAwesomeIcon icon={faWandMagicSparkles} className="mr-2" />
                  Skin
                </>,
              ],
            ].map(([tab, label]) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-t-lg font-display font-medium text-sm transition-all ${
                  activeTab === tab
                    ? 'bg-neon-pink/20 text-neon-pink border-b-2 border-neon-pink'
                    : 'text-white/40 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {activeTab === 'info' && (
            <div className="gaming-card p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                ['Mã', `#${account.code}`],
                ['Loại tài khoản', category ? `${category.icon ? `${category.icon} ` : ''}${category.name}` : 'Chưa phân loại'],
                ['Rank', account.rank],
                ['Server', account.server],
                ['Số tướng', `${account.champions} tướng`],
                ['Số skin', `${account.skins} skin`],
                ['Cấp độ', `Cấp ${account.level}`],
                ['Tỉ lệ thắng', account.winRate ? `${parseFloat(account.winRate).toFixed(1)}%` : 'N/A'],
                ['Trận đấu', `${(account.matches || 0).toLocaleString()} trận`],
                ['Gem', `${(account.gems || 0).toLocaleString()}`],
                ['Email', account.hasBindEmail ? 'Có Mail' : 'Không có'],
                ['SĐT', account.hasBindPhone ? 'Có SĐT' : 'Không có'],
                ['Facebook', getFacebookLabel(account.gameBindFacebook)],
                ['Ngày đăng', formatDate(account.createdAt)],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <span className="text-white/40 text-sm">{k}</span>
                  <span className="text-white font-medium text-sm">{v}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'desc' && (
            <div className="gaming-card p-6">
              {account.description ? (
                <div className="ql-snow">
                  <div
                    className="ql-editor !p-0 !text-white/80 !leading-relaxed
                      [&_h1]:!text-white [&_h2]:!text-white [&_h3]:!text-white
                      [&_p]:!text-white/80
                      [&_strong]:!text-white
                      [&_a]:!text-neon-pink
                      [&_blockquote]:!border-l-neon-pink/40 [&_blockquote]:!text-white/50
                      [&_img]:!rounded-xl [&_img]:!border [&_img]:!border-white/10
                      [&_code]:!bg-dark-900 [&_code]:!text-neon-pink
                      [&_ul]:!text-white/80 [&_ol]:!text-white/80
                      [&_li]:!text-white/80"
                    dangerouslySetInnerHTML={{ __html: account.description }}
                  />
                </div>
              ) : (
                <p className="text-white/40 text-center py-6">Không có mô tả</p>
              )}
            </div>
          )}

          {activeTab === 'skins' && (
            <div className="gaming-card p-6">
              {account.skins_rel?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {account.skins_rel.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neon-purple/10 border border-neon-purple/20 hover:border-neon-purple/40 transition-all"
                    >
                      <span className="text-purple-300">
                        <FontAwesomeIcon icon={faWandMagicSparkles} />
                      </span>

                      <div>
                        <div className="text-white text-sm font-medium">{s.skinName}</div>
                        {s.heroName && <div className="text-white/40 text-xs">{s.heroName}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-white/30">Chưa có thông tin skin</div>
              )}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setPreviewImage(null)}
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="fixed top-24 right-6 text-white text-4xl hover:text-neon-pink transition-colors z-[9999] bg-black/50 rounded-full w-12 h-12 flex items-center justify-center"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>

            <motion.img
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              src={previewImage}
              alt=""
              className="max-w-full max-h-[90vh] rounded-2xl shadow-[0_0_60px_rgba(255,45,115,0.25)] object-contain"
              onClick={e => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => !buying && setShowConfirm(false)}
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative gaming-card border border-white/10 p-6 max-w-sm w-full z-10"
            >
              <h3 className="font-gaming text-lg font-bold text-gradient mb-2 text-center flex items-center justify-center gap-2">
                <FontAwesomeIcon icon={faTriangleExclamation} />
                Xác Nhận Mua
              </h3>

              <div className="text-center mb-4">
                <div className="text-3xl mb-2 text-neon-pink">
                  <FontAwesomeIcon icon={faCartShopping} />
                </div>

                <div className="font-display font-bold text-white">{account.title}</div>
                <div className="text-white/50 text-sm mt-1">#{account.code}</div>
              </div>

              <div className="space-y-2 mb-5">
                {[
                  ['Giá gốc', formatCurrency(originalPrice), 'text-white'],
                  ...(discountAmt > 0
                    ? [['Giảm giá', `-${formatCurrency(discountAmt)}`, 'text-neon-green font-bold']]
                    : []),
                  ['Thanh toán', formatCurrency(finalPrice), 'text-neon-pink font-gaming font-bold text-lg'],
                  [
                    'Số dư còn lại',
                    formatCurrency(balance - finalPrice),
                    balance - finalPrice >= 0 ? 'text-neon-green' : 'text-red-400',
                  ],
                ].map(([k, v, cls]) => (
                  <div key={k} className="flex justify-between items-center p-3 gaming-card">
                    <span className="text-white/60 text-sm">{k}</span>
                    <span className={`text-sm ${cls}`}>{v}</span>
                  </div>
                ))}
              </div>

              {discountAmt > 0 && (
                <div className="gaming-card p-2.5 mb-4 border border-neon-green/30 bg-neon-green/5 text-center text-sm text-neon-green">
                  <FontAwesomeIcon icon={faTag} className="mr-1" />
                  Mã <strong>{couponInput.toUpperCase()}</strong> đã được áp dụng
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={buying}
                  className="flex-1 btn-neon py-3 text-sm"
                >
                  Hủy
                </button>

                <button
                  onClick={handleBuy}
                  disabled={buying || balance < finalPrice}
                  className="flex-1 btn-primary py-3 text-sm flex items-center justify-center gap-2"
                >
                  {buying ? (
                    <>
                      <Spinner size="sm" color="white" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCircleCheck} />
                      Xác Nhận
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}