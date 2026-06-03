import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { formatCurrency, formatDate } from '../../utils/helpers'
import { Spinner, Pagination } from '../../components/common/UIComponents'
import toast from 'react-hot-toast'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faClock,
  faCheck,
  faXmark,
  faHourglassEnd,
  faCircleCheck,
} from '@fortawesome/free-solid-svg-icons'

export default function AdminDeposits() {
  const [deposits, setDeposits] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const [confirming, setConfirming] = useState(null)

  useEffect(() => {
    fetchDeposits()
  }, [page, statusFilter])

  const fetchDeposits = async () => {
    setLoading(true)

    try {
      const q = new URLSearchParams({
        page,
        limit: 10,
        ...(statusFilter && { status: statusFilter }),
      })

      const { data } = await api.get(`/admin/deposits?${q}`)
      setDeposits(data.data || [])
      setTotal(data.pagination?.total || 0)
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async id => {
    setConfirming(id)

    try {
      await api.post(`/deposit/${id}/confirm`)
      toast.success('Xác nhận nạp tiền thành công!')
      fetchDeposits()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi xác nhận')
    } finally {
      setConfirming(null)
    }
  }

  const statusColor = {
    PENDING: 'text-yellow-400',
    COMPLETED: 'text-neon-green',
    FAILED: 'text-red-400',
    EXPIRED: 'text-white/40',
  }

  const statusConfig = {
    PENDING: {
      icon: faClock,
      label: 'Chờ',
    },
    COMPLETED: {
      icon: faCheck,
      label: 'Thành công',
    },
    FAILED: {
      icon: faXmark,
      label: 'Thất bại',
    },
    EXPIRED: {
      icon: faHourglassEnd,
      label: 'Hết hạn',
    },
  }

  const filterItems = [
    {
      value: '',
      label: 'Tất cả',
      icon: null,
    },
    {
      value: 'PENDING',
      label: 'Chờ',
      icon: faClock,
    },
    {
      value: 'COMPLETED',
      label: 'Thành công',
      icon: faCheck,
    },
    {
      value: 'FAILED',
      label: 'Thất bại',
      icon: faXmark,
    },
    {
      value: 'EXPIRED',
      label: 'Hết hạn',
      icon: faHourglassEnd,
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-gaming text-xl font-bold text-gradient">
            Quản Lý Nạp Tiền
          </h1>

          <p className="text-white/40 text-sm">
            {total} lệnh nạp tiền
          </p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {filterItems.map(item => (
          <button
            key={item.value}
            onClick={() => {
              setStatusFilter(item.value)
              setPage(1)
            }}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
              statusFilter === item.value
                ? 'bg-neon-pink/20 border border-neon-pink/40 text-neon-pink'
                : 'bg-dark-600 border border-white/10 text-white/50 hover:text-white'
            }`}
          >
            {item.icon && <FontAwesomeIcon icon={item.icon} />}
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="gaming-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-xs text-white/40 uppercase tracking-wider">
                  <th className="text-left p-4">Người dùng</th>
                  <th className="text-right p-4">Số tiền</th>
                  <th className="text-left p-4">Nội dung CK</th>
                  <th className="text-center p-4">Trạng thái</th>
                  <th className="text-left p-4">Thời gian</th>
                  <th className="text-right p-4">Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {deposits.map(d => {
                  const status = statusConfig[d.status] || statusConfig.PENDING

                  return (
                    <tr
                      key={d.id}
                      className="border-b border-white/5 hover:bg-white/2 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <img
                            src={
                              d.user?.avatar ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${d.user?.username}`
                            }
                            alt=""
                            className="w-7 h-7 rounded-full"
                          />

                          <span className="text-white text-xs">
                            {d.user?.username}
                          </span>
                        </div>
                      </td>

                      <td className="p-4 text-right font-gaming font-bold text-neon-green">
                        {formatCurrency(d.amount)}
                      </td>

                      <td className="p-4 font-mono text-white/50 text-xs">
                        {d.transferContent}
                      </td>

                      <td className="p-4 text-center">
                        <span className={`text-xs font-bold inline-flex items-center justify-center gap-1 ${statusColor[d.status]}`}>
                          <FontAwesomeIcon icon={status.icon} />
                          {status.label}
                        </span>
                      </td>

                      <td className="p-4 text-white/40 text-xs">
                        {formatDate(d.createdAt)}
                      </td>

                      <td className="p-4 text-right">
                        {d.status === 'PENDING' && (
                          <button
                            onClick={() => handleConfirm(d.id)}
                            disabled={confirming === d.id}
                            className="px-3 py-1.5 rounded-lg bg-neon-green/20 text-neon-green hover:bg-neon-green/30 text-xs transition-colors flex items-center gap-1 ml-auto"
                          >
                            {confirming === d.id ? (
                              <Spinner size="sm" />
                            ) : (
                              <>
                                <FontAwesomeIcon icon={faCircleCheck} />
                                Xác nhận
                              </>
                            )}
                          </button>
                        )}
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
    </div>
  )
}