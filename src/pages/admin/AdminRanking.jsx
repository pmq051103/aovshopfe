import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faTrophy, faGift, faPen, faFloppyDisk, faTrash, faPlus, faXmark,
    faMedal, faCrown, faSearch, faRotate, faCheck, faCoins, faMoneyBillWave,
    faSun, faCalendarWeek, faCalendarDays, faFilter, faUser, faRankingStar,
    faChevronLeft, faChevronRight, faHistory,
} from '@fortawesome/free-solid-svg-icons'
import api from '../../api/axios'
import { formatCurrency, formatDate } from '../../utils/helpers'
import { Spinner, Pagination } from '../../components/common/UIComponents'
import toast from 'react-hot-toast'

const PERIOD_OPTIONS = [
    { value: 'daily', label: 'Hôm Nay', icon: faSun },
    { value: 'weekly', label: 'Tuần Này', icon: faCalendarWeek },
    { value: 'monthly', label: 'Tháng Này', icon: faCalendarDays },
]

const REWARD_TYPE_OPTIONS = [
    { value: 'BALANCE', label: 'Tiền thưởng (số dư)', icon: faMoneyBillWave },
    { value: 'QUAN_HUY', label: 'Quân Huy', icon: faCoins },
    { value: 'CUSTOM', label: 'Phần thưởng khác', icon: faGift },
]

function RewardModal({ onClose, onSaved }) {
    const [rewards, setRewards] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        api.get('/ranking/admin/rewards')
            .then(r => setRewards(r.data.data || []))
            .catch(() => toast.error('Lỗi tải cấu hình'))
            .finally(() => setLoading(false))
    }, [])

    const addReward = () => {
        const nextRank = rewards.length > 0 ? Math.max(...rewards.map(r => r.rank)) + 1 : 1
        setRewards(prev => [...prev, { rank: nextRank, label: `Hạng ${nextRank}`, reward: '', rewardAmount: 0, type: 'BALANCE' }])
    }

    const removeReward = (idx) => setRewards(prev => prev.filter((_, i) => i !== idx))

    const updateReward = (idx, field, val) => {
        setRewards(prev => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r))
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            await api.put('/ranking/admin/rewards', { rewards })
            toast.success('Lưu cấu hình phần thưởng thành công!')
            onSaved()
            onClose()
        } catch (e) {
            toast.error(e.response?.data?.message || 'Lỗi lưu')
        } finally {
            setSaving(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={e => e.target === e.currentTarget && onClose()}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="gaming-card border border-white/10 w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto"
            >
                <div className="flex items-center justify-between mb-5">
                    <h3 className="font-gaming font-bold text-white text-lg flex items-center gap-2">
                        <FontAwesomeIcon icon={faGift} className="text-yellow-400" />
                        Cấu Hình Phần Thưởng Xếp Hạng
                    </h3>
                    <button onClick={onClose} className="text-white/40 hover:text-white text-xl">
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-10"><Spinner size="lg" /></div>
                ) : (
                    <>
                        <div className="space-y-3 mb-5">
                            {rewards.map((rw, idx) => (
                                <div key={idx} className="gaming-card p-4 border border-white/5">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="text-yellow-400 text-lg w-8 text-center">
                                            {rw.rank === 1 ? <FontAwesomeIcon icon={faCrown} style={{ color: '#FFD700' }} /> :
                                                rw.rank === 2 ? <FontAwesomeIcon icon={faMedal} style={{ color: '#C0C0C0' }} /> :
                                                    rw.rank === 3 ? <FontAwesomeIcon icon={faMedal} style={{ color: '#CD7F32' }} /> :
                                                        <span className="font-gaming font-bold text-white/50 text-sm">#{rw.rank}</span>}
                                        </div>
                                        <span className="font-bold text-white text-sm flex-1">Hạng #{rw.rank}</span>
                                        <button onClick={() => removeReward(idx)} className="text-red-400/60 hover:text-red-400 text-sm">
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs text-white/40 uppercase font-display block mb-1">Loại thưởng</label>
                                            <select
                                                value={rw.type}
                                                onChange={e => updateReward(idx, 'type', e.target.value)}
                                                className="input-gaming text-sm py-2"
                                            >
                                                {REWARD_TYPE_OPTIONS.map(t => (
                                                    <option key={t.value} value={t.value}>{t.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs text-white/40 uppercase font-display block mb-1">Số tiền / Giá trị</label>
                                            <input
                                                type="number"
                                                value={rw.rewardAmount}
                                                onChange={e => {
                                                    const val = parseFloat(e.target.value) || 0
                                                    updateReward(idx, 'rewardAmount', val)
                                                    if (rw.type === 'BALANCE') updateReward(idx, 'reward', formatCurrency(val))
                                                    else if (rw.type === 'QUAN_HUY') updateReward(idx, 'reward', `${val.toLocaleString('vi-VN')} QH`)
                                                }}
                                                className="input-gaming text-sm py-2"
                                                min="0"
                                            />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="text-xs text-white/40 uppercase font-display block mb-1">Mô tả hiển thị</label>
                                            <input
                                                value={rw.reward}
                                                onChange={e => updateReward(idx, 'reward', e.target.value)}
                                                placeholder="VD: 500,000đ hoặc Skin Đặc Biệt..."
                                                className="input-gaming text-sm py-2"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={addReward}
                            className="w-full py-2.5 rounded-xl border border-dashed border-white/20 text-white/40 hover:text-white hover:border-white/40 text-sm flex items-center justify-center gap-2 mb-5 transition-all"
                        >
                            <FontAwesomeIcon icon={faPlus} />
                            Thêm hạng thưởng
                        </button>

                        <div className="flex gap-3">
                            <button onClick={onClose} className="btn-neon flex-1 py-3 text-sm">Hủy</button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="btn-primary flex-1 py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {saving ? <Spinner size="sm" color="white" /> : <><FontAwesomeIcon icon={faFloppyDisk} /> Lưu cấu hình</>}
                            </button>
                        </div>
                    </>
                )}
            </motion.div>
        </motion.div>
    )
}

function RewardUserModal({ ranking, onClose, onSuccess }) {
    const [amount, setAmount] = useState(ranking.reward?.rewardAmount || 0)
    const [note, setNote] = useState(`Thưởng xếp hạng #${ranking.rank} kỳ ${ranking.periodKey}`)
    const [loading, setLoading] = useState(false)

    const handleReward = async () => {
        if (!amount || amount <= 0) return toast.error('Nhập số tiền thưởng')
        setLoading(true)
        try {
            await api.post(`/ranking/admin/rankings/${ranking.id}/reward`, { rewardAmount: amount, note })
            toast.success('Trao thưởng thành công!')
            onSuccess()
            onClose()
        } catch (e) {
            toast.error(e.response?.data?.message || 'Lỗi trao thưởng')
        } finally {
            setLoading(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={e => e.target === e.currentTarget && onClose()}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="gaming-card border border-white/10 w-full max-w-md p-6"
            >
                <div className="flex items-center justify-between mb-5">
                    <h3 className="font-gaming font-bold text-white text-lg flex items-center gap-2">
                        <FontAwesomeIcon icon={faGift} className="text-yellow-400" />
                        Trao Thưởng
                    </h3>
                    <button onClick={onClose} className="text-white/40 hover:text-white text-xl">
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                </div>

                <div className="bg-dark-700 rounded-xl p-4 mb-4 border border-white/5">
                    <div className="flex items-center gap-3">
                        <img
                            src={ranking.user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${ranking.user?.username}`}
                            alt="" className="w-10 h-10 rounded-full border border-white/10"
                        />
                        <div>
                            <p className="font-bold text-white">{ranking.user?.displayName || ranking.user?.username}</p>
                            <p className="text-white/40 text-xs">Hạng #{ranking.rank} — {formatCurrency(ranking.totalDeposit)} đã nạp</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-3 mb-5">
                    <div>
                        <label className="text-xs text-white/40 uppercase font-display block mb-1">Số tiền thưởng (VND)</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                            className="input-gaming text-sm py-2"
                            min="0"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-white/40 uppercase font-display block mb-1">Ghi chú</label>
                        <input
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            className="input-gaming text-sm py-2"
                        />
                    </div>
                </div>

                <div className="flex gap-3">
                    <button onClick={onClose} className="btn-neon flex-1 py-3 text-sm">Hủy</button>
                    <button
                        onClick={handleReward}
                        disabled={loading}
                        className="btn-primary flex-1 py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? <Spinner size="sm" color="white" /> : <><FontAwesomeIcon icon={faGift} /> Trao thưởng</>}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    )
}

const getWeek = date => {
    const onejan = new Date(date.getFullYear(), 0, 1)
    return Math.ceil((((date - onejan) / 86400000) + onejan.getDay() + 1) / 7)
}

// Sinh periodKey cho offset tháng/tuần trước (offset=0 = hiện tại, offset=-1 = trước 1 kỳ)
const getPastPeriodKey = (period, offset = 0) => {
    const now = new Date()
    if (period === 'monthly') {
        const d = new Date(now.getFullYear(), now.getMonth() + offset, 1)
        return `monthly_${d.getFullYear()}_${d.getMonth() + 1}`
    }
    if (period === 'weekly') {
        const d = new Date(now)
        d.setDate(d.getDate() + offset * 7)
        return `weekly_${d.getFullYear()}_${getWeek(d)}`
    }
    if (period === 'daily') {
        const d = new Date(now)
        d.setDate(d.getDate() + offset)
        return `daily_${d.getFullYear()}_${d.getMonth() + 1}_${d.getDate()}`
    }
    return null
}

const formatPeriodLabel = (period, offset) => {
    if (offset === 0) {
        if (period === 'monthly') return 'Tháng này'
        if (period === 'weekly') return 'Tuần này'
        return 'Hôm nay'
    }
    const now = new Date()
    if (period === 'monthly') {
        const d = new Date(now.getFullYear(), now.getMonth() + offset, 1)
        return `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`
    }
    if (period === 'weekly') {
        const d = new Date(now)
        d.setDate(d.getDate() + offset * 7)
        return `Tuần ${getWeek(d)}/${d.getFullYear()}`
    }
    if (period === 'daily') {
        const d = new Date(now)
        d.setDate(d.getDate() + offset)
        return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
    }
    return ''
}

export default function AdminRanking() {
    const [tab, setTab] = useState('rankings')
    const [period, setPeriod] = useState('daily')
    const [periodOffset, setPeriodOffset] = useState(0)
    const [search, setSearch] = useState('')
    const [searchInput, setSearchInput] = useState('')
    const [page, setPage] = useState(1)
    const [rankings, setRankings] = useState([])
    const [rewards, setRewards] = useState([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(false)
    const [showRewardModal, setShowRewardModal] = useState(false)
    const [rewardTarget, setRewardTarget] = useState(null)

    useEffect(() => {
        fetchRankings()
    }, [period, periodOffset, search, page])

    const fetchRankings = async () => {
        setLoading(true)
        try {
            const periodKey = periodOffset === 0 ? period : getPastPeriodKey(period, periodOffset)
            const q = new URLSearchParams({ period: periodKey, page, limit: 20, ...(search && { search }) })
            const { data } = await api.get(`/ranking/admin/rankings?${q}`)
            setRankings(data.data || [])
            setRewards(data.rewards || [])
            setTotal(data.pagination?.total || 0)
        } catch (e) {
            toast.error('Lỗi tải dữ liệu ranking')
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = () => {
        setSearch(searchInput)
        setPage(1)
    }

    const getRankIcon = (rank) => {
        if (rank === 1) return <FontAwesomeIcon icon={faCrown} style={{ color: '#FFD700' }} />
        if (rank === 2) return <FontAwesomeIcon icon={faMedal} style={{ color: '#C0C0C0' }} />
        if (rank === 3) return <FontAwesomeIcon icon={faMedal} style={{ color: '#CD7F32' }} />
        return <span className="font-gaming font-bold text-white/50 text-sm">#{rank}</span>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <h2 className="font-gaming text-xl font-bold text-white flex items-center gap-2">
                    <FontAwesomeIcon icon={faTrophy} className="text-yellow-400" />
                    Quản Lý Bảng Xếp Hạng
                </h2>
                <button
                    onClick={() => setShowRewardModal(true)}
                    className="btn-primary px-4 py-2 text-sm flex items-center gap-2"
                >
                    <FontAwesomeIcon icon={faGift} />
                    Cấu hình phần thưởng
                </button>
            </div>

            {/* Tab */}
            <div className="flex gap-2">
                {[
                    { v: 'rankings', icon: faRankingStar, label: 'Bảng xếp hạng' },
                    { v: 'rewards', icon: faGift, label: 'Phần thưởng' },
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

            {tab === 'rankings' && (
                <>
                    {/* Bộ lọc */}
                    <div className="gaming-card p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label className="text-xs text-white/40 uppercase font-display block mb-1">Kỳ</label>
                                <div className="flex gap-2 flex-wrap">
                                    {PERIOD_OPTIONS.map(o => (
                                        <button
                                            key={o.value}
                                            onClick={() => { setPeriod(o.value); setPeriodOffset(0); setPage(1) }}
                                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${period === o.value
                                                    ? 'bg-neon-pink/20 border-neon-pink/50 text-neon-pink'
                                                    : 'border-white/10 text-white/50 hover:text-white'
                                                }`}
                                        >
                                            <FontAwesomeIcon icon={o.icon} />
                                            {o.label}
                                        </button>
                                    ))}
                                </div>
                                {/* Navigator kỳ trước */}
                                <div className="flex items-center gap-2 mt-2">
                                    <button
                                        onClick={() => { setPeriodOffset(o => o - 1); setPage(1) }}
                                        className="w-7 h-7 rounded-lg border border-white/10 text-white/50 hover:text-white hover:border-white/30 flex items-center justify-center transition-all"
                                        title="Kỳ trước"
                                    >
                                        <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
                                    </button>
                                    <span className={`text-xs font-semibold px-3 py-1 rounded-lg border ${periodOffset === 0 ? 'text-neon-pink border-neon-pink/30 bg-neon-pink/10' : 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10'}`}>
                                        {periodOffset < 0 && <FontAwesomeIcon icon={faHistory} className="mr-1.5 text-yellow-400" />}
                                        {formatPeriodLabel(period, periodOffset)}
                                    </span>
                                    <button
                                        onClick={() => { setPeriodOffset(o => Math.min(o + 1, 0)); setPage(1) }}
                                        disabled={periodOffset === 0}
                                        className="w-7 h-7 rounded-lg border border-white/10 text-white/50 hover:text-white hover:border-white/30 flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                        title="Kỳ sau"
                                    >
                                        <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
                                    </button>
                                    {periodOffset < 0 && (
                                        <button
                                            onClick={() => { setPeriodOffset(0); setPage(1) }}
                                            className="text-xs text-white/40 hover:text-white transition-colors underline"
                                        >
                                            Về hiện tại
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="sm:col-span-2">
                                <label className="text-xs text-white/40 uppercase font-display block mb-1">Tìm người dùng</label>
                                <div className="flex gap-2">
                                    <input
                                        value={searchInput}
                                        onChange={e => setSearchInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                        placeholder="Tìm theo username..."
                                        className="input-gaming text-sm py-2 flex-1"
                                    />
                                    <button onClick={handleSearch} className="btn-primary px-4 py-2 text-sm">
                                        <FontAwesomeIcon icon={faSearch} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSearch('')
                                            setSearchInput('')
                                            setPage(1)
                                            fetchRankings()
                                        }}
                                        className="px-3 py-2 rounded-xl border border-white/10 text-white/40 hover:text-white text-sm"
                                    >
                                        <FontAwesomeIcon icon={faRotate} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="gaming-card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="text-left p-4 text-white/40 font-display uppercase text-xs">Hạng</th>
                                        <th className="text-left p-4 text-white/40 font-display uppercase text-xs">Người dùng</th>
                                        <th className="text-right p-4 text-white/40 font-display uppercase text-xs">Tổng nạp</th>
                                        <th className="text-right p-4 text-white/40 font-display uppercase text-xs">Phần thưởng</th>
                                        <th className="text-right p-4 text-white/40 font-display uppercase text-xs">Trạng thái</th>
                                        <th className="text-right p-4 text-white/40 font-display uppercase text-xs">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="text-center py-12">
                                                <Spinner size="lg" />
                                            </td>
                                        </tr>
                                    ) : rankings.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="text-center py-12 text-white/30">
                                                <FontAwesomeIcon icon={faTrophy} className="text-4xl mb-2 block mx-auto" />
                                                Chưa có dữ liệu xếp hạng
                                            </td>
                                        </tr>
                                    ) : (
                                        rankings.map((r) => (
                                            <motion.tr
                                                key={r.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                                            >
                                                <td className="p-4">
                                                    <div className="w-10 h-10 flex items-center justify-center text-lg">
                                                        {getRankIcon(r.rank)}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <img
                                                            src={r.user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.user?.username}`}
                                                            alt="" className="w-9 h-9 rounded-full border border-white/10"
                                                        />
                                                        <div>
                                                            <p className="font-medium text-white">{r.user?.displayName || r.user?.username}</p>
                                                            <p className="text-white/40 text-xs">@{r.user?.username}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <span className="font-gaming font-bold text-neon-green">
                                                        {formatCurrency(r.totalDeposit)}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    {r.reward ? (
                                                        <span className="text-yellow-400 font-bold text-sm">{r.reward.reward}</span>
                                                    ) : (
                                                        <span className="text-white/20 text-xs">—</span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right">
                                                    {r.rewardClaimed ? (
                                                        <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-neon-green/10 border border-neon-green/30 text-neon-green">
                                                            <FontAwesomeIcon icon={faCheck} className="mr-1" />
                                                            Đã trao
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-yellow-400/10 border border-yellow-400/30 text-yellow-400">
                                                            Chưa trao
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right">
                                                    {!r.rewardClaimed && r.reward && (
                                                        <button
                                                            onClick={() => setRewardTarget(r)}
                                                            className="px-3 py-1.5 rounded-lg bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-xs font-bold hover:bg-yellow-400/20 transition-all"
                                                        >
                                                            <FontAwesomeIcon icon={faGift} className="mr-1" />
                                                            Trao thưởng
                                                        </button>
                                                    )}
                                                </td>
                                            </motion.tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <Pagination page={page} pages={Math.ceil(total / 20)} onPageChange={setPage} />
                </>
            )}

            {tab === 'rewards' && (
                <div className="gaming-card p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="font-gaming text-base font-bold text-white flex items-center gap-2">
                            <FontAwesomeIcon icon={faGift} className="text-yellow-400" />
                            Cấu Hình Phần Thưởng Hiện Tại
                        </h3>
                        <button
                            onClick={() => setShowRewardModal(true)}
                            className="btn-primary px-4 py-2 text-sm flex items-center gap-2"
                        >
                            <FontAwesomeIcon icon={faPen} />
                            Chỉnh sửa
                        </button>
                    </div>

                    {rewards.length === 0 ? (
                        <div className="text-center py-10 text-white/30">
                            <FontAwesomeIcon icon={faGift} className="text-4xl mb-2 block mx-auto" />
                            <p>Chưa có cấu hình phần thưởng</p>
                            <button
                                onClick={() => setShowRewardModal(true)}
                                className="btn-primary px-6 py-2 text-sm mt-4 mx-auto block"
                            >
                                Thêm phần thưởng
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {rewards.map((rw) => (
                                <div
                                    key={rw.rank}
                                    className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-dark-700/50"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-dark-600 flex items-center justify-center text-2xl">
                                            {rw.rank === 1 ? <FontAwesomeIcon icon={faCrown} style={{ color: '#FFD700' }} /> :
                                                rw.rank === 2 ? <FontAwesomeIcon icon={faMedal} style={{ color: '#C0C0C0' }} /> :
                                                    rw.rank === 3 ? <FontAwesomeIcon icon={faMedal} style={{ color: '#CD7F32' }} /> :
                                                        <span className="font-gaming font-bold text-white/60 text-base">#{rw.rank}</span>}
                                        </div>
                                        <div>
                                            <p className="font-bold text-white">Hạng #{rw.rank}</p>
                                            <p className="text-white/40 text-xs">
                                                {REWARD_TYPE_OPTIONS.find(t => t.value === rw.type)?.label || rw.type}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-gaming font-bold text-neon-green text-lg">{rw.reward}</p>
                                        {rw.rewardAmount > 0 && (
                                            <p className="text-white/30 text-xs">{rw.rewardAmount.toLocaleString('vi-VN')}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <AnimatePresence>
                {showRewardModal && (
                    <RewardModal
                        onClose={() => setShowRewardModal(false)}
                        onSaved={() => fetchRankings()}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {rewardTarget && (
                    <RewardUserModal
                        ranking={rewardTarget}
                        onClose={() => setRewardTarget(null)}
                        onSuccess={() => { fetchRankings(); setRewardTarget(null) }}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}