import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBolt,
  faXmark,
  faUser,
  faCoins,
  faMoneyBillWave,
  faRotate,
  faCheck,
  faBan,
  faCamera,
  faFloppyDisk,
  faPlus,
  faStar,
  faFire,
  faBox,
  faClipboardList,
  faSearch,
  faPen,
  faTrash,
} from '@fortawesome/free-solid-svg-icons'

import api from '../../api/axios'
import { formatCurrency, formatDate } from '../../utils/helpers'
import { Spinner } from '../../components/common/UIComponents'
import toast from 'react-hot-toast'

const STATUS_CONFIG = {
  PENDING: { label: 'Chờ xử lý', color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/30' },
  PROCESSING: { label: 'Đang xử lý', color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/30' },
  COMPLETED: { label: 'Hoàn thành', color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/30' },
  CANCELLED: { label: 'Đã hủy', color: 'text-white/40', bg: 'bg-white/5 border-white/10' },
}

function OrderDetailModal({ order, onClose, onRefresh }) {
  const [adminNote, setAdminNote] = useState(order.adminNote || '')
  const [loading, setLoading] = useState(null)
  const total = (order.package?.quanHuyAmount || 0) + (order.package?.bonusQuanHuy || 0)

  const action = async (type) => {
  setLoading(type)

  try {
    if (type === 'process') {
      await api.put(`/topup/admin/orders/${order.id}/process`)
      toast.success('Đã chuyển đơn sang trạng thái đang xử lý')
    } else if (type === 'complete') {
      await api.put(`/topup/admin/orders/${order.id}/complete`, { adminNote })
      toast.success('Đã xác nhận nạp Quân Huy thành công')
    } else if (type === 'cancel') {
      await api.put(`/topup/admin/orders/${order.id}/cancel`, { adminNote })
      toast.success('Đã hủy đơn nạp và hoàn tiền')
    }

    await onRefresh()
    onClose()
  } catch (e) {
    toast.error(e.response?.data?.message || 'Lỗi')
  } finally {
    setLoading(null)
  }
}

  const s = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING

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
        className="gaming-card border border-white/10 w-full max-w-lg p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-gaming font-bold text-white">Chi tiết đơn nạp</h3>
            <p className="text-white/40 text-xs font-mono">{order.orderCode}</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white text-xl leading-none">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className="space-y-3 mb-5">
          <div className="flex items-center gap-3 bg-dark-700 rounded-xl p-3 border border-white/5">
            <div className="w-9 h-9 rounded-full bg-neon-pink/20 flex items-center justify-center text-sm font-bold text-neon-pink">
              {order.user?.username?.[0]?.toUpperCase() || <FontAwesomeIcon icon={faUser} />}
            </div>
            <div>
              <p className="font-bold text-white text-sm">{order.user?.displayName || order.user?.username}</p>
              <p className="text-white/40 text-xs flex items-center gap-1">
                {order.user?.email} · <FontAwesomeIcon icon={faBolt} /> {order.user?.quanHuyBalance?.toLocaleString('vi-VN') || 0} QH
              </p>
            </div>
            <span className={`ml-auto text-xs font-bold border px-2 py-0.5 rounded-full ${s.bg} ${s.color}`}>
              {s.label}
            </span>
          </div>

          <div className="bg-dark-700 rounded-xl p-3 border border-white/5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white/40 text-xs mb-0.5">Gói nạp</p>
                <p className="font-bold text-white">{order.package?.name}</p>
              </div>
              <div className="text-right">
                <p className="text-yellow-400 font-bold flex items-center gap-1 justify-end">
                  {total.toLocaleString('vi-VN')} <FontAwesomeIcon icon={faBolt} /> QH
                </p>
                <p className="text-white/30 text-xs flex items-center gap-1 justify-end">
                  {order.paymentMethod === 'MONEY' ? (
                    <>
                      <FontAwesomeIcon icon={faMoneyBillWave} />
                      {formatCurrency(order.pricePaid)}
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faBolt} />
                      {order.quanHuyPaid?.toLocaleString('vi-VN')} QH
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-dark-700 rounded-xl p-3 border border-white/5">
              <p className="text-white/40 text-xs mb-1">ID Player</p>
              <p className="font-mono font-bold text-white text-sm">{order.gamePlayerId}</p>
            </div>
            {order.gameServer && (
              <div className="bg-dark-700 rounded-xl p-3 border border-white/5">
                <p className="text-white/40 text-xs mb-1">Server</p>
                <p className="font-bold text-white text-sm">{order.gameServer}</p>
              </div>
            )}
          </div>

          {order.note && (
            <div className="bg-dark-700 rounded-xl p-3 border border-white/5">
              <p className="text-white/40 text-xs mb-1">Ghi chú user</p>
              <p className="text-white text-sm">{order.note}</p>
            </div>
          )}

          <div>
            <label className="text-xs text-white/40 uppercase font-display block mb-1.5">Ghi chú admin</label>
            <textarea
              value={adminNote}
              onChange={e => setAdminNote(e.target.value)}
              placeholder="Ghi chú nội bộ..."
              rows={2}
              className="input-gaming text-sm py-2 resize-none w-full"
            />
          </div>

          <div className="text-xs text-white/30">Tạo lúc: {formatDate(order.createdAt)}</div>
        </div>

        {['PENDING', 'PROCESSING'].includes(order.status) && (
          <div className="flex gap-2 flex-wrap">
            {order.status === 'PENDING' && (
              <button
                onClick={() => action('process')}
                disabled={loading === 'process'}
                className="flex-1 btn-neon py-2.5 text-sm flex items-center justify-center gap-2"
              >
                {loading === 'process' ? <Spinner size="sm" color="white" /> : <><FontAwesomeIcon icon={faRotate} /> Đang xử lý</>}
              </button>
            )}
            <button
              onClick={() => action('complete')}
              disabled={loading === 'complete'}
              className="flex-1 btn-primary py-2.5 text-sm flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400"
            >
              {loading === 'complete' ? <Spinner size="sm" color="white" /> : <><FontAwesomeIcon icon={faCheck} /> Hoàn thành</>}
            </button>
            <button
              onClick={() => action('cancel')}
              disabled={loading === 'cancel'}
              className="px-4 py-2.5 rounded-xl text-sm text-red-400 border border-red-400/30 hover:bg-red-400/10 transition-all flex items-center gap-2"
            >
              {loading === 'cancel' ? <Spinner size="sm" color="white" /> : <><FontAwesomeIcon icon={faBan} /> Hủy</>}
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

function PackageForm({ pkg, onClose, onSaved }) {
  const isEdit = !!pkg?.id
  const [form, setForm] = useState({
    name: pkg?.name || '',
    description: pkg?.description || '',
    quanHuyAmount: pkg?.quanHuyAmount || '',
    bonusQuanHuy: pkg?.bonusQuanHuy || 0,
    price: pkg?.price || '',
    isActive: pkg?.isActive ?? true,
    sortOrder: pkg?.sortOrder || 0,
    isBestValue: pkg?.isBestValue || false,
    isPopular: pkg?.isPopular || false,
    imageUrl: pkg?.imageUrl || '',
  })
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef(null)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(pkg?.imageUrl || '')

  const save = async () => {
    if (!form.name || !form.quanHuyAmount || !form.price) {
      return toast.error('Vui lòng điền đủ thông tin')
    }

    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => {
        if (k !== 'imageUrl' && v !== null && v !== undefined) fd.append(k, v)
      })

      if (imageFile) fd.append('image', imageFile)

      if (isEdit) {
        await api.put(`/topup/admin/packages/${pkg.id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      } else {
        await api.post('/topup/admin/packages', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }

      toast.success(isEdit ? 'Đã cập nhật' : 'Đã tạo gói mới')
      onSaved()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi')
    } finally {
      setLoading(false)
    }
  }

  const toggle = (k) => setForm(p => ({ ...p, [k]: !p[k] }))

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="gaming-card border border-white/10 w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-gaming font-bold text-white">{isEdit ? 'Chỉnh sửa' : 'Tạo'} gói nạp</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white text-xl leading-none">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-white/40 uppercase font-display block mb-1.5">Tên gói *</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="input-gaming" placeholder="VD: Gói 100 Quân Huy" />
          </div>

          <div>
            <label className="text-xs text-white/40 uppercase font-display block mb-1.5">Mô tả</label>
            <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="input-gaming" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-white/40 uppercase font-display block mb-1.5">Quân Huy *</label>
              <input type="number" value={form.quanHuyAmount} onChange={e => setForm(p => ({ ...p, quanHuyAmount: e.target.value }))} className="input-gaming" />
            </div>
            <div>
              <label className="text-xs text-white/40 uppercase font-display block mb-1.5">Bonus QH</label>
              <input type="number" value={form.bonusQuanHuy} onChange={e => setForm(p => ({ ...p, bonusQuanHuy: e.target.value }))} className="input-gaming" />
            </div>
            <div>
              <label className="text-xs text-white/40 uppercase font-display block mb-1.5">Giá (đ) *</label>
              <input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} className="input-gaming" />
            </div>
          </div>

          <div>
            <label className="text-xs text-white/40 uppercase font-display block mb-1.5">Ảnh gói nạp</label>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-white/20 rounded-xl p-4 text-center cursor-pointer hover:border-neon-pink/50 transition-colors"
            >
              {imagePreview ? (
                <div className="flex items-center justify-center">
                  <img src={imagePreview} alt="" className="w-28 h-28 rounded-xl object-cover border border-white/10" />
                </div>
              ) : (
                <div className="py-4">
                  <FontAwesomeIcon icon={faCamera} className="text-3xl mb-2 text-white/40" />
                  <p className="text-white/40 text-sm">Click để chọn ảnh gói nạp</p>
                  <p className="text-white/20 text-xs mt-1">JPG, PNG, WebP</p>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0]
                if (!file) return
                setImageFile(file)
                setImagePreview(URL.createObjectURL(file))
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/40 uppercase font-display block mb-1.5">Thứ tự</label>
              <input type="number" value={form.sortOrder} onChange={e => setForm(p => ({ ...p, sortOrder: e.target.value }))} className="input-gaming" />
            </div>
          </div>

          <div className="flex gap-4 flex-wrap">
            {[
              ['isActive', 'Kích hoạt', faCheck],
              ['isBestValue', 'Best Value', faStar],
              ['isPopular', 'Phổ biến', faFire],
            ].map(([k, l, icon]) => (
              <label key={k} className="flex items-center gap-2 cursor-pointer">
                <div onClick={() => toggle(k)} className={`w-10 h-5 rounded-full relative transition-colors ${form[k] ? 'bg-neon-pink' : 'bg-dark-600'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${form[k] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-white/60 text-sm flex items-center gap-1.5">
                  <FontAwesomeIcon icon={icon} />
                  {l}
                </span>
              </label>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="btn-neon flex-1 py-3 text-sm">Hủy</button>
            <button onClick={save} disabled={loading} className="btn-primary flex-1 py-3 text-sm flex items-center justify-center gap-2">
              {loading ? <Spinner size="sm" color="white" /> : isEdit ? <><FontAwesomeIcon icon={faFloppyDisk} /> Lưu</> : <><FontAwesomeIcon icon={faPlus} /> Tạo</>}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function AdminTopup() {
  const [tab, setTab] = useState('orders')
  const [orders, setOrders] = useState([])
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [packageForm, setPackageForm] = useState(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    const q = new URLSearchParams({ limit: 10 })
    if (statusFilter) q.append('status', statusFilter)
    if (search) q.append('search', search)
    const { data } = await api.get(`/topup/admin/orders?${q}`)
    setOrders(data.data || [])
    setLoading(false)
  }, [statusFilter, search])

  const fetchPackages = useCallback(async () => {
    const { data } = await api.get('/topup/admin/packages')
    setPackages(data.data || [])
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])
  useEffect(() => { fetchPackages() }, [fetchPackages])

  const deletePackage = async (id) => {
    if (!confirm('Xóa gói này?')) return
    await api.delete(`/topup/admin/packages/${id}`)
    fetchPackages()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-gaming text-2xl font-bold text-gradient flex items-center gap-2">
            <FontAwesomeIcon icon={faBolt} />
            Quản lý Quân Huy
          </h1>
          <p className="text-white/40 text-sm">Đơn nạp game và gói Quân Huy</p>
        </div>
      </div>

      <div className="flex gap-2">
        {[
          { v: 'orders', label: `Đơn nạp (${orders.length})`, icon: faClipboardList },
          { v: 'packages', label: `Gói nạp (${packages.length})`, icon: faBox },
        ].map(t => (
          <button
            key={t.v}
            onClick={() => setTab(t.v)}
            className={`px-5 py-2.5 rounded-xl font-display text-sm transition-all border flex items-center gap-2 ${
              tab === t.v
                ? 'bg-neon-pink/20 border-neon-pink/50 text-neon-pink'
                : 'border-white/10 text-white/50 hover:text-white'
            }`}
          >
            <FontAwesomeIcon icon={t.icon} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'orders' && (
        <>
          <div className="flex gap-3 flex-wrap items-center">
  <div className="relative w-72">
    <FontAwesomeIcon
      icon={faSearch}
      className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-xs"
    />
    <input
      value={search}
      onChange={e => setSearch(e.target.value)}
      placeholder="Tìm user, ID game, mã đơn..."
      className="input-gaming w-full text-sm py-2.5 pl-9"
    />
  </div>

  <select
    value={statusFilter}
    onChange={e => setStatusFilter(e.target.value)}
    className="input-gaming w-48 text-sm py-2.5 pr-8"
  >
    <option value="">Tất cả trạng thái</option>
    {Object.entries(STATUS_CONFIG).map(([v, c]) => (
      <option key={v} value={v}>
        {c.label}
      </option>
    ))}
  </select>
</div>

          {loading ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : (
            <div className="space-y-2">
              {orders.length === 0 ? (
                <div className="text-center py-16 text-white/30">
                  <FontAwesomeIcon icon={faClipboardList} className="text-5xl mb-3" />
                  <p>Chưa có đơn nào</p>
                </div>
              ) : orders.map(o => {
                const s = STATUS_CONFIG[o.status] || STATUS_CONFIG.PENDING
                const total = (o.package?.quanHuyAmount || 0) + (o.package?.bonusQuanHuy || 0)
                return (
                  <div
                    key={o.id}
                    onClick={() => setSelectedOrder(o)}
                    className="gaming-card border border-white/5 p-4 flex items-center gap-4 cursor-pointer hover:border-neon-pink/20 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-neon-pink/20 flex items-center justify-center text-sm font-bold text-neon-pink flex-shrink-0">
                      {o.user?.username?.[0]?.toUpperCase() || <FontAwesomeIcon icon={faUser} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="font-mono text-white/50 text-xs">{o.orderCode}</span>
                        <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full ${s.bg} ${s.color}`}>{s.label}</span>
                      </div>
                      <p className="font-bold text-white text-sm truncate">{o.user?.displayName || o.user?.username}</p>
                      <p className="text-white/40 text-xs">ID: <span className="font-mono text-white/60">{o.gamePlayerId}</span> · {o.package?.name}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-yellow-400 font-bold flex items-center gap-1 justify-end">
                        {total.toLocaleString('vi-VN')} <FontAwesomeIcon icon={faBolt} />
                      </div>
                      <div className="text-white/30 text-xs">{formatDate(o.createdAt)}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {tab === 'packages' && (
        <>
          <div className="flex justify-end">
            <button onClick={() => setPackageForm({})} className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2">
              <FontAwesomeIcon icon={faPlus} />
              Tạo gói mới
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {packages.map(pkg => (
              <div key={pkg.id} className="gaming-card border border-white/10 p-4 relative">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-dark-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {pkg.imageUrl ? <img src={pkg.imageUrl} alt="" className="w-full h-full object-cover" /> : <FontAwesomeIcon icon={faBolt} className="text-xl text-yellow-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm truncate">{pkg.name}</p>
                    <p className="text-yellow-400 text-xs">{(pkg.quanHuyAmount + pkg.bonusQuanHuy).toLocaleString('vi-VN')} QH</p>
                    <p className="text-neon-pink text-xs">{formatCurrency(pkg.price)}</p>
                  </div>
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${pkg.isActive ? 'bg-green-400' : 'bg-white/20'}`} />
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setPackageForm(pkg)} className="flex-1 text-xs border border-white/10 py-2 rounded-lg hover:border-white/30 text-white/60 hover:text-white transition-all flex items-center justify-center gap-1.5">
                    <FontAwesomeIcon icon={faPen} />
                    Sửa
                  </button>
                  <button onClick={() => deletePackage(pkg.id)} className="px-3 text-xs border border-red-400/20 py-2 rounded-lg hover:bg-red-400/10 text-red-400/60 hover:text-red-400 transition-all">
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <AnimatePresence>
        {selectedOrder && <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} onRefresh={fetchOrders} />}
        {packageForm !== null && <PackageForm pkg={packageForm} onClose={() => setPackageForm(null)} onSaved={() => { setPackageForm(null); fetchPackages() }} />}
      </AnimatePresence>
    </div>
  )
}