import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import api from '../../api/axios'
import { formatCurrency, formatDate } from '../../utils/helpers'
import {
  Modal,
  Spinner,
  Pagination,
  EmptyState,
} from '../../components/common/UIComponents'
import toast from 'react-hot-toast'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faTags,
  faPercent,
  faMoneyBillWave,
  faDice,
  faRotateLeft,
  faPlus,
  faSearch,
  faPen,
  faTrash,
  faFloppyDisk,
  faWandMagicSparkles,
  faCalendarAlt,
  faUsers,
  faInfoCircle,
} from '@fortawesome/free-solid-svg-icons'

const TYPE_LABELS = {
  PERCENT: '% Giảm phần trăm',
  FIXED: 'Giảm cố định',
  FREE_SPIN: 'Tặng lượt quay',
  CASHBACK: 'Hoàn tiền',
}

const TYPE_ICONS = {
  PERCENT: faPercent,
  FIXED: faMoneyBillWave,
  FREE_SPIN: faDice,
  CASHBACK: faRotateLeft,
}

const defaultForm = {
  code: '',
  name: '',
  type: 'PERCENT',
  value: '',
  minPurchase: '0',
  maxDiscount: '',
  usageLimit: '100',
  perUserLimit: '1',
  isActive: true,
  startDate: '',
  endDate: '',
  description: '',
}

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchCoupons()
  }, [page, search])

  const fetchCoupons = async () => {
    setLoading(true)
    try {
      const q = new URLSearchParams({
        page,
        limit: 10,
        ...(search && { search }),
      })
      const { data } = await api.get(`/coupons/admin?${q}`)
      setCoupons(data.data || [])
      setTotal(data.pagination?.total || 0)
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditing(null)
    setForm(defaultForm)
    setShowModal(true)
  }

  const openEdit = c => {
    setEditing(c)
    setForm({
      code: c.code,
      name: c.name,
      type: c.type,
      value: c.value.toString(),
      minPurchase: c.minPurchase.toString(),
      maxDiscount: c.maxDiscount?.toString() || '',
      usageLimit: c.usageLimit.toString(),
      perUserLimit: c.perUserLimit.toString(),
      isActive: c.isActive,
      startDate: c.startDate ? c.startDate.slice(0, 16) : '',
      endDate: c.endDate ? c.endDate.slice(0, 16) : '',
      description: c.description || '',
    })
    setShowModal(true)
  }

  const handleSave = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        await api.put(`/coupons/admin/${editing.id}`, form)
        toast.success('Cập nhật coupon!')
      } else {
        await api.post('/coupons/admin', form)
        toast.success('Tạo coupon mới!')
      }
      setShowModal(false)
      fetchCoupons()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi lưu')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async id => {
    if (!confirm('Xóa coupon?')) return
    try {
      await api.delete(`/coupons/admin/${id}`)
      toast.success('Đã xóa')
      fetchCoupons()
    } catch (e) {
      toast.error('Lỗi')
    }
  }

  const genCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const code = Array.from(
      { length: 10 },
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join('')
    setForm(p => ({ ...p, code }))
  }

  const setField = field => e => setForm(p => ({ ...p, [field]: e.target.value }))

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-gaming text-xl font-bold text-gradient flex items-center gap-2">
            <FontAwesomeIcon icon={faTags} />
            Quản Lý Coupon
          </h1>
          <p className="text-white/40 text-sm">{total} coupon</p>
        </div>
        <button
          onClick={openCreate}
          className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faPlus} />
          Tạo Coupon
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative max-w-xs">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">
            <FontAwesomeIcon icon={faSearch} />
          </span>
          <input
            value={search}
            onChange={e => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Tìm theo code, tên..."
            className="input-gaming text-sm py-2 max-w-xs pl-9"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : coupons.length === 0 ? (
        <EmptyState
          icon={<FontAwesomeIcon icon={faTags} />}
          title="Không có coupon"
          action={
            <button
              onClick={openCreate}
              className="btn-primary text-sm px-6 py-2.5 flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faPlus} />
              Tạo Coupon
            </button>
          }
        />
      ) : (
        <div className="gaming-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-xs text-white/40 uppercase">
                  <th className="text-left p-4">Code</th>
                  <th className="text-left p-4">Tên</th>
                  <th className="text-center p-4">Loại</th>
                  <th className="text-right p-4">Giá trị</th>
                  <th className="text-right p-4">Đơn tối thiểu</th>
                  <th className="text-center p-4">Lượt dùng</th>
                  <th className="text-center p-4">Mỗi user</th>
                  <th className="text-center p-4">Ngày bắt đầu</th>
                  <th className="text-center p-4">Hạn</th>
                  <th className="text-center p-4">Status</th>
                  <th className="text-right p-4">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map(c => {
                  const isExpired = c.endDate && new Date(c.endDate) < new Date()
                  const isFull = c.usageCount >= c.usageLimit
                  const notStarted = c.startDate && new Date(c.startDate) > new Date()

                  return (
                    <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      {/* Code */}
                      <td className="p-4">
                        <span className="font-mono font-bold text-neon-pink bg-neon-pink/10 px-2 py-0.5 rounded text-xs">
                          {c.code}
                        </span>
                      </td>

                      {/* Tên */}
                      <td className="p-4">
                        <div className="text-white text-sm">{c.name}</div>
                        {c.description && (
                          <div className="text-white/35 text-xs mt-0.5 truncate max-w-[160px]">
                            {c.description}
                          </div>
                        )}
                      </td>

                      {/* Loại */}
                      <td className="p-4 text-center text-white/60 text-xs">
                        <span className="inline-flex items-center gap-1">
                          <FontAwesomeIcon icon={TYPE_ICONS[c.type]} />
                          {TYPE_LABELS[c.type]}
                        </span>
                      </td>

                      {/* Giá trị */}
                      <td className="p-4 text-right font-bold text-neon-green text-sm">
                        {c.type === 'PERCENT' ? `${c.value}%` : formatCurrency(c.value)}
                        {c.maxDiscount && c.type === 'PERCENT' && (
                          <div className="text-white/30 text-xs font-normal">
                            tối đa {formatCurrency(c.maxDiscount)}
                          </div>
                        )}
                      </td>

                      {/* Đơn tối thiểu */}
                      <td className="p-4 text-right text-white/50 text-xs">
                        {parseFloat(c.minPurchase) > 0
                          ? formatCurrency(c.minPurchase)
                          : <span className="text-white/25">—</span>}
                      </td>

                      {/* Lượt dùng */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-12 h-1.5 bg-dark-600 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-neon-pink rounded-full"
                              style={{
                                width: `${Math.min((c.usageCount / c.usageLimit) * 100, 100)}%`,
                              }}
                            />
                          </div>
                          <span className="text-white/50 text-xs">
                            {c.usageCount}/{c.usageLimit}
                          </span>
                        </div>
                      </td>

                      {/* Mỗi user */}
                      <td className="p-4 text-center text-white/50 text-xs">
                        {c.perUserLimit}x
                      </td>

                      {/* Ngày bắt đầu */}
                      <td className="p-4 text-center text-white/40 text-xs">
                        {c.startDate ? formatDate(c.startDate) : <span className="text-white/25">—</span>}
                      </td>

                      {/* Hạn */}
                      <td className="p-4 text-center text-white/40 text-xs">
                        {c.endDate ? formatDate(c.endDate) : 'Không hạn'}
                      </td>

                      {/* Status */}
                      <td className="p-4 text-center">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                            !c.isActive || isExpired || isFull
                              ? 'bg-red-500/20 text-red-400'
                              : notStarted
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-neon-green/20 text-neon-green'
                          }`}
                        >
                          {!c.isActive
                            ? 'Tắt'
                            : isExpired
                            ? 'Hết hạn'
                            : isFull
                            ? 'Hết lượt'
                            : notStarted
                            ? 'Chưa mở'
                            : 'Active'}
                        </span>
                      </td>

                      {/* Thao tác */}
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEdit(c)}
                            className="px-2 py-1.5 rounded bg-blue-500/20 text-blue-400 text-xs hover:bg-blue-500/30 transition-colors"
                          >
                            <FontAwesomeIcon icon={faPen} />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="px-2 py-1.5 rounded bg-red-500/20 text-red-400 text-xs hover:bg-red-500/30 transition-colors"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4">
            <Pagination
              page={page}
              pages={Math.ceil(total / 10)}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <Modal
            isOpen
            title={
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={editing ? faPen : faTags} />
                {editing ? 'Sửa Coupon' : 'Tạo Coupon Mới'}
              </div>
            }
            onClose={() => !saving && setShowModal(false)}
          >
            <form onSubmit={handleSave} className="space-y-5">

              {/* Row 1: Code + Tên */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/40 uppercase font-display block mb-2">
                    Mã coupon *
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={form.code}
                      onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                      required
                      className="input-gaming flex-1 text-xs font-mono uppercase"
                      placeholder="SALE2024"
                    />
                    <button
                      type="button"
                      onClick={genCode}
                      title="Random code"
                      className="px-3 rounded-lg bg-white/10 text-white/60 hover:text-white text-xs transition-colors"
                    >
                      <FontAwesomeIcon icon={faDice} />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/40 uppercase font-display block mb-2">
                    Tên *
                  </label>
                  <input
                    value={form.name}
                    onChange={setField('name')}
                    required
                    className="input-gaming"
                    placeholder="Khuyến mãi mùa hè"
                  />
                </div>
              </div>

              {/* Row 2: Loại + Giá trị */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/40 uppercase font-display block mb-2">
                    Loại
                  </label>
                  <select
                    value={form.type}
                    onChange={setField('type')}
                    className="input-gaming"
                  >
                    {Object.entries(TYPE_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-white/40 uppercase font-display block mb-2">
                    Giá trị *
                  </label>
                  <input
                    type="number"
                    value={form.value}
                    onChange={setField('value')}
                    required
                    min="0"
                    className="input-gaming"
                    placeholder={form.type === 'PERCENT' ? '10' : '50000'}
                  />
                </div>
              </div>

              {/* Row 3: Đơn tối thiểu + Giảm tối đa */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/40 uppercase font-display block mb-2">
                    Đơn tối thiểu
                  </label>
                  <input
                    type="number"
                    value={form.minPurchase}
                    onChange={setField('minPurchase')}
                    min="0"
                    className="input-gaming"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/40 uppercase font-display block mb-2">
                    Giảm tối đa
                    {form.type !== 'PERCENT' && (
                      <span className="ml-1 text-white/20 normal-case">(chỉ áp dụng cho %)</span>
                    )}
                  </label>
                  <input
                    type="number"
                    value={form.maxDiscount}
                    onChange={setField('maxDiscount')}
                    min="0"
                    disabled={form.type !== 'PERCENT'}
                    className="input-gaming disabled:opacity-40"
                    placeholder="Không giới hạn"
                  />
                </div>
              </div>

              {/* Row 4: Giới hạn lượt dùng + Mỗi user tối đa */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/40 uppercase font-display block mb-2">
                    <FontAwesomeIcon icon={faTags} className="mr-1 opacity-60" />
                    Giới hạn lượt dùng *
                  </label>
                  <input
                    type="number"
                    value={form.usageLimit}
                    onChange={setField('usageLimit')}
                    required
                    min="1"
                    className="input-gaming"
                    placeholder="100"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/40 uppercase font-display block mb-2">
                    <FontAwesomeIcon icon={faUsers} className="mr-1 opacity-60" />
                    Mỗi user tối đa *
                  </label>
                  <input
                    type="number"
                    value={form.perUserLimit}
                    onChange={setField('perUserLimit')}
                    required
                    min="1"
                    className="input-gaming"
                    placeholder="1"
                  />
                </div>
              </div>

              {/* Row 5: Ngày bắt đầu + Ngày kết thúc */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/40 uppercase font-display block mb-2">
                    <FontAwesomeIcon icon={faCalendarAlt} className="mr-1 opacity-60" />
                    Ngày bắt đầu
                  </label>
                  <input
                    type="datetime-local"
                    value={form.startDate}
                    onChange={setField('startDate')}
                    className="input-gaming"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/40 uppercase font-display block mb-2">
                    <FontAwesomeIcon icon={faCalendarAlt} className="mr-1 opacity-60" />
                    Ngày kết thúc
                  </label>
                  <input
                    type="datetime-local"
                    value={form.endDate}
                    onChange={setField('endDate')}
                    className="input-gaming"
                  />
                </div>
              </div>

              {/* Mô tả */}
              <div>
                <label className="text-xs text-white/40 uppercase font-display block mb-2">
                  <FontAwesomeIcon icon={faInfoCircle} className="mr-1 opacity-60" />
                  Mô tả
                </label>
                <textarea
                  value={form.description}
                  onChange={setField('description')}
                  rows={2}
                  className="input-gaming resize-none"
                  placeholder="Mô tả ngắn về coupon này..."
                />
              </div>

              {/* Kích hoạt */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))}
                  className="w-4 h-4 accent-pink-500"
                />
                <span className="text-white/70 text-sm">Kích hoạt coupon</span>
              </label>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-neon px-5 py-2 text-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary px-5 py-2 text-sm flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Spinner size="sm" color="white" />
                      Đang lưu...
                    </>
                  ) : editing ? (
                    <>
                      <FontAwesomeIcon icon={faFloppyDisk} />
                      Cập nhật
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faWandMagicSparkles} />
                      Tạo
                    </>
                  )}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  )
}