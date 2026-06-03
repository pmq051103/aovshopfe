import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUsers,
  faSearch,
  faLock,
  faUnlock,
  faCheckCircle,
  faMoneyBillWave,
  faFloppyDisk,
} from '@fortawesome/free-solid-svg-icons'

import api from '../../api/axios'
import { formatCurrency } from '../../utils/helpers'
import { Modal, Spinner, Pagination } from '../../components/common/UIComponents'
import toast from 'react-hot-toast'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [balanceModal, setBalanceModal] = useState(null)
  const [balanceAmt, setBalanceAmt] = useState('')
  const [balanceDesc, setBalanceDesc] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [page, search, roleFilter])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const q = new URLSearchParams({
        page,
        limit: 10,
        ...(search && { search }),
        ...(roleFilter && { role: roleFilter }),
      })

      const { data } = await api.get(`/admin/users?${q}`)
      setUsers(data.data || [])
      setTotal(data.pagination?.total || 0)
    } catch (e) {
      toast.error('Lỗi tải danh sách người dùng')
    } finally {
      setLoading(false)
    }
  }

  const handleBan = async (user) => {
    const reason = prompt(`Lý do khóa tài khoản ${user.username}?`)
    if (reason === null) return

    try {
      await api.put(`/admin/users/${user.id}/ban`, {
        banReason: reason || 'Vi phạm điều khoản',
      })
      toast.success('Đã khóa tài khoản')
      fetchUsers()
    } catch (e) {
      toast.error('Lỗi')
    }
  }

  const handleUnban = async (user) => {
    try {
      await api.put(`/admin/users/${user.id}/unban`)
      toast.success('Đã mở khóa')
      fetchUsers()
    } catch (e) {
      toast.error('Lỗi')
    }
  }

  const handleAdjustBalance = async (e) => {
    e.preventDefault()

    if (!balanceAmt) return

    setSaving(true)
    try {
      await api.post(`/admin/users/${balanceModal.id}/balance`, {
        amount: parseFloat(balanceAmt),
        description: balanceDesc,
      })

      toast.success('Điều chỉnh số dư thành công!')
      setBalanceModal(null)
      setBalanceAmt('')
      setBalanceDesc('')
      fetchUsers()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi điều chỉnh')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-gaming text-xl font-bold text-gradient flex items-center gap-2">
            <FontAwesomeIcon icon={faUsers} />
            Quản Lý Người Dùng
          </h1>
          <p className="text-white/40 text-sm">{total} người dùng</p>
        </div>
      </div>

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
            placeholder="Tìm theo username, email..."
            className="input-gaming text-sm py-2 pl-9 w-full"
          />
        </div>

        <div className="flex gap-2">
          {[
            ['', 'Tất cả'],
            ['USER', 'User'],
            ['ADMIN', 'Admin'],
          ].map(([val, label]) => (
            <button
              key={val}
              onClick={() => {
                setRoleFilter(val)
                setPage(1)
              }}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                roleFilter === val
                  ? 'bg-neon-pink/20 border border-neon-pink/40 text-neon-pink'
                  : 'bg-dark-600 border border-white/10 text-white/50 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
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
                  <th className="text-right p-4">Số dư</th>
                  <th className="text-right p-4">Tổng nạp</th>
                  <th className="text-center p-4">Trạng thái</th>
                  <th className="text-right p-4">Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-white/5 hover:bg-white/2 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            u.avatar ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`
                          }
                          alt=""
                          className="w-8 h-8 rounded-lg"
                        />
                        <div>
                          <div className="font-medium text-white text-xs">
                            {u.displayName || u.username}
                          </div>
                          <div className="text-white/30 text-[10px]">{u.email}</div>
                          {u.role === 'ADMIN' && (
                            <span className="text-[10px] bg-neon-pink/20 text-neon-pink px-1.5 py-0.5 rounded">
                              ADMIN
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="p-4 text-right font-bold text-yellow-400 text-xs">
                      {formatCurrency(u.balance)}
                    </td>

                    <td className="p-4 text-right text-neon-green text-xs">
                      {formatCurrency(u.totalDeposit)}
                    </td>

                    <td className="p-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-bold ${
                          u.isBanned
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-neon-green/20 text-neon-green'
                        }`}
                      >
                        <FontAwesomeIcon icon={u.isBanned ? faLock : faCheckCircle} />
                        {u.isBanned ? 'Bị khóa' : 'Hoạt động'}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setBalanceModal(u)}
                          className="px-2 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 text-xs transition-colors"
                          title="Điều chỉnh số dư"
                        >
                          <FontAwesomeIcon icon={faMoneyBillWave} />
                        </button>

                        {u.isBanned ? (
                          <button
                            onClick={() => handleUnban(u)}
                            className="px-2 py-1.5 rounded-lg bg-neon-green/20 text-neon-green hover:bg-neon-green/30 text-xs transition-colors"
                          >
                            <FontAwesomeIcon icon={faUnlock} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBan(u)}
                            className="px-2 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs transition-colors"
                          >
                            <FontAwesomeIcon icon={faLock} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4">
            <Pagination page={page} pages={Math.ceil(total / 10)} onPageChange={setPage} />
          </div>
        </div>
      )}

      <AnimatePresence>
        {balanceModal && (
          <Modal
            isOpen
            title={
              <span className="flex items-center gap-2">
                <FontAwesomeIcon icon={faMoneyBillWave} />
                Điều Chỉnh Số Dư
              </span>
            }
            onClose={() => !saving && setBalanceModal(null)}
          >
            <div className="mb-5">
              <div className="flex items-center gap-3 gaming-card p-3">
                <img
                  src={
                    balanceModal.avatar ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${balanceModal.username}`
                  }
                  alt=""
                  className="w-10 h-10 rounded-lg"
                />
                <div>
                  <div className="font-bold text-white">
                    {balanceModal.displayName || balanceModal.username}
                  </div>
                  <div className="text-yellow-400 text-sm">
                    Số dư: {formatCurrency(balanceModal.balance)}
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleAdjustBalance} className="space-y-4">
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider font-display block mb-2">
                  Số tiền (+ thêm / - trừ)
                </label>
                <input
                  type="number"
                  value={balanceAmt}
                  onChange={(e) => setBalanceAmt(e.target.value)}
                  placeholder="VD: 100000 hoặc -50000"
                  required
                  className="input-gaming"
                />
              </div>

              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider font-display block mb-2">
                  Lý do
                </label>
                <input
                  type="text"
                  value={balanceDesc}
                  onChange={(e) => setBalanceDesc(e.target.value)}
                  placeholder="Lý do điều chỉnh..."
                  className="input-gaming"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setBalanceModal(null)}
                  disabled={saving}
                  className="flex-1 btn-neon py-2.5 text-sm"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 btn-primary py-2.5 text-sm flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Spinner size="sm" color="white" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faFloppyDisk} />
                      Xác Nhận
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