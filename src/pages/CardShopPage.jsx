import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import { updateBalance } from '../store/slices/authSlice'
import { formatCurrency, formatDate } from '../utils/helpers'
import { Spinner, Pagination } from '../components/common/UIComponents'
import toast from 'react-hot-toast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCreditCard,
  faCartShopping,
  faClockRotateLeft,
  faRotateRight,
  faEye,
  faEyeSlash,
  faCopy,
  faCheck,
  faRightToBracket,
  faMoneyBillWave,
  faCircleCheck,
  faXmark,
  faMobileScreen,
  faGamepad,
  faCoins,
  faReceipt,
  faShieldHalved,
  faCircleInfo,
  faTriangleExclamation,
  faWallet,
} from '@fortawesome/free-solid-svg-icons'

const HISTORY_LIMIT = 8

const PHONE_TELCOS = [
  'VIETTEL',
  'VINAPHONE',
  'MOBIFONE',
  'VIETNAMOBILE',
  'GMOBILE',
  'REDDI',
]

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`p-1.5 rounded-lg text-xs transition-all ${
        copied
          ? 'text-neon-green bg-neon-green/15'
          : 'text-white/40 hover:text-white/70 hover:bg-white/10'
      }`}
    >
      <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
    </button>
  )
}

function CardResultModal({ purchase, onClose }) {
  const [show, setShow] = useState(false)
  const cards = purchase?.cards || []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/85 backdrop-blur-md"
        onClick={onClose}
      />

      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        className="relative gaming-card p-6 max-w-md w-full z-10 border-neon-green/40"
        style={{ boxShadow: '0 0 60px rgba(34,197,94,0.25)' }}
      >
        <div className="absolute inset-0 opacity-10 rounded-2xl bg-[radial-gradient(circle_at_center,#22c55e,transparent_70%)]" />

        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-white/30 hover:text-white z-10"
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>

        <div className="relative z-10">
          <div className="text-center mb-5">
            <FontAwesomeIcon
              icon={faCircleCheck}
              className="text-5xl text-neon-green mb-3"
              style={{ filter: 'drop-shadow(0 0 15px rgba(34,197,94,0.8))' }}
            />

            <div className="font-gaming text-xl font-black text-white">
              MUA THẺ THÀNH CÔNG!
            </div>

            <div className="text-white/50 text-sm mt-1">
              {cards.length} thẻ {purchase?.telcoLabel || purchase?.telco}{' '}
              {formatCurrency(purchase?.denomination)} — HSD 2 giờ
            </div>
            <div className="text-white/30 text-xs mt-1">
                Thời gian mua: {formatDate(purchase.createdAt)}
              </div>
          </div>
          

          <div className="space-y-3 mb-5 max-h-[360px] overflow-y-auto pr-1">
            {cards.length === 0 ? (
              <div className="text-center text-white/40 text-sm py-6">
                Chưa có mã thẻ. Vui lòng bấm xem lại trong lịch sử.
              </div>
            ) : (
              cards.map((card, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-neon-green/20 bg-neon-green/5 p-3"
                >
                  <div className="text-white/40 text-xs mb-2 flex items-center gap-2">
                    <FontAwesomeIcon icon={faCreditCard} />
                    Thẻ #{i + 1}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-white/40 text-xs">Mã thẻ:</span>

                      <div className="flex items-center gap-1 min-w-0">
                        <code
                          className={`text-neon-green font-mono font-bold text-sm tracking-widest break-all ${
                            show ? '' : 'blur-sm select-none'
                          }`}
                        >
                          {card.pin || card.code || '••••••••••••••'}
                        </code>

                        {show && <CopyButton text={card.pin || card.code || ''} />}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-white/40 text-xs">Seri:</span>

                      <div className="flex items-center gap-1 min-w-0">
                        <code
                          className={`text-white/70 font-mono text-xs break-all ${
                            show ? '' : 'blur-sm select-none'
                          }`}
                        >
                          {card.serial || '••••••••••••'}
                        </code>

                        {show && <CopyButton text={card.serial || ''} />}
                      </div>
                    </div>

                    {(card.expireDate || card.expired) && (
                      <div className="text-white/30 text-[10px]">
                        HSD: {card.expireDate || card.expired}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <button
            type="button"
            onClick={() => setShow(s => !s)}
            className="w-full py-2.5 rounded-xl border border-white/10 bg-white/5 text-white/50 hover:text-white text-sm flex items-center justify-center gap-2 mb-3"
          >
            <FontAwesomeIcon icon={show ? faEyeSlash : faEye} />
            {show ? 'Ẩn mã' : 'Hiện mã'}
          </button>

          <div className="text-center text-white/30 text-xs flex items-center justify-center gap-2">
            <FontAwesomeIcon icon={faTriangleExclamation} />
            Lưu mã ngay! Hiệu lực 2 giờ kể từ khi mua.
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default function CardShopPage() {
  const { user } = useSelector(s => s.auth)
  const dispatch = useDispatch()

  const [configs, setConfigs] = useState([])
  const [configsLoading, setConfigsLoading] = useState(true)
  const [selectedTelco, setSelectedTelco] = useState(null)
  const [selectedConfig, setSelectedConfig] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [resultPurchase, setResultPurchase] = useState(null)
  const [history, setHistory] = useState([])
  const [histPage, setHistPage] = useState(1)
  const [histTotal, setHistTotal] = useState(0)
  const [histFilterStatus, setHistFilterStatus] = useState('')
  const [histFrom, setHistFrom] = useState('')
  const [histTo, setHistTo] = useState('')
  const [viewPurchase, setViewPurchase] = useState(null)
  const [histFilterTelco, setHistFilterTelco] = useState('')

  useEffect(() => {
    fetchConfigs()
  }, [])

  useEffect(() => {
  if (user) fetchHistory()
}, [user, histPage, histFilterStatus, histFilterTelco, histFrom, histTo])

  const fetchConfigs = async () => {
    setConfigsLoading(true)

    try {
      const { data } = await api.get('/card/configs?type=buy')
      const list = data.data || []
      const enabledList = list.filter(c => c.buyEnabled)

      setConfigs(list)

      if (enabledList.length > 0) {
        const telcoList = [...new Set(enabledList.map(c => c.telco))]
        const phoneFirst = telcoList.find(t => PHONE_TELCOS.includes(t))
        const firstTelco = phoneFirst || telcoList[0]

        setSelectedTelco(firstTelco)

        const firstConfig = enabledList.find(c => c.telco === firstTelco)
        setSelectedConfig(firstConfig || null)
      }
    } catch {
      setConfigs([])
    } finally {
      setConfigsLoading(false)
    }
  }

  const fetchHistory = async () => {
  try {
    const q = new URLSearchParams({ page: histPage, limit: HISTORY_LIMIT })

    if (histFilterStatus) q.append('status', histFilterStatus)
    if (histFilterTelco) q.append('telco', histFilterTelco)
    if (histFrom) q.append('fromDate', histFrom)
    if (histTo) q.append('toDate', histTo)

    const { data } = await api.get(`/card/buy/history?${q}`)

    setHistory(data.data || [])
    setHistTotal(data.pagination?.total || 0)
  } catch {
    setHistory([])
  }
}

  const enabledConfigs = configs.filter(c => c.buyEnabled)
  const telcos = [...new Set(enabledConfigs.map(c => c.telco))]

  const phoneTelcos = telcos.filter(telco => PHONE_TELCOS.includes(telco))
  const gameTelcos = telcos.filter(telco => !PHONE_TELCOS.includes(telco))

  const denomsForTelco = configs.filter(
    c => c.telco === selectedTelco && c.buyEnabled
  )

  const selectedAmount = selectedConfig
    ? parseFloat(selectedConfig.denomination)
    : 0

  const unitPrice = selectedConfig
    ? Math.round(
        parseFloat(selectedConfig.denomination) *
          (1 - parseFloat(selectedConfig.buyDiscount) / 100)
      )
    : 0

  const totalPrice = unitPrice * quantity

  const canBuy =
    user &&
    selectedConfig &&
    !loading &&
    totalPrice > 0 &&
    parseFloat(user?.balance || 0) >= totalPrice

  const renderTelcoButton = (telco, icon) => {
    const items = configs.filter(c => c.telco === telco && c.buyEnabled)
    if (!items.length) return null

    const first = items[0]

    return (
      <button
        key={telco}
        type="button"
        onClick={() => {
          setSelectedTelco(telco)

          const firstConfig = configs.find(c => c.telco === telco && c.buyEnabled)
          setSelectedConfig(firstConfig || null)
        }}
        className={`flex items-center gap-3 px-5 py-3 rounded-xl border font-bold text-sm transition-all ${
          selectedTelco === telco
            ? 'bg-neon-purple/20 border-neon-purple/40 text-white shadow-[0_0_20px_rgba(124,58,237,0.25)]'
            : 'bg-white/[0.03] border-white/10 text-white/50 hover:border-white/20 hover:text-white/80'
        }`}
      >
        {first.thumbnailUrl ? (
          <img
            src={first.thumbnailUrl}
            className="w-10 h-7 object-cover rounded border border-white/10"
            alt={first.telcoLabel || telco}
          />
        ) : (
          <span className="w-10 h-7 rounded bg-dark-600 border border-white/10 flex items-center justify-center">
            <FontAwesomeIcon icon={icon} />
          </span>
        )}

        {first.telcoLabel || telco}
      </button>
    )
  }

  const submittingRef = useRef(false)

  const handleBuy = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập')
      return
    }

    if (!selectedConfig) {
      toast.error('Chọn mệnh giá thẻ')
      return
    }

    if (parseFloat(user.balance) < totalPrice) {
      toast.error('Số dư không đủ')
      return
    }

    if (submittingRef.current) return
    submittingRef.current = true

    setLoading(true)

    try {
      const { data } = await api.post('/card/buy', {
        cardConfigId: selectedConfig.id,
        quantity,
      })

      if (!data.success) {
        // Nếu có cards dù success=false (edge case) → vẫn hiện modal
        if (data.data?.cards?.length > 0) {
          const purchaseData = {
            ...data.data,
            status: 'SUCCESS',
            telco: data.data?.telco || selectedConfig.telco,
            telcoLabel: data.data?.telcoLabel || selectedConfig.telcoLabel,
            denomination: data.data?.denomination || selectedConfig.denomination,
            thumbnailUrl: data.data?.thumbnailUrl || selectedConfig.thumbnailUrl,
            quantity: data.data?.quantity || quantity,
            totalPrice: data.data?.totalPrice || totalPrice,
          }
          setResultPurchase(purchaseData)
          if (data.data?.newBalance !== undefined) dispatch(updateBalance(data.data.newBalance))
          await fetchHistory()
          toast.success('Mua thẻ thành công!')
          return
        }
        toast.error(data.message || 'Mua thẻ thất bại')
        return
      }

      const purchaseData = {
        ...data.data,
        status: data.data?.status || 'SUCCESS',
        telco: data.data?.telco || selectedConfig.telco,
        telcoLabel: data.data?.telcoLabel || selectedConfig.telcoLabel,
        denomination: data.data?.denomination || selectedConfig.denomination,
        thumbnailUrl: data.data?.thumbnailUrl || selectedConfig.thumbnailUrl,
        quantity: data.data?.quantity || quantity,
        totalPrice: data.data?.totalPrice || totalPrice,
        cards: data.data?.cards || [],
      }

      setResultPurchase(purchaseData)

      if (data.data?.newBalance !== undefined && data.data?.newBalance !== null) {
        dispatch(updateBalance(data.data.newBalance))
      } else if (user?.balance !== undefined) {
        dispatch(updateBalance(Number(user.balance) - Number(totalPrice)))
      }

      await fetchHistory()

      toast.success(data.message || 'Mua thẻ thành công!')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Mua thẻ thất bại')
    } finally {
      setLoading(false)
      submittingRef.current = false
    }
  }

  const loadDetail = async id => {
    try {
      const { data } = await api.get(`/card/buy/${id}`)
      setViewPurchase(data.data)
    } catch {
      toast.error('Lỗi tải chi tiết')
    }
  }

  return (
    <div className="pt-24 pb-20 min-h-screen relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,197,94,0.1),transparent_40%),radial-gradient(circle_at_70%_70%,rgba(124,58,237,0.1),transparent_40%),linear-gradient(180deg,#050510,#080818)]" />

      <div className="page-container relative z-10 max-w-5xl">
        <div className="mb-8">
          <div className="text-neon-green text-xs font-mono font-bold uppercase tracking-[0.4em] mb-3 flex items-center gap-3">
            <span className="w-8 h-px bg-neon-green" />
            <FontAwesomeIcon icon={faCreditCard} />
            SHOP THẺ CÀO
            <span className="w-8 h-px bg-neon-green" />
          </div>

          <h1 className="font-gaming text-4xl md:text-5xl font-black text-white mb-2">
            MUA MÃ THẺ
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-neon-green to-teal-400">
              ĐIỆN THOẠI & GAME
            </span>
          </h1>

          <p className="text-white/40 text-sm">
            Mua thẻ nhanh chóng — nhận mã ngay lập tức.
          </p>
        </div>

        {configsLoading ? (
          <div className="flex justify-center py-20">
            <Spinner size="xl" />
          </div>
        ) : enabledConfigs.length === 0 ? (
          <div className="gaming-card p-12 text-center">
            <FontAwesomeIcon icon={faCreditCard} className="text-5xl text-white/20 mb-4" />
            <p className="text-white/40 text-sm">Chức năng mua thẻ hiện tạm khóa</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            <div className="space-y-5">
              <div className="gaming-card p-5">
                <h3 className="font-gaming text-sm font-bold text-white/70 uppercase mb-4 tracking-wide flex items-center gap-2">
                  <FontAwesomeIcon icon={faShieldHalved} className="text-neon-green" />
                  1. Chọn nhà mạng / loại thẻ
                </h3>

                {phoneTelcos.length > 0 && (
                  <div className="mb-5">
                    <div className="flex items-center gap-2 text-[11px] text-white/40 font-bold uppercase tracking-wider mb-2">
                      <FontAwesomeIcon icon={faMobileScreen} className="text-neon-green" />
                      Thẻ điện thoại
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {phoneTelcos.map(telco => renderTelcoButton(telco, faMobileScreen))}
                    </div>
                  </div>
                )}

                {gameTelcos.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-[11px] text-white/40 font-bold uppercase tracking-wider mb-2">
                      <FontAwesomeIcon icon={faGamepad} className="text-neon-purple" />
                      Thẻ game
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {gameTelcos.map(telco => renderTelcoButton(telco, faGamepad))}
                    </div>
                  </div>
                )}
              </div>

              {selectedTelco && (
                <div className="gaming-card p-5">
                  <h3 className="font-gaming text-sm font-bold text-white/70 uppercase mb-4 tracking-wide flex items-center gap-2">
                    <FontAwesomeIcon icon={faCoins} className="text-yellow-400" />
                    2. Chọn mệnh giá
                  </h3>

                  <select
                    value={selectedConfig?.id || ''}
                    onChange={e => {
                      const cfg = denomsForTelco.find(x => x.id === e.target.value)
                      setSelectedConfig(cfg || null)
                    }}
                    className="input-gaming text-sm py-2"
                  >
                    <option value="">-- Chọn mệnh giá --</option>

                    {denomsForTelco.map(cfg => {
                      const price = Math.round(
                        parseFloat(cfg.denomination) *
                          (1 - parseFloat(cfg.buyDiscount) / 100)
                      )

                      return (
                        <option key={cfg.id} value={cfg.id}>
                          {formatCurrency(cfg.denomination)} | Giá mua:{' '}
                          {formatCurrency(price)} | CK {cfg.buyDiscount}%
                        </option>
                      )
                    })}
                  </select>

                  {selectedConfig && (
                    <div className="mt-3 rounded-xl border border-neon-green/20 bg-neon-green/5 p-3 space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/50">Mệnh giá</span>
                        <span className="text-white font-bold">
                          {formatCurrency(selectedConfig.denomination)}
                        </span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-white/50">Chiết khấu</span>
                        <span className="text-neon-green font-bold">
                          {selectedConfig.buyDiscount}%
                        </span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-white/50">Giá 1 thẻ</span>
                        <span className="text-yellow-400 font-gaming font-bold">
                          {formatCurrency(unitPrice)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="gaming-card p-5">
                <h3 className="font-gaming text-sm font-bold text-white/70 uppercase mb-4 tracking-wide flex items-center gap-2">
                  <FontAwesomeIcon icon={faReceipt} className="text-neon-pink" />
                  3. Số lượng
                </h3>

                <select
                  value={quantity}
                  onChange={e => setQuantity(Number(e.target.value))}
                  className="input-gaming text-sm py-2"
                >
                  {[1, 2, 3, 5, 10].map(q => (
                    <option key={q} value={q}>
                      {q} thẻ
                    </option>
                  ))}
                </select>

                <p className="text-white/30 text-xs mt-2">
                  Tối đa 10 thẻ/lần.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="gaming-card p-5 sticky top-24">
                <h3 className="font-gaming text-sm font-bold text-white/70 uppercase mb-4 tracking-wide flex items-center gap-2">
                  <FontAwesomeIcon icon={faReceipt} className="text-yellow-400" />
                  Đơn hàng
                </h3>

                {selectedConfig ? (
                  <div className="space-y-3 mb-5">
                    {[
                      ['Loại thẻ', selectedConfig.telcoLabel || selectedConfig.telco],
                      ['Mệnh giá', formatCurrency(selectedAmount)],
                      ['Số lượng', `${quantity} thẻ`],
                      ['Giá 1 thẻ', formatCurrency(unitPrice)],
                      ['Chiết khấu', `-${selectedConfig.buyDiscount}%`],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between text-sm gap-3">
                        <span className="text-white/50">{k}</span>
                        <span
                          className={`text-white font-medium text-right ${
                            k === 'Chiết khấu' ? 'text-neon-green font-bold' : ''
                          }`}
                        >
                          {v}
                        </span>
                      </div>
                    ))}

                    <div className="border-t border-white/10 pt-3 flex justify-between">
                      <span className="text-white font-bold">Tổng</span>
                      <span className="font-gaming text-yellow-400 font-black text-lg">
                        {formatCurrency(totalPrice)}
                      </span>
                    </div>

                    {user && (
                      <div className="flex justify-between text-xs">
                        <span className="text-white/30">Số dư sau</span>
                        <span
                          className={
                            parseFloat(user.balance) >= totalPrice
                              ? 'text-neon-green/80'
                              : 'text-red-400'
                          }
                        >
                          {formatCurrency(
                            Math.max(0, parseFloat(user.balance) - totalPrice)
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-white/30 text-sm mb-5">
                    Chọn mệnh giá để xem tóm tắt.
                  </div>
                )}

                {!user ? (
                  <Link
                    to="/login"
                    className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2"
                  >
                    <FontAwesomeIcon icon={faRightToBracket} />
                    Đăng Nhập Để Mua
                  </Link>
                ) : !selectedConfig ? (
                  <button
                    type="button"
                    disabled
                    className="btn-primary w-full py-3.5 font-gaming font-black text-base flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <FontAwesomeIcon icon={faCartShopping} />
                    Chọn mệnh giá
                  </button>
                ) : parseFloat(user.balance) < totalPrice ? (
                  <div className="space-y-2">
                    <p className="text-red-400 text-xs text-center flex items-center justify-center gap-2">
                      <FontAwesomeIcon icon={faTriangleExclamation} />
                      Số dư không đủ
                    </p>

                    <Link
                      to="/deposit"
                      className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2"
                    >
                      <FontAwesomeIcon icon={faMoneyBillWave} />
                      Nạp Thêm Tiền
                    </Link>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleBuy}
                    disabled={!canBuy}
                    className="btn-primary w-full py-3.5 font-gaming font-black text-base flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Spinner size="sm" color="white" />
                        Đang mua...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faCartShopping} />
                        MUA NGAY
                      </>
                    )}
                  </button>
                )}

                {user && (
                  <div className="mt-3 text-center text-white/30 text-xs flex items-center justify-center gap-2">
                    <FontAwesomeIcon icon={faWallet} />
                    Số dư:
                    <span className="text-yellow-400 font-bold">
                      {formatCurrency(user.balance)}
                    </span>
                  </div>
                )}
              </div>

              <div className="gaming-card p-4 text-xs text-white/40 space-y-1.5">
                <div className="text-white/60 font-bold mb-2 flex items-center gap-2">
                  <FontAwesomeIcon icon={faCircleInfo} className="text-blue-400" />
                  Lưu ý
                </div>

                <div>• Mã thẻ hiệu lực <span className="text-yellow-400">2 giờ</span> từ khi mua</div>
                <div>• Lưu mã ngay sau khi nhận</div>
                <div>• Không hoàn tiền sau khi cấp mã</div>
              </div>
            </div>
          </div>
        )}

        {user && (
          <div className="gaming-card p-5 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-gaming text-sm font-bold text-white/80 uppercase tracking-wide flex items-center gap-2">
                <FontAwesomeIcon icon={faClockRotateLeft} className="text-neon-green" />
                Lịch Sử Mua Thẻ
              </h3>

              <button
                type="button"
                onClick={fetchHistory}
                className="text-white/30 hover:text-white/60 text-sm"
              >
                <FontAwesomeIcon icon={faRotateRight} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
  <div>
    <label className="text-[10px] text-white/40 uppercase font-display block mb-1">
      Trạng thái
    </label>
    <select
      value={histFilterStatus}
      onChange={e => {
        setHistFilterStatus(e.target.value)
        setHistPage(1)
      }}
      className="input-gaming text-xs py-1.5 w-full"
    >
      <option value="">Tất cả</option>
      <option value="PENDING">Chờ xử lý</option>
      <option value="SUCCESS">Thành công</option>
      <option value="FAILED">Thất bại</option>
    </select>
  </div>

  <div>
    <label className="text-[10px] text-white/40 uppercase font-display block mb-1">
      Nhà mạng
    </label>
    <select
      value={histFilterTelco}
      onChange={e => {
        setHistFilterTelco(e.target.value)
        setHistPage(1)
      }}
      className="input-gaming text-xs py-1.5 w-full"
    >
      <option value="">Tất cả</option>
      {[...new Map(configs.filter(c => c.buyEnabled).map(c => [c.telco, c])).values()].map(c => (
        <option key={c.telco} value={c.telco}>
          {c.telcoLabel || c.telco}
        </option>
      ))}
    </select>
  </div>

  <div>
    <label className="text-[10px] text-white/40 uppercase font-display block mb-1">
      Từ ngày
    </label>
    <input
      type="date"
      value={histFrom}
      onChange={e => {
        setHistFrom(e.target.value)
        setHistPage(1)
      }}
      className="input-gaming text-xs py-1.5 w-full"
    />
  </div>

  <div>
    <label className="text-[10px] text-white/40 uppercase font-display block mb-1">
      Đến ngày
    </label>
    <input
      type="date"
      value={histTo}
      onChange={e => {
        setHistTo(e.target.value)
        setHistPage(1)
      }}
      className="input-gaming text-xs py-1.5 w-full"
    />
  </div>
</div>
            {(histFilterStatus || histFilterTelco || histFrom || histTo) && (
  <button
    type="button"
    onClick={() => {
      setHistFilterStatus('')
      setHistFilterTelco('')
      setHistFrom('')
      setHistTo('')
      setHistPage(1)
    }}
    className="mb-3 px-3 py-1 rounded-lg text-[10px] border border-red-500/30 text-red-400 hover:bg-red-500/10 flex items-center gap-1"
  >
    <FontAwesomeIcon icon={faXmark} />
    Xóa bộ lọc
  </button>
)}

            {history.length === 0 ? (
              <div className="py-8 text-center text-white/30 text-sm">
                Chưa có lịch sử mua thẻ.
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {history.map(h => {
                    const statusInfo = {
                      PENDING: { label: 'Chờ', color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/30' },
                      SUCCESS: { label: 'Thành công', color: 'text-neon-green', bg: 'bg-neon-green/10 border-neon-green/30' },
                      FAILED: { label: 'Thất bại', color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/30' },
                    }[h.status] || { label: h.status, color: 'text-white/40', bg: 'bg-white/5 border-white/10' }

                    const cards = h.cards || []

                    return (
                      <div
                        key={h.id}
                        className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-7 flex-shrink-0">
                            {h.cardConfig?.thumbnailUrl ? (
                              <img
                                src={h.cardConfig.thumbnailUrl}
                                className="w-10 h-7 rounded object-cover border border-white/10"
                                alt={h.cardConfig?.telcoLabel || h.telco}
                              />
                            ) : (
                              <div className="w-10 h-7 rounded bg-neon-green/15 flex items-center justify-center">
                                <FontAwesomeIcon icon={faCreditCard} className="text-neon-green text-xs" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-white text-xs font-medium">
                                {h.quantity}x {h.cardConfig?.telcoLabel || h.telco}{' '}
                                {formatCurrency(h.denomination)}
                              </span>
                              <span className={`text-[9px] font-bold border px-1.5 py-0.5 rounded-full ${statusInfo.bg} ${statusInfo.color}`}>
                                {statusInfo.label}
                              </span>
                            </div>
                            <div className="text-white/40 text-[10px]">
                              {formatDate(h.createdAt)}
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0 flex items-center gap-2">
                            <div className="text-yellow-400 text-xs font-bold">
                              {formatCurrency(h.totalPrice)}
                            </div>

                            {h.status === 'SUCCESS' && (
                              <button
                                type="button"
                                onClick={() => loadDetail(h.id)}
                                className="px-2 py-1 rounded-lg bg-neon-green/15 border border-neon-green/30 text-neon-green text-[10px] font-bold hover:bg-neon-green/25"
                              >
                                <FontAwesomeIcon icon={faEye} className="mr-1" />
                                Xem
                              </button>
                            )}
                          </div>
                        </div>

                        {cards.length > 0 && h.status === 'SUCCESS' && (
  <div className="mt-1 pl-2 border-l-2 border-neon-green/20 space-y-1">
    {cards.map((card, ci) => (
      <div key={ci} className="text-[10px] text-white/40 flex flex-wrap gap-x-4 gap-y-0.5">
        <span>
          Mã: <code className="text-neon-green font-mono font-bold tracking-wider">{card.pin || card.code}</code>
        </span>
        <span>
          Seri: <code className="text-white/60 font-mono">{card.serial}</code>
        </span>
      </div>
    ))}
  </div>
)}
                      </div>
                    )
                  })}
                </div>

                {histTotal > HISTORY_LIMIT && (
                  <div className="pt-4">
                    <Pagination
                      page={histPage}
                      pages={Math.ceil(histTotal / HISTORY_LIMIT)}
                      onPageChange={setHistPage}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {resultPurchase && (
          <CardResultModal
            purchase={resultPurchase}
            onClose={() => setResultPurchase(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewPurchase && (
          <CardResultModal
            purchase={viewPurchase}
            onClose={() => setViewPurchase(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}