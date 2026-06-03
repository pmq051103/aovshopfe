import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faClipboardList,
  faClock,
  faCheckCircle,
  faRotateLeft,
  faTriangleExclamation,
  faCircleXmark,
  faMoneyBillWave,
  faSearch,
  faEye,
  faUser,
  faLock,
  faEnvelope,
  faPhone,
  faCreditCard,
  faGamepad,
  faNoteSticky,
  faLink,
} from '@fortawesome/free-solid-svg-icons'

import api from '../../api/axios'
import { formatCurrency, formatDate } from '../../utils/helpers'
import { Modal, Spinner, Pagination, EmptyState } from '../../components/common/UIComponents'
import toast from 'react-hot-toast'

const STATUS_STYLES = {
  PENDING: {
    label: 'Chờ',
    icon: faClock,
    cls: 'bg-yellow-500/20 text-yellow-400',
  },
  COMPLETED: {
    label: 'Hoàn thành',
    icon: faCheckCircle,
    cls: 'bg-neon-green/20 text-neon-green',
  },
  REFUNDED: {
    label: 'Đã hoàn',
    icon: faRotateLeft,
    cls: 'bg-blue-500/20 text-blue-400',
  },
  DISPUTED: {
    label: 'Tranh chấp',
    icon: faTriangleExclamation,
    cls: 'bg-red-500/20 text-red-400',
  },
  CANCELLED: {
    label: 'Huỷ',
    icon: faCircleXmark,
    cls: 'bg-white/10 text-white/40',
  },
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

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [refundModal, setRefundModal] = useState(null)
  const [refundReason, setRefundReason] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchOrders()
    fetchStats()
  }, [page, statusFilter, search])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const q = new URLSearchParams({
        page,
        limit: 10,
        ...(statusFilter && { status: statusFilter }),
        ...(search && { search }),
      })

      const { data } = await api.get(`/orders/admin?${q}`)
      setOrders(data.data || [])
      setTotal(data.pagination?.total || 0)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi lấy danh sách đơn hàng')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/orders/admin/stats')
      setStats(data.data)
    } catch (e) { }
  }

  const handleRefund = async () => {
    if (!refundModal) return

    setProcessing(true)
    try {
      await api.post(`/orders/admin/${refundModal.id}/refund`, {
        reason: refundReason,
      })

      toast.success('Hoàn tiền thành công!')
      setRefundModal(null)
      setRefundReason('')
      fetchOrders()
      fetchStats()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi hoàn tiền')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-gaming text-xl font-bold text-gradient flex items-center gap-2">
          <FontAwesomeIcon icon={faClipboardList} />
          Quản Lý Đơn Hàng
        </h1>
        <p className="text-white/40 text-sm">{total} đơn hàng</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              l: 'Tổng hoàn thành',
              v: stats.totalCompleted?.toLocaleString(),
              i: faCheckCircle,
              c: 'text-neon-green',
            },
            {
              l: 'Doanh thu tháng',
              v: formatCurrency(stats.monthRevenue),
              i: faMoneyBillWave,
              c: 'text-yellow-400',
            },
            {
              l: 'Tranh chấp',
              v: stats.disputed,
              i: faTriangleExclamation,
              c: stats.disputed > 0 ? 'text-red-400' : 'text-white',
            },
            {
              l: 'Đã hoàn tiền',
              v: stats.refunded,
              i: faRotateLeft,
              c: 'text-blue-400',
            },
          ].map((s, i) => (
            <div key={i} className="gaming-card p-4">
              <div className={`text-2xl mb-2 ${s.c || 'text-white'}`}>
                <FontAwesomeIcon icon={s.i} />
              </div>
              <div className={`font-gaming font-bold text-lg ${s.c || 'text-white'}`}>
                {s.v}
              </div>
              <div className="text-white/40 text-xs">{s.l}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <div className="relative max-w-xs w-full">
          <FontAwesomeIcon
            icon={faSearch}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-xs"
          />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Tìm mã đơn..."
            className="input-gaming text-sm py-2 pl-9 w-full"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {[
            ['', { label: 'Tất cả', icon: faClipboardList }],
            ...Object.entries(STATUS_STYLES).map(([v, item]) => [v, item]),
          ].map(([v, item]) => (
            <button
              key={v}
              onClick={() => {
                setStatusFilter(v)
                setPage(1)
              }}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${statusFilter === v
                  ? 'bg-neon-pink/20 border border-neon-pink/40 text-neon-pink'
                  : 'bg-dark-600 border border-white/10 text-white/50 hover:text-white'
                }`}
            >
              <FontAwesomeIcon icon={item.icon} />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : orders.length === 0 ? (
        <EmptyState icon={<FontAwesomeIcon icon={faClipboardList} />} title="Không có đơn hàng" />
      ) : (
        <div className="gaming-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-xs text-white/40 uppercase">
                  <th className="text-left p-4">Mã đơn</th>
                  <th className="text-left p-4">Khách hàng</th>
                  <th className="text-left p-4">Tài khoản</th>
                  <th className="text-right p-4">Tổng tiền</th>
                  <th className="text-center p-4">Trạng thái</th>
                  <th className="text-left p-4">Thời gian</th>
                  <th className="text-right p-4">Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {orders.map((o) => {
                  const st = STATUS_STYLES[o.status] || STATUS_STYLES.PENDING

                  return (
                    <tr key={o.id} className="border-b border-white/5 hover:bg-white/2">
                      <td className="p-4">
                        <span className="font-mono text-neon-pink text-xs bg-neon-pink/10 px-2 py-0.5 rounded">
                          {o.orderCode}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <img
                            src={
                              o.user?.avatar ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${o.user?.username}`
                            }
                            alt=""
                            className="w-7 h-7 rounded-full"
                          />
                          <div className="text-white text-xs font-medium">
                            {o.user?.displayName || o.user?.username}
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-white/60 text-xs max-w-[160px]">
                        {o.items?.map((item) => (
                          <div key={item.id} className="truncate">
                            {item.gameAccountCode} — {item.gameAccountTitle}
                          </div>
                        ))}
                      </td>

                      <td className="p-4 text-right font-gaming font-bold text-neon-green text-sm">
                        {formatCurrency(o.finalAmount)}
                      </td>

                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-bold ${st.cls}`}
                        >
                          <FontAwesomeIcon icon={st.icon} />
                          {st.label}
                        </span>
                      </td>

                      <td className="p-4 text-white/40 text-xs">{formatDate(o.createdAt)}</td>

                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setSelected(o)}
                            className="px-2 py-1.5 rounded bg-blue-500/20 text-blue-400 text-xs hover:bg-blue-500/30"
                          >
                            <FontAwesomeIcon icon={faEye} />
                          </button>

                          {['COMPLETED', 'DISPUTED'].includes(o.status) && (
                            <button
                              onClick={() => {
                                setRefundModal(o)
                                setRefundReason('')
                              }}
                              className="px-2 py-1.5 rounded bg-yellow-500/20 text-yellow-400 text-xs hover:bg-yellow-500/30 flex items-center gap-1"
                            >
                              <FontAwesomeIcon icon={faRotateLeft} />
                              Hoàn
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4">
            <Pagination page={page} pages={Math.ceil(total / 10)} onPageChange={setPage} />
          </div>
        </div>
      )}

      <AnimatePresence>
        {selected && (
          <Modal
            isOpen
            title={
              <span className="flex items-center gap-2">
                <FontAwesomeIcon icon={faClipboardList} />
                Đơn Hàng #{selected.orderCode}
              </span>
            }
            onClose={() => setSelected(null)}
            size="lg"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="gaming-card p-3">
                  <div className="text-white/40 text-xs mb-1">Khách hàng</div>
                  <div className="flex items-center gap-2">
                    <img
                      src={
                        selected.user?.avatar ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${selected.user?.username}`
                      }
                      alt=""
                      className="w-8 h-8 rounded-full"
                    />
                    <div>
                      <div className="text-white text-sm font-medium">
                        {selected.user?.displayName}
                      </div>
                      <div className="text-white/40 text-xs">@{selected.user?.username}</div>
                    </div>
                  </div>
                </div>

                <div className="gaming-card p-3">
                  <div className="text-white/40 text-xs mb-1 flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faCreditCard} />
                    Thanh toán
                  </div>
                  <div className="font-gaming font-bold text-neon-green text-lg">
                    {formatCurrency(selected.finalAmount)}
                  </div>
                  {selected.discountAmount > 0 && (
                    <div className="text-white/40 text-xs">
                      Giảm: -{formatCurrency(selected.discountAmount)}
                    </div>
                  )}
                </div>
              </div>

              <div className="gaming-card p-4">
                <div className="text-white/40 text-xs mb-3 uppercase tracking-wider font-display flex items-center gap-2">
                  <FontAwesomeIcon icon={faGamepad} />
                  Chi Tiết Tài Khoản
                </div>

                {selected.items?.map((item) => (
                  <div
                    key={item.id}
                    className="border-b border-white/5 pb-3 mb-3 last:border-0 last:mb-0"
                  >
                    <div className="flex justify-between mb-2">
                      <div>
                        <span className="font-mono text-neon-pink text-xs bg-neon-pink/10 px-1.5 py-0.5 rounded">
                          #{item.gameAccountCode}
                        </span>
                        <div className="text-white text-sm mt-1">{item.gameAccountTitle}</div>
                        <div className="text-white/40 text-xs">
                          {item.gameAccountRank} — {item.gameAccountServer}
                        </div>
                      </div>

                      <div className="font-gaming font-bold text-neon-green">
                        {formatCurrency(item.price)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {[
                        [{ text: 'Username', icon: faUser }, item.gameUsername],
                        [{ text: 'Password', icon: faLock }, item.gamePassword],

                        [
                          { text: 'Email', icon: faEnvelope },
                          item.gameBindEmail ? maskEmail(item.gameBindEmail) : '',
                        ],

                        [
                          { text: 'Phone', icon: faPhone },
                          item.gameBindPhone ? maskPhone(item.gameBindPhone) : '',
                        ],

                        [
                          { text: 'Facebook', icon: faLink },
                          getFacebookLabel(item.gameBindFacebook),
                        ],
                      ]
                        .filter(([, v]) => v)
                        .map(([l, v]) => (
                          <div key={l.text} className="bg-dark-700 rounded-lg p-2">
                            <div className="text-white/30 text-[10px] flex items-center gap-1.5">
                              <FontAwesomeIcon icon={l.icon} />
                              {l.text}
                            </div>
                            <div className="font-mono text-white text-xs">{v}</div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>

              {selected.note && (
                <div className="gaming-card p-3">
                  <div className="text-white/40 text-xs mb-1 flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faNoteSticky} />
                    Ghi chú
                  </div>
                  <div className="text-white/70 text-sm">{selected.note}</div>
                </div>
              )}

              {selected.refundReason && (
                <div className="gaming-card p-3 border border-yellow-500/20 bg-yellow-500/5">
                  <div className="text-yellow-400 text-xs mb-1 flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faRotateLeft} />
                    Lý do hoàn tiền
                  </div>
                  <div className="text-white/70 text-sm">{selected.refundReason}</div>
                </div>
              )}
            </div>
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {refundModal && (
          <Modal
            isOpen
            title={
              <span className="flex items-center gap-2">
                <FontAwesomeIcon icon={faRotateLeft} />
                Xác Nhận Hoàn Tiền
              </span>
            }
            onClose={() => !processing && setRefundModal(null)}
          >
            <div className="space-y-4">
              <div className="gaming-card p-4 border border-yellow-500/20 bg-yellow-500/5">
                <div className="flex justify-between mb-2">
                  <span className="text-white/60 text-sm">Đơn hàng</span>
                  <span className="font-mono text-neon-pink font-bold">
                    #{refundModal.orderCode}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">Số tiền hoàn</span>
                  <span className="font-gaming font-bold text-neon-green text-lg">
                    {formatCurrency(refundModal.finalAmount)}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider font-display block mb-2">
                  Lý do hoàn tiền *
                </label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  rows={3}
                  className="input-gaming resize-none"
                  placeholder="Nhập lý do hoàn tiền..."
                />
              </div>

              <p className="text-yellow-400 text-xs flex items-center gap-2">
                <FontAwesomeIcon icon={faTriangleExclamation} />
                Tài khoản game sẽ được chuyển về trạng thái Available sau khi hoàn tiền
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setRefundModal(null)}
                  disabled={processing}
                  className="flex-1 btn-neon py-2.5 text-sm"
                >
                  Hủy
                </button>

                <button
                  onClick={handleRefund}
                  disabled={processing || !refundReason}
                  className="flex-1 btn-primary py-2.5 text-sm flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <Spinner size="sm" color="white" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCheckCircle} />
                      Xác Nhận Hoàn Tiền
                    </>
                  )}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  )
}