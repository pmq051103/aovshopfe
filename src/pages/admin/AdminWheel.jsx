import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Modal, Spinner, RarityBadge, Pagination } from '../../components/common/UIComponents'
import {
  faGift,
  faClipboardList,
  faPlus,
  faTriangleExclamation,
  faCircleInfo,
  faGamepad,
  faRotate,
  faTicket,
  faBolt,
  faPen,
  faTrash,
  faImage,
  faFloppyDisk,
  faMoneyBillWave,
  faSearch,
  faCog,
  faCoins,
} from '@fortawesome/free-solid-svg-icons'

import api from '../../api/axios'
import { formatCurrency, formatDate, getRarityColor, getRarityLabel } from '../../utils/helpers'
import toast from 'react-hot-toast'

const RARITIES = ['COMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC']

const REWARD_TYPE_CONFIG = {
  BALANCE: { label: 'Tiền mặt', icon: faMoneyBillWave },
  ACCOUNT: { label: 'Tài khoản game', icon: faGamepad },
  SPIN: { label: 'Lượt quay', icon: faRotate },
  COUPON: { label: 'Coupon', icon: faTicket },
  QUAN_HUY: { label: 'Quân Huy', icon: faBolt },
}

const defaultForm = {
  name: '',
  description: '',
  type: 'BALANCE',
  value: '',
  probability: '',
  rarity: 'COMMON',
  color: '#ff2d73',
  sortOrder: '0',
  isActive: true,
  rewardAccountId: '',
  rewardSpinCount: '',
  couponCode: '',
  quanHuyAmount: '',
  image: null,
}

export default function AdminWheel() {
  const [wheel, setWheel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editReward, setEditReward] = useState(null)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [history, setHistory] = useState([])
  const [tab, setTab] = useState('rewards')
  const [preview, setPreview] = useState('')
  const [accounts, setAccounts] = useState([])
  const [coupons, setCoupons] = useState([])
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [historyPage, setHistoryPage] = useState(1)
  const [historyTotal, setHistoryTotal] = useState(0)
  const [historySearch, setHistorySearch] = useState('')
  const [historyRarity, setHistoryRarity] = useState('ALL')
  const [historyType, setHistoryType] = useState('ALL')
  const [showSpinCostModal, setShowSpinCostModal] = useState(false)
  const [spinCostInput, setSpinCostInput] = useState('')
  const [savingSpinCost, setSavingSpinCost] = useState(false)

  useEffect(() => {
    fetchWheel()
    fetchAccounts()
    fetchCoupons()
  }, [])

  const fetchAccounts = async () => {
    try {
      const { data } = await api.get('/accounts?admin=1&status=AVAILABLE&limit=100')
      setAccounts(data.data || [])
    } catch {
      setAccounts([])
    }
  }

  const fetchCoupons = async () => {
    try {
      const { data } = await api.get('/coupons/admin?limit=100')
      setCoupons(data.data || [])
    } catch {
      setCoupons([])
    }
  }

  const fetchWheel = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/wheel/admin/all')
      const wheels = data.data || []
      setWheel(wheels[0] || null)
    } catch {
      toast.error('Lỗi tải vòng quay')
    } finally {
      setLoading(false)
    }
  }

  const fetchHistory = async (page = historyPage) => {
    try {
      const q = new URLSearchParams({
        page,
        limit: 10,
        ...(historySearch && { search: historySearch }),
        ...(historyRarity !== 'ALL' && { rarity: historyRarity }),
        ...(historyType !== 'ALL' && { type: historyType }),
      })

      const { data } = await api.get(`/wheel/admin/history?${q}`)
      setHistory(data.data || [])
      setHistoryTotal(data.pagination?.total || 0)
    } catch (e) { }
  }

  useEffect(() => {
    fetchHistory(historyPage)
  }, [historyPage, historySearch, historyRarity, historyType])

  const totalProbability =
    wheel?.rewards?.filter(r => r.isActive).reduce((sum, r) => sum + parseFloat(r.probability || 0), 0) || 0

  const openCreate = () => {
    setEditReward(null)
    setForm(defaultForm)
    setPreview('')
    setShowModal(true)
  }

  const openEdit = reward => {
    setEditReward(reward)
    setForm({
      name: reward.name || '',
      description: reward.description || '',
      type: reward.type || 'BALANCE',
      value: reward.value != null ? String(reward.value) : '',
      probability: reward.probability != null ? String(reward.probability) : '',
      rarity: reward.rarity || 'COMMON',
      color: reward.color || '#ff2d73',
      sortOrder: reward.sortOrder != null ? String(reward.sortOrder) : '0',
      isActive: reward.isActive ?? true,
      rewardAccountId: reward.rewardAccountId || '',
      rewardSpinCount: reward.rewardSpinCount ? String(reward.rewardSpinCount) : '',
      couponCode: reward.couponCode || '',
      quanHuyAmount: reward.quanHuyAmount ? String(reward.quanHuyAmount) : '',
      image: null,
    })
    setPreview(reward.imageUrl || '')
    setShowModal(true)
  }

  const handleImageChange = e => {
    const file = e.target.files?.[0]
    if (!file) return
    setForm(p => ({ ...p, image: file }))
    setPreview(URL.createObjectURL(file))
  }

  const handleSave = async e => {
    e.preventDefault()
    if (!wheel?.id) return toast.error('Không tìm thấy vòng quay')
    if (!form.name.trim()) return toast.error('Vui lòng nhập tên phần thưởng')
    if (!form.value || Number(form.value) < 0) return toast.error('Giá trị không hợp lệ')
    if (!form.probability || Number(form.probability) <= 0) return toast.error('Xác suất không hợp lệ')

    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('name', form.name)
      fd.append('description', form.description || '')
      fd.append('type', form.type)
      fd.append('value', form.value)
      fd.append('probability', form.probability)
      fd.append('rarity', form.rarity)
      fd.append('color', form.color || '')
      fd.append('sortOrder', form.sortOrder || '0')
      fd.append('isActive', form.isActive ? 'true' : 'false')
      fd.append('rewardAccountId', form.rewardAccountId || '')
      fd.append('rewardSpinCount', form.rewardSpinCount || '')
      fd.append('couponCode', form.couponCode || '')
      fd.append('quanHuyAmount', form.quanHuyAmount || '')
      if (form.image) fd.append('image', form.image)

      if (editReward) {
        await api.put(`/wheel/admin/rewards/${editReward.id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        toast.success('Cập nhật phần thưởng thành công')
      } else {
        await api.post(`/wheel/admin/${wheel.id}/rewards`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        toast.success('Thêm phần thưởng thành công')
      }

      setShowModal(false)
      fetchWheel()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi lưu phần thưởng')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async reward => {
    if (!confirm(`Xóa phần thưởng "${reward.name}"?`)) return
    setDeleting(reward.id)
    try {
      await api.delete(`/wheel/admin/rewards/${reward.id}`)
      toast.success('Đã xóa phần thưởng')
      fetchWheel()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi xóa phần thưởng')
    } finally {
      setDeleting(null)
    }
  }

  const toggleReward = async reward => {
    try {
      await api.put(`/wheel/admin/rewards/${reward.id}`, { isActive: !reward.isActive })
      fetchWheel()
    } catch {
      toast.error('Lỗi cập nhật trạng thái')
    }
  }

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>

  const handleSaveSpinCost = async () => {
    const val = parseFloat(spinCostInput)
    if (isNaN(val) || val <= 0) { toast.error('Số tiền không hợp lệ'); return }
    setSavingSpinCost(true)
    try {
      await api.put(`/wheel/admin/${wheel.id}`, { spinCost: val })
      toast.success('Cập nhật chi phí quay thành công!')
      setShowSpinCostModal(false)
      fetchWheel()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi cập nhật')
    } finally {
      setSavingSpinCost(false)
    }
  }

  const rewards = wheel?.rewards || []
  const filteredRewards = rewards.filter(r => {
    if (statusFilter === 'ACTIVE') return r.isActive
    if (statusFilter === 'INACTIVE') return !r.isActive
    return true
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-gaming text-xl font-bold text-gradient flex items-center gap-2">
            <FontAwesomeIcon icon={faGift} />
            Quản Lý Vòng Quay
          </h1>
          {wheel && (
            <p className="text-white/40 text-sm">
              Chi phí: {formatCurrency(wheel.spinCost)}/lần • Tổng xác suất:{' '}
              <span className={totalProbability > 1.001 ? 'text-red-400' : totalProbability >= 0.999 ? 'text-neon-green' : 'text-yellow-400'}>
                {(totalProbability * 100).toFixed(2)}%
              </span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {wheel && (
            <button
              onClick={() => { setSpinCostInput(String(wheel.spinCost)); setShowSpinCostModal(true) }}
              className="btn-secondary px-4 py-2.5 text-sm flex items-center gap-2 border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 rounded-lg transition-all"
            >
              <FontAwesomeIcon icon={faCoins} />
              Chi phí: {formatCurrency(wheel.spinCost)}
              <FontAwesomeIcon icon={faCog} className="text-xs opacity-60" />
            </button>
          )}
          <button onClick={openCreate} className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2">
            <FontAwesomeIcon icon={faPlus} />
            Thêm Phần Thưởng
          </button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-white/10 pb-2">
        {[
          ['rewards', 'Phần thưởng', faGift],
          ['history', 'Lịch sử', faClipboardList],
        ].map(([t, l, icon]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-t-lg font-display font-medium text-sm transition-all flex items-center gap-2 ${tab === t
              ? 'bg-neon-pink/20 text-neon-pink border-b-2 border-neon-pink'
              : 'text-white/40 hover:text-white'
              }`}
          >
            <FontAwesomeIcon icon={icon} />
            {l}
          </button>
        ))}
      </div>

      {tab === 'rewards' && (
        <>
          <div className="gaming-card p-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-white/60">Tổng xác suất active</span>
              <span className={`font-gaming font-bold ${totalProbability > 1.001 ? 'text-red-400' : totalProbability >= 0.999 ? 'text-neon-green' : 'text-yellow-400'}`}>
                {(totalProbability * 100).toFixed(2)}%
              </span>
            </div>

            <div className="h-3 bg-dark-700 rounded-full overflow-hidden flex">
              {wheel?.rewards
                ?.filter(r => r.isActive)
                .sort((a, b) => parseFloat(b.probability) - parseFloat(a.probability))
                .map(r => (
                  <div
                    key={r.id}
                    className="h-full"
                    style={{
                      width: `${Math.min(parseFloat(r.probability) * 100, 100)}%`,
                      background: r.color || getRarityColor(r.rarity),
                    }}
                    title={r.name}
                  />
                ))}
            </div>

            {totalProbability < 0.999 && (
              <p className="text-yellow-400 text-xs mt-1 flex items-center gap-1.5">
                <FontAwesomeIcon icon={faTriangleExclamation} />
                Tổng xác suất chưa đủ 100%
              </p>
            )}

            {totalProbability > 1.001 && (
              <p className="text-red-400 text-xs mt-1 flex items-center gap-1.5">
                <FontAwesomeIcon icon={faTriangleExclamation} />
                Tổng xác suất đang vượt 100%
              </p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-white/40 text-sm">
              {filteredRewards.length} / {rewards.length} phần thưởng
            </span>

            <div className="flex gap-2">
              {[
                ['ALL', 'Tất cả'],
                ['ACTIVE', 'Đang bật'],
                ['INACTIVE', 'Đang tắt'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setStatusFilter(value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-display transition-all ${statusFilter === value
                    ? 'bg-neon-pink/20 border border-neon-pink/40 text-neon-pink'
                    : 'bg-dark-600 border border-white/10 text-white/50 hover:text-white'
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="gaming-card overflow-hidden">
            {!wheel?.rewards?.length ? (
              <div className="text-center py-10 text-white/30">Chưa có phần thưởng</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-xs text-white/40 uppercase tracking-wider">
                      <th className="text-left p-4">Phần thưởng</th>
                      <th className="text-center p-4">Loại</th>
                      <th className="text-right p-4">Giá trị</th>
                      <th className="text-center p-4">Xác suất</th>
                      <th className="text-center p-4">Độ hiếm</th>
                      <th className="text-right p-4">Đã thắng</th>
                      <th className="text-center p-4">Active</th>
                      <th className="text-right p-4">Sửa/Xóa</th>
                    </tr>
                  </thead>

                  <tbody>
                    {[...filteredRewards]
                      .sort((a, b) => parseFloat(b.probability) - parseFloat(a.probability))
                      .map(r => {
                        const typeCfg = REWARD_TYPE_CONFIG[r.type]

                        return (
                          <tr key={r.id} className={`border-b border-white/5 hover:bg-white/2 transition-colors ${!r.isActive ? 'opacity-40' : ''}`}>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full flex-shrink-0"
                                  style={{
                                    background: r.color || getRarityColor(r.rarity),
                                    boxShadow: `0 0 6px ${r.color || getRarityColor(r.rarity)}`,
                                  }}
                                />

                                <div>
                                  <div className="text-white font-medium">
                                    {r.name}

                                    {typeCfg && (
                                      <span className="ml-2 text-[10px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded inline-flex items-center gap-1">
                                        <FontAwesomeIcon icon={typeCfg.icon} />
                                        {typeCfg.label}
                                      </span>
                                    )}
                                  </div>

                                  {r.description && (
                                    <div className="text-white/30 text-xs line-clamp-1">
                                      {r.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="p-4 text-center text-white/50 text-xs">{r.type}</td>

                            <td className="p-4 text-right font-gaming font-bold text-neon-green text-sm">
                              {r.type === 'QUAN_HUY' ? `${r.quanHuyAmount || 0} QH` : formatCurrency(r.value)}
                            </td>

                            <td className="p-4 text-center text-white/60 text-xs">
                              {(parseFloat(r.probability) * 100).toFixed(2)}%
                            </td>

                            <td className="p-4 text-center">
                              <RarityBadge rarity={r.rarity} size="xs" />
                            </td>

                            <td className="p-4 text-right text-white/40 text-xs">{r.wonCount || 0} lần</td>

                            <td className="p-4 text-center">
                              <button
                                onClick={() => toggleReward(r)}
                                className={`w-8 h-4 rounded-full transition-colors relative ${r.isActive ? 'bg-neon-green' : 'bg-white/20'}`}
                              >
                                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${r.isActive ? 'left-4' : 'left-0.5'}`} />
                              </button>
                            </td>

                            <td className="p-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => openEdit(r)}
                                  className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 text-xs"
                                >
                                  <FontAwesomeIcon icon={faPen} />
                                </button>

                                <button
                                  onClick={() => handleDelete(r)}
                                  disabled={deleting === r.id}
                                  className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs"
                                >
                                  {deleting === r.id ? <Spinner size="sm" /> : <FontAwesomeIcon icon={faTrash} />}
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'history' && (
        <div className="gaming-card overflow-hidden">
          <div className="p-4 flex flex-wrap items-center gap-3 border-b border-white/5">
            <div className="relative">
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-xs"
              />

              <input
                value={historySearch}
                onChange={e => {
                  setHistorySearch(e.target.value)
                  setHistoryPage(1)
                }}
                placeholder="Tìm username, email..."
                className="input-gaming text-sm py-2 pl-9 w-64"
              />
            </div>

            <select
              value={historyRarity}
              onChange={e => {
                setHistoryRarity(e.target.value)
                setHistoryPage(1)
              }}
              className="input-gaming text-sm py-2 pr-8 w-44"
            >
              <option value="ALL">Tất cả độ hiếm</option>

              {RARITIES.map(r => (
                <option key={r} value={r}>
                  {getRarityLabel ? getRarityLabel(r) : r}
                </option>
              ))}
            </select>
            <select
              value={historyType}
              onChange={e => {
                setHistoryType(e.target.value)
                setHistoryPage(1)
              }}
              className="input-gaming text-sm py-2 pr-8 w-44"
            >
              <option value="ALL">Tất cả loại</option>

              {Object.entries(REWARD_TYPE_CONFIG).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-xs text-white/40 uppercase tracking-wider">
                  <th className="text-left p-4">Người dùng</th>
                  <th className="text-left p-4">Phần thưởng</th>
                  <th className="text-center p-4">Độ hiếm</th>
                  <th className="text-right p-4">Giá trị</th>
                  <th className="text-center p-4">Thời gian</th>
                </tr>
              </thead>

              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-10 text-white/30"
                    >
                      Không có lịch sử
                    </td>
                  </tr>
                ) : (
                  history.map(h => (
                    <tr
                      key={h.id}
                      className="border-b border-white/5 hover:bg-white/2"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <img
                            src={
                              h.user?.avatar ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${h.user?.username}`
                            }
                            alt=""
                            className="w-8 h-8 rounded-full"
                          />

                          <div>
                            <div className="text-white text-xs font-medium">
                              {h.user?.displayName || h.user?.username}
                            </div>

                            <div className="text-white/40 text-[10px]">
                              @{h.user?.username}
                            </div>

                            <div className="text-white/30 text-[10px]">
                              {h.user?.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              background:
                                h.reward?.color ||
                                getRarityColor(h.rarity),
                            }}
                          />

                          <div>
                            <div className="text-white text-xs font-medium">
                              {h.rewardName}
                            </div>

                            <div className="text-white/30 text-[10px] flex items-center gap-1">
                              {REWARD_TYPE_CONFIG[h.reward?.type]?.icon && (
                                <FontAwesomeIcon
                                  icon={REWARD_TYPE_CONFIG[h.reward.type].icon}
                                />
                              )}

                              {REWARD_TYPE_CONFIG[h.reward?.type]?.label || h.reward?.type}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-center">
                        <RarityBadge
                          rarity={h.rarity}
                          size="xs"
                        />
                      </td>

                      <td className="p-4 text-right">
                        <span className="font-bold text-neon-green text-xs">
                          {formatCurrency(h.rewardValue)}
                        </span>
                      </td>

                      <td className="p-4 text-center text-white/40 text-xs">
                        {formatDate(h.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4">
            <Pagination
              page={historyPage}
              pages={Math.ceil(historyTotal / 15)}
              onPageChange={setHistoryPage}
            />
          </div>
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <Modal
            isOpen
            title={
              <span className="flex items-center gap-2">
                <FontAwesomeIcon icon={editReward ? faPen : faGift} />
                {editReward ? 'Sửa Phần Thưởng' : 'Thêm Phần Thưởng'}
              </span>
            }
            onClose={() => !saving && setShowModal(false)}
            size="lg"
          >
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs text-white/40 font-display uppercase tracking-wider block mb-1">
                    Tên phần thưởng *
                  </label>
                  <input
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    className="input-gaming text-sm py-2"
                    placeholder="VD: 50.000đ, Acc Random, Coupon..."
                  />
                </div>

                <div>
                  <label className="text-xs text-white/40 font-display uppercase tracking-wider block mb-1">
                    Loại thưởng
                  </label>
                  <select
                    value={form.type}
                    onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                    className="input-gaming text-sm py-2"
                  >
                    <option value="BALANCE">Tiền mặt</option>
                    <option value="ACCOUNT">Tài khoản game</option>
                    <option value="SPIN">Lượt quay</option>
                    <option value="COUPON">Coupon</option>
                    <option value="QUAN_HUY">Quân Huy</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-white/40 font-display uppercase tracking-wider block mb-1">
                    Giá trị *
                  </label>
                  <input
                    type="number"
                    value={form.value}
                    onChange={e => setForm(p => ({ ...p, value: e.target.value }))}
                    className="input-gaming text-sm py-2"
                    placeholder="50000"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/40 font-display uppercase tracking-wider block mb-1">
                    Xác suất *
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    max="1"
                    value={form.probability}
                    onChange={e => setForm(p => ({ ...p, probability: e.target.value }))}
                    className="input-gaming text-sm py-2"
                    placeholder="0.05"
                  />
                  {form.probability && (
                    <p className="text-white/40 text-xs mt-1">
                      = {(parseFloat(form.probability || 0) * 100).toFixed(2)}%
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs text-white/40 font-display uppercase tracking-wider block mb-1">
                    Độ hiếm
                  </label>
                  <select
                    value={form.rarity}
                    onChange={e => setForm(p => ({ ...p, rarity: e.target.value }))}
                    className="input-gaming text-sm py-2"
                  >
                    {RARITIES.map(r => (
                      <option key={r} value={r}>
                        {getRarityLabel ? getRarityLabel(r) : r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-white/40 font-display uppercase tracking-wider block mb-1">
                    Màu chấm
                  </label>
                  <input
                    type="color"
                    value={form.color || '#ff2d73'}
                    onChange={e => setForm(p => ({ ...p, color: e.target.value }))}
                    className="w-full h-10 rounded-lg bg-dark-700 border border-white/10 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/40 font-display uppercase tracking-wider block mb-1">
                    Thứ tự
                  </label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={e => setForm(p => ({ ...p, sortOrder: e.target.value }))}
                    className="input-gaming text-sm py-2"
                    placeholder="0"
                  />
                </div>

                {form.type === 'QUAN_HUY' && (
                  <div>
                    <label className="text-xs text-white/40 font-display uppercase tracking-wider block mb-1">
                      Số Quân Huy trao thưởng
                    </label>
                    <input
                      type="number"
                      value={form.quanHuyAmount}
                      onChange={e => setForm(p => ({ ...p, quanHuyAmount: e.target.value }))}
                      className="input-gaming text-sm py-2"
                      placeholder="100"
                    />
                  </div>
                )}

                {form.type === 'ACCOUNT' && (
                  <div className="sm:col-span-2">
                    <label className="text-xs text-white/40 font-display uppercase tracking-wider block mb-1">
                      ID tài khoản game trao thưởng
                    </label>
                    <select
                      value={form.rewardAccountId}
                      onChange={e => {
                        const acc = accounts.find(a => a.id === e.target.value)
                        setForm(p => ({
                          ...p,
                          rewardAccountId: e.target.value,
                          name: acc ? `Tài khoản ${acc.code}` : p.name,
                          value: acc ? String(acc.price || 0) : p.value,
                        }))
                      }}
                      className="input-gaming text-sm py-2"
                    >
                      <option value="">-- Chọn tài khoản trao thưởng --</option>
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.code} - {acc.title} - {formatCurrency(acc.price)}
                        </option>
                      ))}
                    </select>

                    {form.rewardAccountId && (() => {
                      const acc = accounts.find(a => a.id === form.rewardAccountId)
                      if (!acc) return null

                      return (
                        <div className="mt-3 gaming-card p-3 border border-neon-pink/20">
                          <div className="flex items-center gap-3">
                            <img
                              src={acc.thumbnailUrl || acc.images?.[0]?.url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=100&h=100&fit=crop'}
                              alt=""
                              className="w-16 h-16 rounded-xl object-cover border border-white/10"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="text-white font-bold text-sm truncate">{acc.title}</div>
                              <div className="flex flex-wrap gap-2 mt-1">
                                <span className="px-2 py-0.5 rounded bg-neon-pink/20 text-neon-pink text-[10px]">#{acc.code}</span>
                                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px]">{acc.rank}</span>
                                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 text-[10px]">{acc.server}</span>
                              </div>
                              <div className="mt-2 font-gaming text-neon-green text-sm">{formatCurrency(acc.price)}</div>
                            </div>
                          </div>
                        </div>
                      )
                    })()}

                    <p className="text-white/30 text-xs mt-1">
                      Dùng để biết acc nào sẽ được trao cho user khi quay trúng.
                    </p>
                  </div>
                )}

                {form.type === 'SPIN' && (
                  <div>
                    <label className="text-xs text-white/40 font-display uppercase tracking-wider block mb-1">
                      Số lượt quay thưởng
                    </label>
                    <input
                      type="number"
                      value={form.rewardSpinCount}
                      onChange={e => setForm(p => ({ ...p, rewardSpinCount: e.target.value }))}
                      className="input-gaming text-sm py-2"
                      placeholder="1"
                    />
                  </div>
                )}

                {form.type === 'COUPON' && (
                  <div className="sm:col-span-2">
                    <label className="text-xs text-white/40 font-display uppercase tracking-wider block mb-1">
                      Mã coupon trao thưởng
                    </label>
                    <select
                      value={form.couponCode}
                      onChange={e => {
                        const coupon = coupons.find(c => c.code === e.target.value)
                        setForm(p => ({
                          ...p,
                          couponCode: e.target.value,
                          name: coupon ? `Coupon ${coupon.code}` : p.name,
                          value: coupon ? String(coupon.value || 0) : p.value,
                        }))
                      }}
                      className="input-gaming text-sm py-2"
                    >
                      <option value="">-- Chọn coupon trao thưởng --</option>
                      {coupons.map(coupon => (
                        <option key={coupon.id} value={coupon.code}>
                          {coupon.code} - {coupon.name} - {coupon.type === 'PERCENT' ? `Giảm ${coupon.value}%` : `Giảm ${formatCurrency(coupon.value)}`}
                        </option>
                      ))}
                    </select>

                    {form.couponCode && (() => {
                      const coupon = coupons.find(c => c.code === form.couponCode)
                      if (!coupon) return null

                      return (
                        <div className="mt-3 gaming-card p-3 border border-blue-500/20">
                          <div className="flex items-start gap-3">
                            <div className="w-14 h-14 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-2xl text-blue-400">
                              <FontAwesomeIcon icon={faTicket} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-white font-bold text-sm truncate">{coupon.name}</div>
                              <div className="flex flex-wrap gap-2 mt-1">
                                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px]">{coupon.code}</span>
                                <span className="px-2 py-0.5 rounded bg-neon-green/20 text-neon-green text-[10px]">
                                  {coupon.type === 'PERCENT' ? `Giảm ${coupon.value}%` : `Giảm ${formatCurrency(coupon.value)}`}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[10px] ${coupon.isActive ? 'bg-neon-green/20 text-neon-green' : 'bg-red-500/20 text-red-400'}`}>
                                  {coupon.isActive ? 'Đang bật' : 'Đang tắt'}
                                </span>
                              </div>
                              <div className="text-white/40 text-xs mt-2">Đơn tối thiểu: {formatCurrency(coupon.minPurchase || 0)}</div>
                              {coupon.description && <div className="text-white/30 text-xs mt-1 line-clamp-2">{coupon.description}</div>}
                            </div>
                          </div>
                        </div>
                      )
                    })()}

                    <p className="text-white/30 text-xs mt-1">
                      Chọn coupon để trao cho user khi quay trúng.
                    </p>
                  </div>
                )}

                <div className="sm:col-span-2">
                  <label className="text-xs text-white/40 font-display uppercase tracking-wider block mb-1">
                    Mô tả
                  </label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    className="input-gaming text-sm py-2 resize-none"
                    rows={3}
                    placeholder="Mô tả phần thưởng..."
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))}
                  className="w-4 h-4 accent-pink-500"
                />
                <span className="text-white/70 text-sm">Đang bật phần thưởng</span>
              </label>

              <div>
                <label className="text-xs text-white/40 font-display uppercase tracking-wider block mb-2">
                  Ảnh phần thưởng
                </label>

                <label className="block border-2 border-dashed border-white/20 rounded-xl p-4 text-center cursor-pointer hover:border-neon-pink/50 transition-colors">
                  {preview ? (
                    <img src={preview} alt="" className="w-24 h-24 rounded-xl object-cover mx-auto border border-white/10" />
                  ) : (
                    <div className="py-4 text-white/40">
                      <FontAwesomeIcon icon={faImage} className="text-3xl mb-1" />
                      <p className="text-sm">Click để chọn ảnh</p>
                    </div>
                  )}
                  <input type="file" accept="image/*" hidden onChange={handleImageChange} />
                </label>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  className="btn-neon px-6 py-2.5 text-sm"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Spinner size="sm" color="white" />
                      Đang lưu...
                    </>
                  ) : editReward ? (
                    <>
                      <FontAwesomeIcon icon={faFloppyDisk} />
                      Cập nhật
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faPlus} />
                      Thêm
                    </>
                  )}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* Modal chỉnh chi phí quay */}
      {/* Modal chỉnh chi phí quay */}
      <AnimatePresence>
        {showSpinCostModal && (
          <Modal
            isOpen
            title="Cài Đặt Chi Phí Quay"
            onClose={() => setShowSpinCostModal(false)}
          >
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                <p className="text-yellow-300 text-sm font-bold mb-1 flex items-center gap-2">
                  <FontAwesomeIcon icon={faCircleInfo} />
                  Lưu ý
                </p>

                <p className="text-white/60 text-xs leading-relaxed">
                  Chi phí mỗi lượt quay sẽ được áp dụng ngay lập tức cho tất cả người dùng.
                  Hiện tại:{' '}
                  <span className="text-yellow-400 font-bold">
                    {formatCurrency(wheel?.spinCost)}
                  </span>
                  /lần
                </p>
              </div>

              <div>
                <label className="text-xs text-white/40 font-display uppercase tracking-wider block mb-2">
                  <FontAwesomeIcon icon={faCoins} className="mr-2 text-yellow-400" />
                  Số tiền mỗi lượt quay
                </label>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-400/70 text-sm">
                    <FontAwesomeIcon icon={faCoins} />
                  </span>

                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    value={spinCostInput}
                    onChange={e => setSpinCostInput(e.target.value)}
                    className="input-gaming text-sm py-2 pl-9 font-gaming text-yellow-300 placeholder:text-white/20"
                    placeholder="Ví dụ: 10000"
                    onKeyDown={e => e.key === 'Enter' && handleSaveSpinCost()}
                  />
                </div>

                {spinCostInput && !isNaN(parseFloat(spinCostInput)) && (
                  <div className="mt-3 rounded-xl border border-neon-green/20 bg-neon-green/5 p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/50">Giá mỗi lượt</span>
                      <span className="font-gaming text-neon-green font-black">
                        {formatCurrency(parseFloat(spinCostInput))}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSpinCostModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-all text-sm"
                >
                  Hủy
                </button>

                <button
                  type="button"
                  onClick={handleSaveSpinCost}
                  disabled={savingSpinCost}
                  className="flex-1 btn-primary px-4 py-3 text-sm flex items-center justify-center gap-2"
                >
                  {savingSpinCost ? (
                    <Spinner size="sm" color="white" />
                  ) : (
                    <FontAwesomeIcon icon={faFloppyDisk} />
                  )}
                  Lưu Chi Phí
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  )
}