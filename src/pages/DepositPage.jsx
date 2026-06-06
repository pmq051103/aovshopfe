import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSelector } from 'react-redux'
import { useSiteSettings } from '../context/SiteSettingsContext'
import { io } from 'socket.io-client'
import QRCode from 'qrcode'
import api from '../api/axios'
import { formatCurrency, formatDate } from '../utils/helpers'
import { SectionHeader, Spinner, Pagination } from '../components/common/UIComponents'
import CardDepositTab from '../components/shop/CardDepositTab'
import toast from 'react-hot-toast'
import {
  faWallet,
  faGem,
  faMoneyBillWave,
  faQrcode,
  faCopy,
  faBolt,
  faCircleCheck,
  faCircleXmark,
  faHourglassHalf,
  faPlus,
  faClockRotateLeft,
  faRotateRight,
  faCreditCard,
} from '@fortawesome/free-solid-svg-icons'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

const QUICK_AMOUNTS = [50000, 100000, 200000, 500000, 1000000, 2000000]

function QRCanvas({ value }) {
  const canvasRef = useRef(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!value || !canvasRef.current) return
    setError(false)
    QRCode.toCanvas(canvasRef.current, value, {
      width: 208, margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    }, (err) => { if (err) setError(true) })
  }, [value])

  if (error) return <div className="w-52 h-52 mx-auto flex items-center justify-center text-red-400 text-xs">Lỗi tạo QR</div>
  return <canvas ref={canvasRef} className="mx-auto rounded-xl" style={{ width: 208, height: 208 }} />
}

export default function DepositPage() {
  const { user } = useSelector(s => s.auth)
  const { settings: siteSettings } = useSiteSettings()
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [deposit, setDeposit] = useState(null)
  const [history, setHistory] = useState([])
  const [historyPage, setHistoryPage] = useState(1)
  const [historyTotal, setHistoryTotal] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const [activeTab, setActiveTab] = useState('bank') // 'bank' | 'card'
  const countdownRef = useRef(null)
  // Ref lưu depositId đang chờ để socket handler nhận được
  const pendingDepositIdRef = useRef(null)

  useEffect(() => {
    fetchHistory()
  }, [historyPage])

  // Lắng nghe socket deposit:success — cập nhật tức thì không cần polling
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    const socket = io(import.meta.env.VITE_SOCKET_URL || '', {
      auth: { token },
      transports: ['websocket', 'polling'],
    })

    socket.on('deposit:success', (data) => {
      // Chỉ xử lý nếu đang có lệnh nạp đang chờ
      if (pendingDepositIdRef.current) {
        clearInterval(countdownRef.current)
        setDeposit(prev => prev ? { ...prev, status: 'COMPLETED' } : prev)
        pendingDepositIdRef.current = null
        fetchHistory()
        // Toast đã được show từ useSocket global, không toast lại ở đây
      }
    })

    return () => {
      socket.disconnect()
      clearInterval(countdownRef.current)
    }
  }, [])

  const fetchHistory = async () => {
    try {
      const { data } = await api.get(`/deposit/history?page=${historyPage}&limit=10`)
      setHistory(data.data || [])
      setHistoryTotal(data.pagination?.total || 0)
    } catch (e) { }
  }

  const startCountdown = (expiredAt) => {
    clearInterval(countdownRef.current)
    const update = () => {
      const remaining = Math.max(0, new Date(expiredAt) - Date.now())
      setCountdown(remaining)
      if (remaining === 0) {
        clearInterval(countdownRef.current)
        setDeposit(prev => prev?.status === 'PENDING' ? { ...prev, status: 'EXPIRED' } : prev)
        pendingDepositIdRef.current = null
      }
    }
    update()
    countdownRef.current = setInterval(update, 1000)
  }

  const handleCreateDeposit = async (e) => {
    e.preventDefault()
    const num = parseFloat(amount)
    if (!num || num < 10000) { toast.error('Số tiền tối thiểu 10,000đ'); return }
    if (num > 50000000) { toast.error('Số tiền tối đa 50,000,000đ'); return }

    setLoading(true)
    try {
      const { data } = await api.post('/deposit', { amount: num })
      setDeposit(data.data)
      pendingDepositIdRef.current = data.data.id  // đánh dấu đang chờ
      startCountdown(data.data.expiredAt)
      toast.success('Tạo lệnh nạp tiền thành công!')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi tạo lệnh nạp tiền')
    } finally {
      setLoading(false)
    }
  }

  const formatCountdown = (ms) => {
    const t = Math.floor(ms / 1000)
    return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
  }

  const copy = (v) => { navigator.clipboard.writeText(String(v)); toast.success('Đã sao chép!') }

  const statusColor = { PENDING: 'text-yellow-400', COMPLETED: 'text-neon-green', FAILED: 'text-red-400', EXPIRED: 'text-white/40' }
  const statusLabel = {
    PENDING: 'Chờ thanh toán',
    COMPLETED: 'Thành công',
    FAILED: 'Thất bại',
    EXPIRED: 'Hết hạn'
  }

  const qrString = deposit?.qrCode || deposit?.qrCodeUrl || ''
  const hasQR = qrString && qrString.length > 10

  return (
    <div className="pt-20 pb-20 min-h-screen">
      <div className="page-container max-w-4xl">
        <SectionHeader
          title={
            <>
              <FontAwesomeIcon icon={faWallet} className="mr-3" />
              Nạp Tiền
            </>
          } subtitle="Nạp tiền qua QR PAY — Tự động xác nhận, an toàn, tức thì" />

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/10 mb-6">
          {[
            { id: 'bank', icon: faMoneyBillWave, label: 'Chuyển Khoản' },
            ...(siteSettings.show_card_deposit !== 'false'
              ? [{ id: 'card', icon: faCreditCard, label: 'Thẻ Cào' }]
              : []),
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-t-lg font-display font-bold text-sm transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-neon-pink/20 text-neon-pink border-b-2 border-neon-pink'
                  : 'text-white/40 hover:text-white'
              }`}
            >
              <FontAwesomeIcon icon={tab.icon} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: Thẻ cào */}
        {activeTab === 'card' && siteSettings.show_card_deposit !== 'false' && <CardDepositTab />}

        {/* Tab: Chuyển khoản */}
        {activeTab === 'bank' && (<>

        {/* Balance */}
        <div className="gaming-card p-5 border-yellow-500/20 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FontAwesomeIcon
              icon={faGem}
              className="text-3xl text-yellow-400"
            />
            <div>
              <div className="text-white/40 text-xs">Số dư hiện tại</div>
              <div className="font-gaming text-2xl font-bold text-yellow-400">{formatCurrency(user?.balance)}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-white/40 text-xs">Tổng đã nạp</div>
            <div className="font-bold text-white">{formatCurrency(user?.totalDeposit)}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Form */}
          <div>
            <h2 className="font-gaming text-lg font-bold text-gradient mb-5">Tạo Lệnh Nạp Tiền</h2>
            <form onSubmit={handleCreateDeposit} className="space-y-5">
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider font-display block mb-2">Số tiền nạp</label>
                <input
                  type="number" value={amount} onChange={e => setAmount(e.target.value)}
                  placeholder="Nhập số tiền..." min="10000" max="50000000"
                  className="input-gaming text-lg font-bold"
                />
                {amount && parseFloat(amount) > 0 && (
                  <div className="text-neon-pink text-sm mt-1 font-medium">{formatCurrency(parseFloat(amount))}</div>
                )}
              </div>

              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider font-display block mb-2">Chọn nhanh</label>
                <div className="grid grid-cols-3 gap-2">
                  {QUICK_AMOUNTS.map(a => (
                    <button key={a} type="button" onClick={() => setAmount(String(a))}
                      className={`py-2 rounded-lg text-sm font-display font-bold transition-all border ${parseFloat(amount) === a
                        ? 'bg-neon-pink/20 border-neon-pink/50 text-neon-pink'
                        : 'bg-dark-600 border-white/10 text-white/60 hover:text-white hover:border-white/20'
                        }`}>{formatCurrency(a)}</button>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={loading || !amount}
                className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? <><Spinner size="sm" color="white" />Đang tạo...</> : <>
                  <FontAwesomeIcon icon={faQrcode} className="mr-2" />
                  Tạo Mã QR Thanh Toán
                </>}
              </button>

              <div className="text-white/30 text-xs space-y-1">
                <div>✓ Tối thiểu: 10,000đ | Tối đa: 50,000,000đ</div>
                <div>✓ Tiền vào tài khoản <strong className="text-white/50">tức thì</strong> sau khi thanh toán</div>
                <div>✓ QR code hết hạn sau 30 phút</div>
                <div>✓ Hỗ trợ tất cả app ngân hàng & ví điện tử</div>
              </div>
            </form>
          </div>

          {/* QR */}
          <div>
            <h2 className="font-gaming text-lg font-bold text-gradient mb-5">Thông Tin Thanh Toán</h2>
            <AnimatePresence mode="wait">
              {!deposit ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="gaming-card p-8 text-center border-dashed border-white/10">
                  <div className="text-6xl mb-3 opacity-30"><FontAwesomeIcon
                    icon={faQrcode}
                    className="text-6xl mb-3 opacity-30"
                  /></div>
                  <div className="text-white/30 text-sm">Tạo lệnh nạp tiền để hiển thị mã QR</div>
                </motion.div>
              ) : (
                <motion.div key="deposit" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                  {/* Status */}
                  <div className={`gaming-card p-3 text-center font-display font-bold text-lg flex items-center justify-center gap-2 ${statusColor[deposit.status]}`}>
                    {deposit.status === 'PENDING' && (
                      <FontAwesomeIcon icon={faHourglassHalf} />
                    )}

                    {deposit.status === 'COMPLETED' && (
                      <FontAwesomeIcon icon={faCircleCheck} />
                    )}

                    {deposit.status === 'FAILED' && (
                      <FontAwesomeIcon icon={faCircleXmark} />
                    )}

                    {deposit.status === 'EXPIRED' && (
                      <FontAwesomeIcon icon={faClockRotateLeft} />
                    )}

                    <span>{statusLabel[deposit.status]}</span>
                    {deposit.status === 'PENDING' && countdown > 0 && (
                      <span className="ml-2 text-white/50 text-sm">— {formatCountdown(countdown)}</span>
                    )}
                  </div>

                  {deposit.status === 'PENDING' && (
                    <>
                      <div className="gaming-card p-4 text-center bg-white/5">
                        {hasQR ? (
                          <>
                            <div className="bg-white rounded-xl p-2 inline-block">
                              <QRCanvas value={qrString} />
                            </div>
                            <p className="text-white/40 text-xs mt-2">Quét QR bằng app ngân hàng hoặc ví điện tử</p>
                          </>
                        ) : (
                          <div className="w-52 h-52 mx-auto flex items-center justify-center">
                            <Spinner size="lg" />
                          </div>
                        )}
                      </div>

                      <div className="gaming-card p-4 space-y-3">
                        {[
                          ['Ngân hàng', [deposit.bin, deposit.accountNumber].filter(Boolean).join(' - ') || 'PayOS'],
                          ['Tên chủ TK', deposit.accountName || '—'],
                          ['Số tiền', formatCurrency(deposit.amount)],
                          ['Nội dung CK', deposit.description || deposit.transferContent],
                        ].map(([k, v]) => (
                          <div key={k} className="flex items-center justify-between gap-2">
                            <span className="text-white/40 text-sm shrink-0">{k}</span>
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-mono font-bold text-white text-sm truncate">{v}</span>
                              <button onClick={() => copy(v)} className="text-neon-pink text-xs shrink-0">
                                <FontAwesomeIcon icon={faCopy} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="text-green-400/80 text-xs gaming-card p-3 bg-green-500/5 border-green-500/20">
                        <FontAwesomeIcon icon={faBolt} className="mr-1" /> <strong>Tự động tức thì:</strong> Tiền cộng ngay sau khi thanh toán — không cần chờ.
                      </div>
                    </>
                  )}

                  {deposit.status === 'COMPLETED' && (
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      className="gaming-card p-8 text-center border-neon-green/30 bg-neon-green/5">
                      <div className="text-6xl mb-3">
                        <FontAwesomeIcon icon={faCircleCheck} className="text-green-400" />
                      </div>
                      <div className="font-gaming text-xl font-bold text-neon-green mb-2">Nạp Tiền Thành Công!</div>
                      <div className="text-white/60">+{formatCurrency(deposit.amount)} đã được cộng vào tài khoản</div>
                    </motion.div>
                  )}

                  {deposit.status === 'FAILED' && (
                    <div className="gaming-card p-8 text-center border-red-500/30 bg-red-500/5">
                      <div className="text-6xl mb-3"><FontAwesomeIcon
                        icon={faCircleXmark}
                        className="text-6xl mb-3 text-red-400"
                      /></div>
                      <div className="font-gaming text-xl font-bold text-red-400 mb-2">Thanh Toán Thất Bại</div>
                      <div className="text-white/60 text-sm">Vui lòng thử lại hoặc liên hệ hỗ trợ</div>
                    </div>
                  )}

                  {deposit.status === 'EXPIRED' && (
                    <div className="gaming-card p-6 text-center border-white/10">
                      <div className="text-4xl mb-2"><FontAwesomeIcon icon={faClockRotateLeft} className="text-4xl mb-2" /></div>
                      <div className="text-white/40 text-sm">QR đã hết hạn — tạo lệnh mới để thanh toán</div>
                    </div>
                  )}

                  <button onClick={() => {
                    setDeposit(null); setAmount('')
                    clearInterval(countdownRef.current)
                    pendingDepositIdRef.current = null
                  }} className="btn-neon w-full py-2.5 text-sm"><FontAwesomeIcon icon={faRotateRight} className="mr-2" />Tạo Lệnh Mới</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* History */}
        <div className="gaming-card p-6">
          <h3 className="font-gaming text-lg font-bold text-gradient mb-5"><FontAwesomeIcon icon={faClockRotateLeft} className="mr-2" />Lịch Sử Nạp Tiền</h3>
          {history.length === 0 ? (
            <div className="text-center py-8 text-white/30">Chưa có lịch sử nạp tiền</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-white/40 text-xs uppercase tracking-wider border-b border-white/5">
                    <th className="text-left py-3 pr-4">Thời gian</th>
                    <th className="text-right pr-4">Số tiền</th>
                    <th className="text-left pr-4">Nội dung</th>
                    <th className="text-right">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(d => (
                    <tr key={d.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                      <td className="py-3 pr-4 text-white/50 text-xs">{formatDate(d.createdAt)}</td>
                      <td className="text-right pr-4 font-bold text-neon-green">{formatCurrency(d.amount)}</td>
                      <td className="pr-4 font-mono text-xs text-white/40">{d.transferContent}</td>
                      <td className={`text-right text-xs font-bold ${statusColor[d.status]}`}>{statusLabel[d.status]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination page={historyPage} pages={Math.ceil(historyTotal / 10)} onPageChange={setHistoryPage} />
            </div>
          )}
        </div>
      </>)}
      </div>
    </div>
  )
}