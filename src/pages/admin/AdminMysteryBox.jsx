import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import api from '../../api/axios'
import { formatCurrency, formatDate, getRarityColor, getRarityLabel } from '../../utils/helpers'
import { Modal, Spinner, RarityBadge, Pagination } from '../../components/common/UIComponents'
import toast from 'react-hot-toast'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBoxOpen,
  faPlus,
  faPen,
  faTrash,
  faGift,
  faClipboardList,
  faImage,
  faCamera,
  faFloppyDisk,
  faCheck,
  faTriangleExclamation,
  faGamepad,
  faDice,
  faTags,
  faCoins,
  faMoneyBillWave,
  faSearch,
} from '@fortawesome/free-solid-svg-icons'

const RARITIES = ['COMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC']

const defaultRF = {
  name: '',
  type: 'BALANCE',
  value: '',
  probability: '',
  rarity: 'COMMON',
  description: '',
  rewardAccountId: '',
  rewardSpinCount: '',
  couponCode: '',
  quanHuyAmount: '',
  isActive: true,
}

const REWARD_TYPE_CONFIG = {
  BALANCE: { label: 'Tiền mặt', icon: faMoneyBillWave },
  ACCOUNT: { label: 'Tài khoản game', icon: faGamepad },
  SPIN: { label: 'Lượt quay', icon: faDice },
  COUPON: { label: 'Coupon', icon: faTags },
  QUAN_HUY: { label: 'Quân Huy', icon: faCoins },
}

export default function AdminMysteryBox() {
  const [boxes, setBoxes] = useState([])
  const [selected, setSelected] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('rewards')
  const [showBM, setShowBM] = useState(false)
  const [showRM, setShowRM] = useState(false)
  const [editB, setEditB] = useState(null)
  const [editR, setEditR] = useState(null)
  const [bf, setBf] = useState({
    name: '',
    price: '',
    description: '',
    image: null,
    imageUrl: '',
    isActive: true,
  })
  const [preview, setPreview] = useState('')
  const [rf, setRf] = useState(defaultRF)
  const [saving, setSaving] = useState(false)
  const [accounts, setAccounts] = useState([])
  const [coupons, setCoupons] = useState([])
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [history, setHistory] = useState([])
  const [historyPage, setHistoryPage] = useState(1)
  const [historyTotal, setHistoryTotal] = useState(0)
  const [historySearch, setHistorySearch] = useState('')
  const [historyRarity, setHistoryRarity] = useState('ALL')
  const [historyType, setHistoryType] = useState('ALL')

  useEffect(() => {
    fetchBoxes()
    fetchAccounts()
    fetchCoupons()
  }, [])

  useEffect(() => {
    if (selected?.id) fetchStats(selected.id)
  }, [selected?.id])

  const fetchBoxes = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/mystery-box/admin/all')
      const list = data.data || []
      setBoxes(list)

      if (list.length) {
        setSelected(prev =>
          prev ? list.find(b => b.id === prev.id) || list[0] : list[0]
        )
      } else {
        setSelected(null)
      }
    } catch (e) {
      toast.error('Lỗi tải danh sách túi mù')
    } finally {
      setLoading(false)
    }
  }

  const fetchAccounts = async () => {
    try {
      const { data } = await api.get('/accounts?admin=1&status=AVAILABLE&limit=100')
      setAccounts(data.data || [])
    } catch (e) {
      setAccounts([])
    }
  }

  const fetchCoupons = async () => {
    try {
      const { data } = await api.get('/coupons/admin?limit=100')
      setCoupons(data.data || [])
    } catch (e) {
      setCoupons([])
    }
  }

  const fetchStats = async id => {
    try {
      const { data } = await api.get(`/mystery-box/admin/${id}/stats`)
      setStats(data.data)
    } catch (e) { }
  }

  const fetchHistory = async (page = historyPage) => {
    try {
      const q = new URLSearchParams({
        page,
        limit: 10,
        ...(selected?.id && { boxId: selected.id }),
        ...(historySearch && { search: historySearch }),
        ...(historyRarity !== 'ALL' && { rarity: historyRarity }),
        ...(historyType !== 'ALL' && { type: historyType }),
      })

      const { data } = await api.get(`/mystery-box/admin/history?${q}`)

      setHistory(data.data || [])
      setHistoryTotal(data.pagination?.total || 0)
    } catch (e) { }
  }

  useEffect(() => {
    if (tab === 'openings' && selected?.id) {
      fetchHistory(historyPage)
    }
  }, [tab, selected?.id, historyPage, historySearch, historyRarity, historyType])
  const openCreateBox = () => {
    setEditB(null)
    setBf({
      name: '',
      price: '',
      description: '',
      image: null,
      imageUrl: '',
      isActive: true,
    })
    setPreview('')
    setShowBM(true)
  }

  const openEditBox = b => {
    setEditB(b)
    setBf({
      name: b.name,
      price: b.price,
      description: b.description || '',
      image: null,
      imageUrl: b.imageUrl || '',
      isActive: b.isActive,
    })
    setPreview(b.imageUrl || '')
    setShowBM(true)
  }

  const handleBoxImageChange = e => {
    const file = e.target.files?.[0]
    if (!file) return

    setBf(p => ({
      ...p,
      image: file,
    }))

    setPreview(URL.createObjectURL(file))
  }

  const saveBox = async e => {
    e.preventDefault()
    setSaving(true)

    try {
      const fd = new FormData()
      fd.append('name', bf.name)
      fd.append('price', bf.price)
      fd.append('description', bf.description || '')
      fd.append('isActive', bf.isActive)

      if (bf.image) {
        fd.append('image', bf.image)
      }

      if (editB) {
        await api.put(`/mystery-box/admin/${editB.id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      } else {
        await api.post('/mystery-box/admin', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }

      toast.success(editB ? 'Cập nhật hộp thành công' : 'Tạo hộp thành công')
      setShowBM(false)
      fetchBoxes()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi lưu hộp')
    } finally {
      setSaving(false)
    }
  }

  const deleteBox = async id => {
    if (!confirm('Xóa túi mù?')) return

    try {
      await api.delete(`/mystery-box/admin/${id}`)
      toast.success('Đã xóa túi mù')
      setSelected(null)
      fetchBoxes()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi xóa hộp')
    }
  }

  const openCreateReward = () => {
    setEditR(null)
    setRf(defaultRF)
    setShowRM(true)
  }

  const openEditReward = r => {
    setEditR(r)
    setRf({
      name: r.name || '',
      type: r.type || 'BALANCE',
      value: r.value != null ? String(r.value) : '',
      probability: r.probability != null ? String(r.probability) : '',
      rarity: r.rarity || 'COMMON',
      description: r.description || '',
      rewardAccountId: r.rewardAccountId || '',
      rewardSpinCount: r.rewardSpinCount ? String(r.rewardSpinCount) : '',
      couponCode: r.couponCode || '',
      quanHuyAmount: r.quanHuyAmount ? String(r.quanHuyAmount) : '',
      isActive: r.isActive ?? true,
    })
    setShowRM(true)
  }

  const saveReward = async e => {
    e.preventDefault()

    if (!selected?.id) {
      toast.error('Vui lòng chọn hộp')
      return
    }

    setSaving(true)

    try {
      if (editR) {
        await api.put(`/mystery-box/admin/rewards/${editR.id}`, rf)
      } else {
        await api.post(`/mystery-box/admin/${selected.id}/rewards`, {
          ...rf,
          boxId: selected.id,
        })
      }

      toast.success(editR ? 'Cập nhật phần thưởng thành công' : 'Thêm phần thưởng thành công')
      setShowRM(false)
      fetchBoxes()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi lưu phần thưởng')
    } finally {
      setSaving(false)
    }
  }

  const deleteReward = async id => {
    if (!confirm('Xóa phần thưởng này?')) return

    try {
      await api.delete(`/mystery-box/admin/rewards/${id}`)
      toast.success('Đã xóa phần thưởng')
      fetchBoxes()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi xóa phần thưởng')
    }
  }

  const toggleReward = async r => {
    try {
      await api.put(`/mystery-box/admin/rewards/${r.id}`, {
        isActive: !r.isActive,
      })
      fetchBoxes()
    } catch (e) {
      toast.error('Lỗi cập nhật trạng thái')
    }
  }

  const currentBox = boxes.find(b => b.id === selected?.id)
  const rewards = currentBox?.rewards || []

  const filteredRewards = rewards.filter(r => {
    if (statusFilter === 'ACTIVE') return r.isActive
    if (statusFilter === 'INACTIVE') return !r.isActive
    return true
  })

  const totalProb = rewards
    .filter(r => r.isActive)
    .reduce((s, r) => s + parseFloat(r.probability || 0), 0)

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-gaming text-xl font-bold text-gradient flex items-center gap-2">
          <FontAwesomeIcon icon={faBoxOpen} />
          Quản Lý Túi Mù
        </h1>

        <button
          onClick={openCreateBox}
          className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faPlus} />
          Tạo Hộp Mới
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        {boxes.map(b => (
          <div
            key={b.id}
            onClick={() => setSelected(b)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer font-display font-medium text-sm transition-all ${selected?.id === b.id
              ? 'bg-neon-purple/20 border-neon-purple/50 text-purple-400'
              : 'gaming-card text-white/60 hover:text-white'
              }`}
          >
            <span className={`w-2 h-2 rounded-full ${b.isActive ? 'bg-neon-green' : 'bg-white/20'}`} />
            {b.name}
            <span className="font-gaming text-xs">{formatCurrency(b.price)}</span>
            <span className="text-xs opacity-50">({b._count?.histories || 0} mở)</span>

            <button
              onClick={e => {
                e.stopPropagation()
                openEditBox(b)
              }}
              className="text-blue-400 ml-1"
            >
              <FontAwesomeIcon icon={faPen} />
            </button>

            <button
              onClick={e => {
                e.stopPropagation()
                deleteBox(b.id)
              }}
              className="text-red-400"
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        ))}
      </div>

      {!selected ? (
        <div className="gaming-card p-12 text-center text-white/30">
          <div className="text-5xl mb-3">
            <FontAwesomeIcon icon={faBoxOpen} />
          </div>
          Chọn hoặc tạo túi mù để quản lý phần thưởng và xem thống kê
        </div>
      ) : (
        <>
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { l: 'Tổng mở', v: stats.box?._count?.histories?.toLocaleString() || 0, i: faBoxOpen },
                { l: 'Doanh thu', v: formatCurrency(stats.totalRevenue), i: faMoneyBillWave },
                { l: 'Huyền Thoại', v: stats.rarityStats?.find(r => r.rarity === 'LEGENDARY')?._count || 0, i: faGift },
                { l: 'Thần Thoại', v: stats.rarityStats?.find(r => r.rarity === 'MYTHIC')?._count || 0, i: faCoins },
              ].map((s, i) => (
                <div key={i} className="gaming-card p-4">
                  <div className="text-2xl mb-2 text-purple-400">
                    <FontAwesomeIcon icon={s.i} />
                  </div>
                  <div className="font-gaming font-bold text-lg text-white">{s.v}</div>
                  <div className="text-white/40 text-xs">{s.l}</div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 border-b border-white/10 pb-2">
            {[
              ['rewards', faGift, 'Phần thưởng'],
              ['openings', faClipboardList, 'Lịch sử mở'],
            ].map(([t, icon, l]) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-t-lg font-display font-medium text-sm transition-all flex items-center gap-2 ${tab === t
                  ? 'bg-purple-500/20 text-purple-400 border-b-2 border-purple-400'
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
                  <span className={`font-gaming font-bold ${totalProb > 1.001 ? 'text-red-400' : totalProb > 0.999 ? 'text-neon-green' : 'text-yellow-400'}`}>
                    {(totalProb * 100).toFixed(2)}%
                  </span>
                </div>

                <div className="h-3 bg-dark-700 rounded-full overflow-hidden flex">
                  {rewards
                    .filter(r => r.isActive)
                    .sort((a, b) => parseFloat(b.probability) - parseFloat(a.probability))
                    .map(r => (
                      <div
                        key={r.id}
                        className="h-full"
                        style={{
                          width: `${Math.min(parseFloat(r.probability) * 100, 100)}%`,
                          background: getRarityColor(r.rarity),
                        }}
                        title={r.name}
                      />
                    ))}
                </div>

                {totalProb < 0.999 && (
                  <p className="text-yellow-400 text-xs mt-1 flex items-center gap-1">
                    <FontAwesomeIcon icon={faTriangleExclamation} />
                    Tổng xác suất chưa đủ 100%
                  </p>
                )}

                {totalProb > 1.001 && (
                  <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
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
                        ? 'bg-purple-500/20 border border-purple-400/40 text-purple-400'
                        : 'bg-dark-600 border border-white/10 text-white/50 hover:text-white'
                        }`}
                    >
                      {label}
                    </button>
                  ))}

                  <button
                    onClick={openCreateReward}
                    className="btn-primary px-4 py-1.5 text-xs flex items-center gap-1"
                  >
                    <FontAwesomeIcon icon={faPlus} />
                    Thêm
                  </button>
                </div>
              </div>

              <div className="gaming-card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-xs text-white/40 uppercase">
                      <th className="text-left p-3">Phần thưởng</th>
                      <th className="text-center p-3">Loại</th>
                      <th className="text-right p-3">Giá trị</th>
                      <th className="text-center p-3">Xác suất</th>
                      <th className="text-center p-3">Độ hiếm</th>
                      <th className="text-right p-3">Thắng</th>
                      <th className="text-center p-3">Active</th>
                      <th className="text-right p-3">Sửa/Xóa</th>
                    </tr>
                  </thead>

                  <tbody>
                    {[...filteredRewards]
                      .sort((a, b) => parseFloat(b.probability) - parseFloat(a.probability))
                      .map(r => (
                        <tr key={r.id} className={`border-b border-white/5 hover:bg-white/2 ${!r.isActive ? 'opacity-40' : ''}`}>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{
                                  background: getRarityColor(r.rarity),
                                  boxShadow: `0 0 6px ${getRarityColor(r.rarity)}`,
                                }}
                              />

                              <div>
                                <div className="text-white font-medium">
                                  {r.name}
                                </div>
                                {r.description && (
                                  <div className="text-white/30 text-xs line-clamp-1">
                                    {r.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="p-3 text-center text-white/50 text-xs">{r.type}</td>

                          <td className="p-3 text-right font-gaming font-bold text-neon-green text-sm">
                            {r.type === 'QUAN_HUY'
                              ? `${r.quanHuyAmount || 0} QH`
                              : formatCurrency(r.value)}
                          </td>

                          <td className="p-3 text-center text-white/60 text-xs">
                            {(parseFloat(r.probability) * 100).toFixed(2)}%
                          </td>

                          <td className="p-3 text-center">
                            <RarityBadge rarity={r.rarity} size="xs" />
                          </td>

                          <td className="p-3 text-right text-white/40 text-xs">
                            {r.wonCount || 0}
                          </td>

                          <td className="p-3 text-center">
                            <button
                              onClick={() => toggleReward(r)}
                              className={`w-8 h-4 rounded-full transition-colors relative ${r.isActive ? 'bg-neon-green' : 'bg-white/20'}`}
                            >
                              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${r.isActive ? 'left-4' : 'left-0.5'}`} />
                            </button>
                          </td>

                          <td className="p-3 text-right">
                            <div className="flex justify-end gap-1">
                              <button onClick={() => openEditReward(r)} className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs">
                                <FontAwesomeIcon icon={faPen} />
                              </button>
                              <button onClick={() => deleteReward(r.id)} className="px-2 py-1 rounded bg-red-500/20 text-red-400 text-xs">
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === 'openings' && (
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
                      {getRarityLabel(r)}
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
                    <tr className="border-b border-white/5 text-xs text-white/40 uppercase">
                      <th className="text-left p-3">Người dùng</th>
                      <th className="text-left p-3">Hộp</th>
                      <th className="text-left p-3">Nhận được</th>
                      <th className="text-center p-3">Loại</th>
                      <th className="text-center p-3">Độ hiếm</th>
                      <th className="text-right p-3">Giá trị</th>
                      <th className="text-center p-3">Thời gian</th>
                    </tr>
                  </thead>

                  <tbody>
                    {history.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-10 text-white/30">
                          Không có lịch sử
                        </td>
                      </tr>
                    ) : (
                      history.map(h => {
                        const typeCfg = REWARD_TYPE_CONFIG[h.reward?.type]

                        return (
                          <tr key={h.id} className="border-b border-white/5 hover:bg-white/2">
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <img
                                  src={h.user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${h.user?.username}`}
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

                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                {h.box?.imageUrl && (
                                  <img
                                    src={h.box.imageUrl}
                                    alt=""
                                    className="w-8 h-8 rounded-lg object-cover border border-white/10"
                                  />
                                )}

                                <div>
                                  <div className="text-white text-xs font-medium">
                                    {h.box?.name}
                                  </div>
                                  <div className="text-white/30 text-[10px]">
                                    Giá mở: {formatCurrency(h.boxPrice)}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{
                                    background: getRarityColor(h.rarity),
                                    boxShadow: `0 0 6px ${getRarityColor(h.rarity)}`
                                  }}
                                />

                                <div>
                                  <div className="text-white text-xs font-medium">
                                    {h.rewardName}
                                  </div>
                                  {h.reward?.description && (
                                    <div className="text-white/30 text-[10px] line-clamp-1">
                                      {h.reward.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="p-3 text-center">
                              {typeCfg ? (
                                <span className="inline-flex items-center gap-1.5 text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">
                                  <FontAwesomeIcon icon={typeCfg.icon} />
                                  {typeCfg.label}
                                </span>
                              ) : (
                                <span className="text-white/30 text-xs">
                                  {h.reward?.type || 'N/A'}
                                </span>
                              )}
                            </td>

                            <td className="p-3 text-center">
                              <RarityBadge rarity={h.rarity} size="xs" />
                            </td>

                            <td className="p-3 text-right">
                              <span className="font-bold text-neon-green text-xs">
                                {h.reward?.type === 'QUAN_HUY'
                                  ? `${h.reward?.quanHuyAmount || h.rewardValue || 0} QH`
                                  : formatCurrency(h.rewardValue)}
                              </span>
                            </td>

                            <td className="p-3 text-center text-white/40 text-xs">
                              {formatDate(h.createdAt)}
                            </td>
                          </tr>
                        )
                      })
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
        </>
      )}

      <AnimatePresence>
        {showBM && (
          <Modal
            isOpen
            title={
              <span className="flex items-center gap-2">
                <FontAwesomeIcon icon={editB ? faPen : faBoxOpen} />
                {editB ? 'Sửa Hộp' : 'Tạo Hộp Mới'}
              </span>
            }
            onClose={() => !saving && setShowBM(false)}
          >
            <form onSubmit={saveBox} className="space-y-4">
              <div>
                <label className="text-xs text-white/40 uppercase font-display block mb-2">
                  Tên hộp *
                </label>
                <input
                  value={bf.name}
                  onChange={e => setBf(p => ({ ...p, name: e.target.value }))}
                  required
                  className="input-gaming"
                />
              </div>

              <div>
                <label className="text-xs text-white/40 uppercase font-display block mb-2">
                  Giá mở hộp *
                </label>
                <input
                  type="number"
                  value={bf.price}
                  onChange={e => setBf(p => ({ ...p, price: e.target.value }))}
                  required
                  className="input-gaming"
                />
              </div>

              <div>
                <label className="text-xs text-white/40 uppercase font-display block mb-2">
                  Mô tả
                </label>
                <textarea
                  value={bf.description}
                  onChange={e => setBf(p => ({ ...p, description: e.target.value }))}
                  rows={2}
                  className="input-gaming resize-none"
                />
              </div>

              <div>
                <label className="text-xs text-white/40 uppercase font-display block mb-2">
                  Ảnh hộp
                </label>

                <div
                  onClick={() => document.getElementById('mystery-box-image')?.click()}
                  className="border-2 border-dashed border-white/20 rounded-2xl p-4 text-center cursor-pointer hover:border-purple-400/50 transition-colors bg-dark-700/40"
                >
                  {preview ? (
                    <div className="relative group">
                      <img
                        src={preview}
                        alt=""
                        className="w-full h-40 object-cover rounded-xl border border-white/10"
                      />

                      <div className="absolute inset-0 rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-sm font-bold flex items-center gap-2">
                          <FontAwesomeIcon icon={faCamera} />
                          Đổi ảnh
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8">
                      <div className="text-5xl mb-3 text-white/30">
                        <FontAwesomeIcon icon={faImage} />
                      </div>

                      <p className="text-white/60 text-sm font-bold">
                        Click để upload ảnh hộp
                      </p>

                      <p className="text-white/25 text-xs mt-1">
                        JPG, PNG, WebP
                      </p>
                    </div>
                  )}
                </div>

                <input
                  id="mystery-box-image"
                  type="file"
                  accept="image/*"
                  onChange={handleBoxImageChange}
                  className="hidden"
                />

                {bf.image && (
                  <p className="text-neon-green text-xs mt-2 flex items-center gap-1">
                    <FontAwesomeIcon icon={faCheck} />
                    Đã chọn: {bf.image.name}
                  </p>
                )}
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bf.isActive}
                  onChange={e => setBf(p => ({ ...p, isActive: e.target.checked }))}
                  className="w-4 h-4 accent-pink-500"
                />
                <span className="text-white/70 text-sm">Hiển thị hộp</span>
              </label>

              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowBM(false)} className="btn-neon px-5 py-2 text-sm">
                  Hủy
                </button>

                <button type="submit" disabled={saving} className="btn-primary px-5 py-2 text-sm flex items-center gap-2">
                  {saving ? (
                    <>
                      <Spinner size="sm" color="white" />
                      Đang lưu...
                    </>
                  ) : editB ? (
                    <>
                      <FontAwesomeIcon icon={faFloppyDisk} />
                      Cập nhật
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faPlus} />
                      Tạo
                    </>
                  )}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRM && (
          <Modal
            isOpen
            title={
              <span className="flex items-center gap-2">
                <FontAwesomeIcon icon={editR ? faPen : faGift} />
                {editR ? 'Sửa Phần Thưởng' : 'Thêm Phần Thưởng'}
              </span>
            }
            onClose={() => !saving && setShowRM(false)}
          >
            <form onSubmit={saveReward} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs text-white/40 uppercase font-display block mb-2">Tên *</label>
                  <input value={rf.name} onChange={e => setRf(p => ({ ...p, name: e.target.value }))} required className="input-gaming" />
                </div>

                <div>
                  <label className="text-xs text-white/40 uppercase font-display block mb-2">Loại thưởng</label>
                  <select value={rf.type} onChange={e => setRf(p => ({ ...p, type: e.target.value }))} className="input-gaming">
                    <option value="BALANCE">Tiền mặt</option>
                    <option value="ACCOUNT">Tài khoản game</option>
                    <option value="SPIN">Lượt quay</option>
                    <option value="COUPON">Coupon</option>
                    <option value="QUAN_HUY">Quân Huy</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-white/40 uppercase font-display block mb-2">Giá trị *</label>
                  <input type="number" value={rf.value} onChange={e => setRf(p => ({ ...p, value: e.target.value }))} required className="input-gaming" />
                </div>

                <div>
                  <label className="text-xs text-white/40 uppercase font-display block mb-2">Xác suất *</label>
                  <input type="number" step="0.0001" min="0.0001" max="1" value={rf.probability} onChange={e => setRf(p => ({ ...p, probability: e.target.value }))} required className="input-gaming" />
                  {rf.probability && <p className="text-white/40 text-xs mt-1">= {(parseFloat(rf.probability || 0) * 100).toFixed(2)}%</p>}
                </div>

                <div>
                  <label className="text-xs text-white/40 uppercase font-display block mb-2">Độ hiếm</label>
                  <select value={rf.rarity} onChange={e => setRf(p => ({ ...p, rarity: e.target.value }))} className="input-gaming">
                    {RARITIES.map(r => <option key={r} value={r}>{getRarityLabel(r)}</option>)}
                  </select>
                </div>

                {rf.type === 'QUAN_HUY' && (
                  <div>
                    <label className="text-xs text-white/40 uppercase font-display block mb-2">Số Quân Huy</label>
                    <input type="number" value={rf.quanHuyAmount} onChange={e => setRf(p => ({ ...p, quanHuyAmount: e.target.value }))} className="input-gaming" placeholder="100" />
                  </div>
                )}

                {rf.type === 'SPIN' && (
                  <div>
                    <label className="text-xs text-white/40 uppercase font-display block mb-2">Số lượt quay</label>
                    <input type="number" value={rf.rewardSpinCount} onChange={e => setRf(p => ({ ...p, rewardSpinCount: e.target.value }))} placeholder="1" className="input-gaming" />
                  </div>
                )}

                {rf.type === 'ACCOUNT' && (
                  <div className="sm:col-span-2">
                    <label className="text-xs text-white/40 uppercase font-display block mb-2">Tài khoản game trao thưởng</label>
                    <select
                      value={rf.rewardAccountId}
                      onChange={e => {
                        const acc = accounts.find(a => a.id === e.target.value)
                        setRf(p => ({
                          ...p,
                          rewardAccountId: e.target.value,
                          name: acc ? `Tài khoản ${acc.code}` : p.name,
                          value: acc ? String(acc.price || 0) : p.value,
                        }))
                      }}
                      className="input-gaming"
                    >
                      <option value="">-- Chọn tài khoản trao thưởng --</option>
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.code} - {acc.title} - {formatCurrency(acc.price)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {rf.type === 'COUPON' && (
                  <div className="sm:col-span-2">
                    <label className="text-xs text-white/40 uppercase font-display block mb-2">Coupon trao thưởng</label>
                    <select
                      value={rf.couponCode}
                      onChange={e => {
                        const coupon = coupons.find(c => c.code === e.target.value)
                        setRf(p => ({
                          ...p,
                          couponCode: e.target.value,
                          name: coupon ? `Coupon ${coupon.code}` : p.name,
                          value: coupon ? String(coupon.value || 0) : p.value,
                        }))
                      }}
                      className="input-gaming"
                    >
                      <option value="">-- Chọn coupon trao thưởng --</option>
                      {coupons.map(coupon => (
                        <option key={coupon.id} value={coupon.code}>
                          {coupon.code} - {coupon.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="sm:col-span-2">
                  <label className="text-xs text-white/40 uppercase font-display block mb-2">Mô tả</label>
                  <textarea value={rf.description} onChange={e => setRf(p => ({ ...p, description: e.target.value }))} rows={3} className="input-gaming resize-none" />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={rf.isActive} onChange={e => setRf(p => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 accent-pink-500" />
                <span className="text-white/70 text-sm">Đang bật phần thưởng</span>
              </label>

              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowRM(false)} className="btn-neon px-5 py-2 text-sm">
                  Hủy
                </button>

                <button type="submit" disabled={saving} className="btn-primary px-5 py-2 text-sm flex items-center gap-2">
                  {saving ? (
                    <>
                      <Spinner size="sm" color="white" />
                      Đang lưu...
                    </>
                  ) : editR ? (
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
    </div>
  )
}