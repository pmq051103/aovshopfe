import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSelector, useDispatch } from 'react-redux'
import { fetchMe } from '../../store/slices/authSlice'
import api from '../../api/axios'
import { formatCurrency, formatDate } from '../../utils/helpers'
import { Spinner, Pagination } from '../../components/common/UIComponents'
import toast from 'react-hot-toast'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCoins,
  faStar,
  faFire,
  faCheck,
  faMoneyBillWave,
  faBoxOpen,
  faClipboardList,
  faXmark,
  faGamepad,
  faPlus,
} from '@fortawesome/free-solid-svg-icons'

const STATUS_CONFIG = {
  PENDING: { label: 'Chờ xử lý', color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/30' },
  PROCESSING: { label: 'Đang xử lý', color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/30' },
  COMPLETED: { label: 'Hoàn thành', color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/30' },
  CANCELLED: { label: 'Đã hủy', color: 'text-white/40', bg: 'bg-white/5 border-white/10' },
}

function PackageCard({ pkg, onSelect, selected }) {
  const total = pkg.quanHuyAmount + pkg.bonusQuanHuy

  return (
    <motion.div
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(pkg)}
      className={`relative overflow-hidden rounded-3xl border transition-all duration-300 cursor-pointer group ${selected
          ? 'border-neon-pink bg-neon-pink/10 shadow-[0_0_40px_rgba(255,45,115,0.25)]'
          : 'border-white/10 bg-dark-700 hover:border-neon-pink/40'
        }`}
    >
      <div className="relative h-56 overflow-hidden">
        {pkg.imageUrl ? (
          <img
            src={pkg.imageUrl}
            alt={pkg.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-dark-600 flex items-center justify-center text-7xl text-yellow-400">
            <FontAwesomeIcon icon={faCoins} />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />

        <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
          {pkg.isBestValue && (
            <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-yellow-400 text-dark-900 flex items-center gap-1">
              <FontAwesomeIcon icon={faStar} />
              Tốt nhất
            </span>
          )}

          {pkg.isPopular && (
            <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-neon-pink text-white flex items-center gap-1">
              <FontAwesomeIcon icon={faFire} />
              HOT
            </span>
          )}

          {pkg.bonusQuanHuy > 0 && (
            <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-green-500 text-white flex items-center gap-1">
              <FontAwesomeIcon icon={faPlus} />
              {pkg.bonusQuanHuy} QH bonus
            </span>
          )}
        </div>

        {selected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-neon-pink text-white flex items-center justify-center"
          >
            <FontAwesomeIcon icon={faCheck} className="text-sm" />
          </motion.div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-gaming font-bold text-white text-lg mb-1 line-clamp-1">
            {pkg.name}
          </h3>

          {pkg.description && (
            <p className="text-white/60 text-sm line-clamp-2 mb-3">
              {pkg.description}
            </p>
          )}

          <div className="flex items-end justify-between">
            <div>
              <div className="text-3xl font-bold text-gradient-gold leading-none">
                {total.toLocaleString('vi-VN')}
              </div>

              <div className="text-yellow-400 text-sm mt-1 flex items-center gap-1">
                <FontAwesomeIcon icon={faCoins} />
                Quân Huy
              </div>
            </div>

            <div className="text-right">
              <div className="text-neon-pink font-bold text-lg">
                {formatCurrency(pkg.price)}
              </div>

              {pkg.bonusQuanHuy > 0 && (
                <div className="text-green-400 text-xs mt-1">
                  +{pkg.bonusQuanHuy} QH bonus
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function PurchaseModal({ pkg, onClose, onSuccess }) {
  const { user } = useSelector(s => s.auth)
  const [method, setMethod] = useState('')
  const [form, setForm] = useState({ gamePlayerId: '', gameServer: '', note: '' })
  const [loading, setLoading] = useState(false)

  const total = pkg.quanHuyAmount + pkg.bonusQuanHuy
  const canAffordMoney = parseFloat(user?.balance || 0) >= parseFloat(pkg.price)
  const canAffordQH = (user?.quanHuyBalance || 0) >= pkg.quanHuyAmount

  useEffect(() => {
    if (canAffordMoney) {
      setMethod('MONEY')
    } else if (canAffordQH) {
      setMethod('QUAN_HUY')
    } else {
      setMethod('')
    }
  }, [canAffordMoney, canAffordQH, pkg.id])

  const handleSubmit = async () => {
    if (!method) return toast.error('Số dư không đủ để nạp gói này')
    if (!form.gamePlayerId.trim()) return toast.error('Vui lòng nhập ID game')

    setLoading(true)
    try {
      const { data } = await api.post('/topup/orders', {
        packageId: pkg.id,
        gamePlayerId: form.gamePlayerId,
        gameServer: form.gameServer,
        note: form.note,
        paymentMethod: method,
      })

      toast.success('Tạo đơn nạp thành công! Admin sẽ xử lý sớm.')
      onSuccess(data.data)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi tạo đơn')
    } finally {
      setLoading(false)
    }
  }

  return (
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
        className="gaming-card border border-white/10 w-full max-w-md p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-gaming font-bold text-white text-lg flex items-center gap-2">
            <FontAwesomeIcon icon={faCoins} className="text-yellow-400" />
            Xác nhận nạp
          </h3>

          <button
            onClick={onClose}
            className="text-white/40 hover:text-white text-xl leading-none"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className="bg-dark-700 rounded-xl p-4 mb-5 border border-white/5">
          <p className="font-bold text-white mb-1">{pkg.name}</p>
          <p className="text-yellow-400 font-bold text-xl flex items-center gap-2">
            {total.toLocaleString('vi-VN')}
            <FontAwesomeIcon icon={faCoins} />
            Quân Huy
          </p>
        </div>

        <div className="mb-4">
          <label className="text-xs text-white/40 uppercase font-display block mb-2">
            Phương thức thanh toán
          </label>

          <div className="grid grid-cols-2 gap-2">
            {[
              {
                v: 'MONEY',
                icon: faMoneyBillWave,
                label: `Tiền (${formatCurrency(pkg.price)})`,
                ok: canAffordMoney,
              },
              {
                v: 'QUAN_HUY',
                icon: faCoins,
                label: `Quân Huy (${pkg.quanHuyAmount} QH)`,
                ok: canAffordQH,
              },
            ].map(m => (
              <button
                key={m.v}
                onClick={() => m.ok && setMethod(m.v)}
                disabled={!m.ok}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${method === m.v
                    ? 'border-neon-pink bg-neon-pink/10 text-neon-pink'
                    : m.ok
                      ? 'border-white/10 text-white/60 hover:border-white/30'
                      : 'border-white/5 text-white/20 cursor-not-allowed'
                  }`}
              >
                <span className="flex items-center justify-center gap-1">
                  <FontAwesomeIcon icon={m.icon} />
                  {m.label}
                </span>

                {!m.ok && (
                  <span className="block text-[10px] font-normal text-red-400/60 mt-0.5">
                    Không đủ
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3 mb-5">
          <div>
            <label className="text-xs text-white/40 uppercase font-display block mb-1.5">
              ID Player trong game *
            </label>
            <input
              value={form.gamePlayerId}
              onChange={e => setForm(p => ({ ...p, gamePlayerId: e.target.value }))}
              placeholder="Nhập ID game của bạn..."
              className="input-gaming text-sm py-2.5"
            />
          </div>

          <div>
            <label className="text-xs text-white/40 uppercase font-display block mb-1.5">
              Server không bắt buộc
            </label>
            <input
              value={form.gameServer}
              onChange={e => setForm(p => ({ ...p, gameServer: e.target.value }))}
              placeholder="VD: Máy chủ VN..."
              className="input-gaming text-sm py-2.5"
            />
          </div>

          <div>
            <label className="text-xs text-white/40 uppercase font-display block mb-1.5">
              Ghi chú
            </label>
            <textarea
              value={form.note}
              onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
              placeholder="Ghi chú thêm..."
              rows={2}
              className="input-gaming text-sm py-2 resize-none"
            />
          </div>
        </div>

        <div className="bg-dark-700 rounded-xl p-3 mb-5 text-xs space-y-1 border border-white/5">
          <div className="flex justify-between text-white/40">
            <span>Số dư tiền</span>
            <span className={canAffordMoney ? 'text-green-400' : 'text-red-400'}>
              {formatCurrency(user?.balance)}
            </span>
          </div>

          <div className="flex justify-between text-white/40">
            <span>Quân Huy</span>
            <span className={canAffordQH ? 'text-yellow-400' : 'text-red-400'}>
              {(user?.quanHuyBalance || 0).toLocaleString('vi-VN')} QH
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-neon flex-1 py-3 text-sm">
            Hủy
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading || !method}
            className="btn-primary flex-1 py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Spinner size="sm" color="white" />
            ) : (
              <>
                <FontAwesomeIcon icon={faCoins} />
                Xác nhận nạp
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function TopupPage() {
  const dispatch = useDispatch()
  const { user } = useSelector(s => s.auth)
  const [packages, setPackages] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [tab, setTab] = useState('packages')
  const [ordersPage, setOrdersPage] = useState(1)
  const [ordersTotal, setOrdersTotal] = useState(0)
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const ORDERS_PER_PAGE = 10

  const fetchOrders = async (page = 1) => {
    setOrdersLoading(true)
    try {
      const q = new URLSearchParams({ limit: ORDERS_PER_PAGE, page })
      if (filterStatus) q.append('status', filterStatus)
      if (filterFrom) q.append('fromDate', filterFrom)
      if (filterTo) q.append('toDate', filterTo)
      const { data } = await api.get(`/topup/orders/my?${q}`)
      setOrders(data.data || [])
      setOrdersTotal(data.pagination?.total || 0)
      setOrdersPage(page)
    } catch (e) {
      console.error(e)
    } finally {
      setOrdersLoading(false)
    }
  }

  useEffect(() => {
    Promise.all([
      api.get('/topup/packages').then(r => setPackages(r.data.data || [])),
      fetchOrders(1),
    ]).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (tab === 'orders') fetchOrders(1)
  }, [filterStatus, filterFrom, filterTo])

  const handleSuccess = async () => {
    setShowModal(false)
    setSelected(null)
    dispatch(fetchMe())
    await fetchOrders(1)
    setTab('orders')
  }

  if (loading) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="pt-20 pb-20 min-h-screen">
      <div className="page-container max-w-5xl">
        <div className="mb-8 flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-gaming text-3xl font-bold text-gradient mb-1 flex items-center gap-2">
              <FontAwesomeIcon icon={faCoins} className="text-yellow-400" />
              Nạp Quân Huy
            </h1>
            <p className="text-white/40 text-sm">
              Quân huy dùng để nạp game Liên Quân trực tiếp
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="gaming-card px-4 py-3 text-center border border-yellow-400/20">
              <div className="text-yellow-400 text-xs font-display uppercase mb-0.5">
                Quân Huy
              </div>
              <div className="text-yellow-400 font-bold text-lg flex items-center justify-center gap-2">
                {(user?.quanHuyBalance || 0).toLocaleString('vi-VN')}
                <FontAwesomeIcon icon={faCoins} />
              </div>
            </div>

            <div className="gaming-card px-4 py-3 text-center border border-neon-pink/20">
              <div className="text-neon-pink text-xs font-display uppercase mb-0.5">
                Số dư
              </div>
              <div className="text-neon-pink font-bold text-lg">
                {formatCurrency(user?.balance)}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {[
            { v: 'packages', icon: faBoxOpen, label: 'Gói nạp' },
            { v: 'orders', icon: faClipboardList, label: `Đơn của tôi (${orders.length})` },
          ].map(t => (
            <button
              key={t.v}
              onClick={() => setTab(t.v)}
              className={`px-5 py-2.5 rounded-xl font-display text-sm transition-all border flex items-center gap-2 ${tab === t.v
                  ? 'bg-neon-pink/20 border-neon-pink/50 text-neon-pink'
                  : 'border-white/10 text-white/50 hover:text-white hover:border-white/20'
                }`}
            >
              <FontAwesomeIcon icon={t.icon} />
              {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === 'packages' && (
            <motion.div
              key="packages"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {packages.map(pkg => (
                  <PackageCard
                    key={pkg.id}
                    pkg={pkg}
                    selected={selected?.id === pkg.id}
                    onSelect={setSelected}
                  />
                ))}

                {packages.length === 0 && (
                  <div className="col-span-full text-center py-16 text-white/30">
                    <div className="text-5xl mb-3 text-yellow-400">
                      <FontAwesomeIcon icon={faCoins} />
                    </div>
                    <p>Chưa có gói nạp nào</p>
                  </div>
                )}
              </div>

              {selected && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="sticky bottom-6 gaming-card border border-neon-pink/30 p-4 flex items-center justify-between gap-4 shadow-[0_0_40px_rgba(255,45,115,0.2)]"
                >
                  <div>
                    <p className="font-bold text-white">{selected.name}</p>
                    <p className="text-yellow-400 text-sm flex items-center gap-1">
                      {(selected.quanHuyAmount + selected.bonusQuanHuy).toLocaleString('vi-VN')}
                      <FontAwesomeIcon icon={faCoins} />
                      Quân Huy
                    </p>
                  </div>

                  <button
                    onClick={() => setShowModal(true)}
                    className="btn-primary px-6 py-3 text-sm whitespace-nowrap flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faCoins} />
                    Nạp ngay — {formatCurrency(selected.price)}
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {tab === 'orders' && (
            <motion.div
              key="orders"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {/* Bộ lọc */}
              <div className="gaming-card p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-white/40 uppercase font-display block mb-1">Trạng thái</label>
                    <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setOrdersPage(1) }} className="input-gaming text-sm py-2">
                      <option value="">Tất cả</option>
                      {Object.entries(STATUS_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-white/40 uppercase font-display block mb-1">Từ ngày</label>
                    <input type="date" value={filterFrom} onChange={e => { setFilterFrom(e.target.value); setOrdersPage(1) }} className="input-gaming text-sm py-2" />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 uppercase font-display block mb-1">Đến ngày</label>
                    <input type="date" value={filterTo} onChange={e => { setFilterTo(e.target.value); setOrdersPage(1) }} className="input-gaming text-sm py-2" />
                  </div>
                </div>
                {(filterStatus || filterFrom || filterTo) && (
                  <button onClick={() => { setFilterStatus(''); setFilterFrom(''); setFilterTo(''); setOrdersPage(1) }} className="mt-3 px-3 py-1.5 rounded-lg text-xs border border-red-500/30 text-red-400 hover:bg-red-500/10 flex items-center gap-1">
                    <FontAwesomeIcon icon={faXmark} /> Xóa bộ lọc
                  </button>
                )}
              </div>

              {ordersLoading ? (
                <div className="flex justify-center py-12"><Spinner size="lg" /></div>
              ) : orders.length === 0 ? (
                <div className="text-center py-16 text-white/30">
                  <div className="text-5xl mb-3">
                    <FontAwesomeIcon icon={faClipboardList} />
                  </div>
                  <p>Chưa có đơn nào</p>
                </div>
              ) : (
                <>
                  {orders.map(o => {
                    const s = STATUS_CONFIG[o.status] || STATUS_CONFIG.PENDING
                    const total = (o.package?.quanHuyAmount || 0) + (o.package?.bonusQuanHuy || 0)

                    return (
                      <div
                        key={o.id}
                        className="gaming-card border border-white/5 p-4 flex items-center gap-4"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-mono text-white/60 text-xs">
                              {o.orderCode}
                            </span>
                            <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full ${s.bg} ${s.color}`}>
                              {s.label}
                            </span>
                          </div>

                          <p className="font-bold text-white text-sm">
                            {o.package?.name}
                          </p>

                          <p className="text-white/40 text-xs mt-0.5">
                            ID:{' '}
                            <span className="text-white/60 font-mono">
                              {o.gamePlayerId}
                            </span>
                            {o.gameServer && <> · {o.gameServer}</>}
                          </p>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div className="text-yellow-400 font-bold flex items-center justify-end gap-1">
                            {total.toLocaleString('vi-VN')}
                            <FontAwesomeIcon icon={faCoins} />
                          </div>

                          <div className="text-white/30 text-xs">
                            {formatDate(o.createdAt)}
                          </div>

                          {o.paymentMethod && (
                            <div className="text-white/20 text-[10px] mt-0.5 flex items-center justify-end gap-1">
                              {o.paymentMethod === 'MONEY' ? (
                                <>
                                  <FontAwesomeIcon icon={faMoneyBillWave} />
                                  {formatCurrency(o.pricePaid)}
                                </>
                              ) : (
                                <>
                                  <FontAwesomeIcon icon={faCoins} />
                                  {o.quanHuyPaid} QH
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}

                  {/* Pagination */}
                  {ordersTotal > ORDERS_PER_PAGE && (
                    <div className="pt-2">
                      <Pagination
                        page={ordersPage}
                        pages={Math.ceil(ordersTotal / ORDERS_PER_PAGE)}
                        onPageChange={(p) => { setOrdersPage(p); fetchOrders(p) }}
                      />
                    </div>
                  )}

                  <div className="text-center text-white/20 text-xs pt-2">
                    Hiển thị {orders.length}/{ordersTotal} đơn
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showModal && selected && (
          <PurchaseModal
            pkg={selected}
            onClose={() => setShowModal(false)}
            onSuccess={handleSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  )
}