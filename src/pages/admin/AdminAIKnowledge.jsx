/**
 * AdminAIKnowledge.jsx
 * ─────────────────────────────────────────────────────────────────────────
 * Trang quản lý kiến thức AI (FAQ / Chính sách / Hướng dẫn / Điều khoản)
 * Tích hợp nút "Đồng bộ AI" để upsert dữ liệu lên Pinecone Vector DB
 * ─────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faRobot, faPlus, faPen, faTrash, faToggleOn, faToggleOff,
    faRotate, faSearch, faXmark, faFloppyDisk, faCloudArrowUp,
    faCircleCheck, faCircleXmark, faHourglassHalf, faChartBar,
    faDatabase, faFilter, faInfoCircle, faExclamationTriangle,
    faCheckCircle, faSpinner, faEye, faTag,
} from '@fortawesome/free-solid-svg-icons'
import api from '../../api/axios'
import { Modal, Spinner, Pagination } from '../../components/common/UIComponents'
import toast from 'react-hot-toast'

/* ── Constants ────────────────────────────────────────── */
const TYPE_OPTIONS = [
    { value: 'FAQ', label: 'FAQ', color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/30' },
    { value: 'POLICY', label: 'Chính sách', color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/30' },
    { value: 'GUIDE', label: 'Hướng dẫn', color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/30' },
    { value: 'TERM', label: 'Điều khoản', color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/30' },
]

const getTypeInfo = (type) => TYPE_OPTIONS.find(t => t.value === type) || TYPE_OPTIONS[0]

const PAGE_LIMIT = 10

/* ── Sync Status Badge ────────────────────────────────── */
function SyncBadge({ syncedAt }) {
    if (!syncedAt) {
        return (
            <span className="inline-flex items-center gap-1 text-xs text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 rounded-full px-2 py-0.5">
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-[10px]" />
                Chưa đồng bộ
            </span>
        )
    }
    return (
        <span className="inline-flex items-center gap-1 text-xs text-green-400 bg-green-400/10 border border-green-400/20 rounded-full px-2 py-0.5">
            <FontAwesomeIcon icon={faCircleCheck} className="text-[10px]" />
            Đã đồng bộ
        </span>
    )
}

/* ── Stats Card ───────────────────────────────────────── */
function StatsCard({ icon, label, value, color, bg }) {
    return (
        <div className={`rounded-xl border p-4 flex items-center gap-3 ${bg}`}>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${bg}`}>
                <FontAwesomeIcon icon={icon} className={`${color} text-sm`} />
            </div>
            <div>
                <p className="text-white/50 text-xs">{label}</p>
                <p className={`font-bold text-lg ${color}`}>{value ?? '–'}</p>
            </div>
        </div>
    )
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════ */
export default function AdminAIKnowledge() {
    /* ── State ── */
    const [items, setItems] = useState([])
    const [total, setTotal] = useState(0)
    const [totalPages, setTotalPages] = useState(1)
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(false)

    const [search, setSearch] = useState('')
    const [filterType, setFilterType] = useState('')
    const [filterActive, setFilterActive] = useState('')

    const [syncStatus, setSyncStatus] = useState(null)
    const [syncing, setSyncing] = useState(false)
    const [syncResult, setSyncResult] = useState(null)

    const [modalOpen, setModalOpen] = useState(false)
    const [editItem, setEditItem] = useState(null)   // null = create mode
    const [viewItem, setViewItem] = useState(null)   // view detail

    const [form, setForm] = useState({ title: '', type: 'FAQ', content: '', isActive: true })
    const [saving, setSaving] = useState(false)

    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [deleting, setDeleting] = useState(false)

    const searchRef = useRef(null)

    /* ── Fetch items ── */
    const fetchItems = useCallback(async (p = page) => {
        setLoading(true)
        try {
            const params = { page: p, limit: PAGE_LIMIT }
            if (filterType) params.type = filterType
            if (filterActive) params.isActive = filterActive
            if (search.trim()) params.search = search.trim()

            const res = await api.get('/admin/ai-knowledge', { params })
            setItems(res.data.data || [])
            setTotal(res.data.pagination?.total || 0)
            setTotalPages(res.data.pagination?.totalPages || 1)
        } catch {
            toast.error('Không tải được danh sách')
        } finally {
            setLoading(false)
        }
    }, [page, filterType, filterActive, search])

    useEffect(() => { fetchItems(page) }, [page, filterType, filterActive])

    /* ── Fetch sync status ── */
    const fetchSyncStatus = useCallback(async () => {
        try {
            const res = await api.get('/admin/ai-knowledge/sync-status')
            setSyncStatus(res.data.data)
        } catch { /* ignore */ }
    }, [])

    useEffect(() => { fetchSyncStatus() }, [fetchSyncStatus])

    /* ── Search debounce ── */
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1)
            fetchItems(1)
        }, 450)
        return () => clearTimeout(timer)
    }, [search])

    /* ── Open form modal ── */
    const openCreate = () => {
        setEditItem(null)
        setForm({ title: '', type: 'FAQ', content: '', isActive: true })
        setModalOpen(true)
    }

    const openEdit = async (item) => {
        setEditItem(item)
        // Fetch full content
        try {
            const res = await api.get(`/admin/ai-knowledge/${item.id}`)
            const full = res.data.data
            setForm({ title: full.title, type: full.type, content: full.content, isActive: full.isActive })
        } catch {
            setForm({ title: item.title, type: item.type, content: '', isActive: item.isActive })
        }
        setModalOpen(true)
    }

    const openView = async (item) => {
        try {
            const res = await api.get(`/admin/ai-knowledge/${item.id}`)
            setViewItem(res.data.data)
        } catch {
            toast.error('Không tải được nội dung')
        }
    }

    /* ── Save ── */
    const handleSave = async () => {
        if (!form.title.trim()) return toast.error('Vui lòng nhập tiêu đề')
        if (!form.content.trim()) return toast.error('Vui lòng nhập nội dung')

        setSaving(true)
        try {
            if (editItem) {
                await api.put(`/admin/ai-knowledge/${editItem.id}`, form)
                toast.success('Cập nhật thành công')
            } else {
                await api.post('/admin/ai-knowledge', form)
                toast.success('Tạo thành công')
            }
            setModalOpen(false)
            fetchItems(page)
            fetchSyncStatus()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Lỗi lưu dữ liệu')
        } finally {
            setSaving(false)
        }
    }

    /* ── Toggle active ── */
    const handleToggle = async (item) => {
        try {
            await api.patch(`/admin/ai-knowledge/${item.id}/toggle`)
            toast.success(item.isActive ? 'Đã ẩn' : 'Đã kích hoạt')
            fetchItems(page)
            fetchSyncStatus()
        } catch {
            toast.error('Lỗi thay đổi trạng thái')
        }
    }

    /* ── Delete ── */
    const handleDelete = async () => {
        if (!deleteConfirm) return
        setDeleting(true)
        try {
            await api.delete(`/admin/ai-knowledge/${deleteConfirm.id}`)
            toast.success('Đã xóa')
            setDeleteConfirm(null)
            fetchItems(page)
            fetchSyncStatus()
        } catch {
            toast.error('Lỗi xóa dữ liệu')
        } finally {
            setDeleting(false)
        }
    }

    /* ── Sync to Pinecone ── */
    const handleSync = async () => {
        if (syncing) return
        setSyncing(true)
        setSyncResult(null)
        const toastId = toast.loading('Đang đồng bộ lên Pinecone Vector DB...')

        try {
            const res = await api.post('/admin/ai-knowledge/sync/all', {}, { timeout: 300000 })
            const stats = res.data.stats
            setSyncResult(res.data)
            fetchItems(page)
            fetchSyncStatus()

            if (stats.failed === 0) {
                toast.success(`Đồng bộ hoàn tất: ${stats.success} records`, { id: toastId })
            } else {
                toast.error(`Xong với ${stats.failed} lỗi. Xem chi tiết bên dưới.`, { id: toastId })
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Lỗi đồng bộ', { id: toastId })
        } finally {
            setSyncing(false)
        }
    }

    /* ─────────────────────────── RENDER ─────────────────────────── */
    return (
        <div className="p-6 space-y-6 min-h-screen">
            {/* ── Header ── */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/15 flex items-center justify-center">
                        <FontAwesomeIcon icon={faRobot} className="text-teal-400 text-lg" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">Quản lý AI Knowledge</h1>
                        <p className="text-white/40 text-xs">FAQ · Chính sách · Hướng dẫn · Điều khoản → Pinecone RAG</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Sync button */}
                    <button
                        onClick={handleSync}
                        disabled={syncing}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all"
                    >
                        <FontAwesomeIcon icon={faCloudArrowUp} className={syncing ? 'animate-bounce' : ''} />
                        {syncing ? 'Đang đồng bộ...' : 'Đồng bộ AI'}
                    </button>

                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold transition-all"
                    >
                        <FontAwesomeIcon icon={faPlus} />
                        Thêm kiến thức
                    </button>
                </div>
            </div>

            {/* ── Sync Stats ── */}
            {syncStatus && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatsCard
                        icon={faDatabase} label="Tổng records" value={syncStatus.mysql?.total}
                        color="text-white" bg="bg-white/5 border border-white/10"
                    />
                    <StatsCard
                        icon={faToggleOn} label="Đang active" value={syncStatus.mysql?.active}
                        color="text-teal-400" bg="bg-teal-400/5 border border-teal-400/20"
                    />
                    <StatsCard
                        icon={faCircleCheck} label="Đã sync" value={syncStatus.mysql?.synced}
                        color="text-green-400" bg="bg-green-400/5 border border-green-400/20"
                    />
                    <StatsCard
                        icon={faExclamationTriangle} label="Chưa sync" value={syncStatus.mysql?.unsynced}
                        color="text-yellow-400" bg="bg-yellow-400/5 border border-yellow-400/20"
                    />
                </div>
            )}

            {/* ── Pinecone info bar ── */}
            {syncStatus?.pinecone && (
                <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl px-4 py-3 flex items-center gap-3 text-sm">
                    <FontAwesomeIcon icon={faCloudArrowUp} className="text-purple-400" />
                    <span className="text-white/60">Pinecone Index:</span>
                    <span className="text-purple-300 font-semibold">{syncStatus.pinecone.totalVectors} vectors</span>
                    {syncStatus.lastSyncedAt && (
                        <>
                            <span className="text-white/30">·</span>
                            <span className="text-white/40 text-xs">
                                Sync lần cuối: {new Date(syncStatus.lastSyncedAt).toLocaleString('vi-VN')}
                            </span>
                        </>
                    )}
                </div>
            )}

            {/* ── Sync Result ── */}
            <AnimatePresence>
                {syncResult && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`rounded-xl border p-4 ${syncResult.stats.failed === 0
                                ? 'bg-green-500/10 border-green-500/30'
                                : 'bg-yellow-500/10 border-yellow-500/30'
                            }`}
                    >
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                                <FontAwesomeIcon
                                    icon={syncResult.stats.failed === 0 ? faCircleCheck : faExclamationTriangle}
                                    className={syncResult.stats.failed === 0 ? 'text-green-400' : 'text-yellow-400'}
                                />
                                <p className="text-white font-semibold text-sm">{syncResult.message}</p>
                            </div>
                            <button onClick={() => setSyncResult(null)} className="text-white/40 hover:text-white">
                                <FontAwesomeIcon icon={faXmark} />
                            </button>
                        </div>

                        {syncResult.stats.errors?.length > 0 && (
                            <div className="mt-2 space-y-1">
                                {syncResult.stats.errors.map((e, i) => (
                                    <p key={i} className="text-red-400 text-xs font-mono bg-red-500/5 rounded px-2 py-1">{e}</p>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Filters ── */}
            <div className="flex flex-wrap gap-3">
                {/* Search */}
                <div className="relative flex-1 min-w-48">
                    <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm" />
                    <input
                        ref={searchRef}
                        type="text"
                        placeholder="Tìm theo tiêu đề, nội dung..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-dark-700 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-teal-400/50"
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                            <FontAwesomeIcon icon={faXmark} className="text-sm" />
                        </button>
                    )}
                </div>

                {/* Type filter */}
                <select
                    value={filterType}
                    onChange={e => { setFilterType(e.target.value); setPage(1) }}
                    className="bg-dark-700 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-teal-400/50"
                >
                    <option value="">Tất cả loại</option>
                    {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>

                {/* Active filter */}
                <select
                    value={filterActive}
                    onChange={e => { setFilterActive(e.target.value); setPage(1) }}
                    className="bg-dark-700 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-teal-400/50"
                >
                    <option value="">Tất cả trạng thái</option>
                    <option value="true">Đang active</option>
                    <option value="false">Đã ẩn</option>
                </select>

                <button
                    onClick={() => { setSearch(''); setFilterType(''); setFilterActive(''); setPage(1); fetchItems(1) }}
                    className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 text-sm transition-all"
                >
                    <FontAwesomeIcon icon={faRotate} />
                </button>
            </div>

            {/* ── Table ── */}
            <div className="gaming-card overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-[minmax(450px,1fr)_120px_90px_120px_130px] gap-3 px-5 py-3 border-b border-white/5 bg-dark-700/40 text-white/40 text-xs font-semibold uppercase tracking-wider">
                    <span>Tiêu đề</span>
                    <span className="text-center">Loại</span>
                    <span className="text-center">Trạng thái</span>
                    <span className="text-center">Đồng bộ</span>
                    <span className="text-right">Thao tác</span>
                </div>

                {loading ? (
                    <div className="flex justify-center py-16">
                        <Spinner />
                    </div>
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center py-16 text-white/30">
                        <FontAwesomeIcon icon={faRobot} className="text-4xl mb-3 opacity-30" />
                        <p className="text-sm">Chưa có dữ liệu nào</p>
                        <button
                            onClick={openCreate}
                            className="mt-4 text-teal-400 text-sm hover:text-teal-300"
                        >
                            + Thêm kiến thức đầu tiên
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {items.map((item, idx) => {
                            const typeInfo = getTypeInfo(item.type)

                            return (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.03 }}
                                    className="grid grid-cols-[minmax(450px,1fr)_120px_90px_120px_130px] gap-3 px-5 py-3 items-center border-b border-white/5 hover:bg-white/2 transition-colors"
                                >
                                    {/* Tiêu đề */}
                                    <div className="min-w-0">
                                        <p
                                            className="text-white text-sm font-medium truncate"
                                            title={item.title}
                                        >
                                            {item.title}
                                        </p>

                                        <p className="text-white/30 text-xs mt-1">
                                            {new Date(item.updatedAt).toLocaleDateString('vi-VN')}
                                        </p>
                                    </div>

                                    {/* Loại */}
                                    <div className="flex justify-center">
                                        <span
                                            className={`inline-flex items-center justify-center gap-1 text-[11px] whitespace-nowrap px-2.5 py-1 rounded-lg border ${typeInfo.bg} ${typeInfo.color}`}
                                        >
                                            <FontAwesomeIcon
                                                icon={faTag}
                                                className="text-[10px]"
                                            />

                                            {item.type === 'FAQ'
                                                ? 'FAQ'
                                                : item.type === 'POLICY'
                                                    ? 'Chính sách'
                                                    : item.type === 'GUIDE'
                                                        ? 'Hướng dẫn'
                                                        : 'Điều khoản'}
                                        </span>
                                    </div>

                                    {/* Trạng thái */}
                                    <div className="flex justify-center">
                                        <button onClick={() => handleToggle(item)}>
                                            <FontAwesomeIcon
                                                icon={item.isActive ? faToggleOn : faToggleOff}
                                                className={`text-xl ${item.isActive
                                                        ? 'text-teal-400'
                                                        : 'text-white/20'
                                                    }`}
                                            />
                                        </button>
                                    </div>

                                    {/* Đồng bộ */}
                                    <div className="flex justify-center">
                                        <SyncBadge syncedAt={item.syncedAt} />
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => openView(item)}
                                            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-blue-500/20 hover:text-blue-400 text-white/40 flex items-center justify-center transition-all"
                                            title="Xem"
                                        >
                                            <FontAwesomeIcon icon={faEye} />
                                        </button>

                                        <button
                                            onClick={() => openEdit(item)}
                                            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-teal-500/20 hover:text-teal-400 text-white/40 flex items-center justify-center transition-all"
                                            title="Sửa"
                                        >
                                            <FontAwesomeIcon icon={faPen} />
                                        </button>

                                        <button
                                            onClick={() => setDeleteConfirm(item)}
                                            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-white/40 flex items-center justify-center transition-all"
                                            title="Xóa"
                                        >
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* ── Pagination ── */}
            {totalPages > 1 && (
                <div className="p-4 bg-dark-800 rounded-2xl">
                    <Pagination
                        page={page}
                        pages={Math.ceil(total / PAGE_LIMIT)}
                        onPageChange={setPage}
                    />
                </div>
            )}

            {/* ══════════════════════════════════════════════════════
          MODAL: Tạo / Sửa
          ══════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {modalOpen && (
                    <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Sửa kiến thức AI' : 'Thêm kiến thức AI'}>
                        <div className="space-y-4">
                            {/* Title */}
                            <div>
                                <label className="text-white/60 text-sm mb-1.5 block">Tiêu đề <span className="text-red-400">*</span></label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                    placeholder="VD: Chính sách đổi trả acc..."
                                    className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/25 focus:outline-none focus:border-teal-400/50"
                                />
                            </div>

                            {/* Type */}
                            <div>
                                <label className="text-white/60 text-sm mb-1.5 block">Loại kiến thức <span className="text-red-400">*</span></label>
                                <div className="grid grid-cols-2 gap-2">
                                    {TYPE_OPTIONS.map(t => (
                                        <button
                                            key={t.value}
                                            onClick={() => setForm(f => ({ ...f, type: t.value }))}
                                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left ${form.type === t.value ? `${t.bg} ${t.color}` : 'bg-white/3 border-white/10 text-white/50 hover:bg-white/8'
                                                }`}
                                        >
                                            <FontAwesomeIcon icon={faTag} className="text-[11px]" />
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Content */}
                            <div>
                                <label className="text-white/60 text-sm mb-1.5 block">Nội dung <span className="text-red-400">*</span></label>
                                <textarea
                                    value={form.content}
                                    onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                                    rows={8}
                                    placeholder="Nhập nội dung chi tiết. Nội dung này sẽ được đưa vào Vector DB để chatbot tham khảo khi trả lời..."
                                    className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/25 focus:outline-none focus:border-teal-400/50 resize-none leading-relaxed"
                                />
                                <p className="text-white/25 text-xs mt-1">{form.content.length} ký tự</p>
                            </div>

                            {/* Active */}
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                                    className="flex items-center gap-2 text-sm"
                                >
                                    <FontAwesomeIcon
                                        icon={form.isActive ? faToggleOn : faToggleOff}
                                        className={`text-2xl ${form.isActive ? 'text-teal-400' : 'text-white/20'}`}
                                    />
                                    <span className={form.isActive ? 'text-teal-400' : 'text-white/40'}>
                                        {form.isActive ? 'Active — sẽ được sync vào Pinecone' : 'Ẩn — sẽ không được sync'}
                                    </span>
                                </button>
                            </div>

                            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 flex gap-2 text-sm">
                                <FontAwesomeIcon icon={faInfoCircle} className="text-blue-400 mt-0.5 flex-shrink-0" />
                                <p className="text-white/50">
                                    Sau khi lưu, bạn cần bấm nút <strong className="text-purple-400">"Đồng bộ AI"</strong> để
                                    dữ liệu được upsert lên Pinecone Vector DB và chatbot có thể sử dụng.
                                </p>
                            </div>

                            {/* Buttons */}
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    onClick={() => setModalOpen(false)}
                                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 text-sm transition-all"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-60 text-white text-sm font-semibold transition-all"
                                >
                                    {saving ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : <FontAwesomeIcon icon={faFloppyDisk} />}
                                    {saving ? 'Đang lưu...' : 'Lưu'}
                                </button>
                            </div>
                        </div>
                    </Modal>
                )}
            </AnimatePresence>

            {/* ══════════════════════════════════════════════════════
          MODAL: Xem nội dung
          ══════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {viewItem && (
                    <Modal isOpen={!!viewItem} onClose={() => setViewItem(null)} title="Chi tiết kiến thức AI">
                        <div className="space-y-4">
                            <div className="flex items-start justify-between gap-4">
                                <h3 className="text-white font-semibold text-base">{viewItem.title}</h3>
                                <span className={`flex-shrink-0 text-xs px-2 py-1 rounded-lg border ${getTypeInfo(viewItem.type).bg} ${getTypeInfo(viewItem.type).color}`}>
                                    {getTypeInfo(viewItem.type).label}
                                </span>
                            </div>

                            <div className="flex items-center gap-4 text-xs text-white/40">
                                <SyncBadge syncedAt={viewItem.syncedAt} />
                                {viewItem.syncedAt && (
                                    <span>Sync lúc: {new Date(viewItem.syncedAt).toLocaleString('vi-VN')}</span>
                                )}
                            </div>

                            <div className="bg-dark-700  rounded-xl p-4 max-h-96 overflow-y-auto">
                                <pre className="text-white/80 text-sm whitespace-pre-wrap leading-relaxed font-sans">{viewItem.content}</pre>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    onClick={() => { setViewItem(null); openEdit(viewItem) }}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm transition-all"
                                >
                                    <FontAwesomeIcon icon={faPen} /> Sửa
                                </button>
                            </div>
                        </div>
                    </Modal>
                )}
            </AnimatePresence>

            {/* ══════════════════════════════════════════════════════
          MODAL: Xác nhận xóa
          ══════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {deleteConfirm && (
                    <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Xác nhận xóa">
                        <div className="space-y-4">
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                                <p className="text-white text-sm">
                                    Bạn chắc chắn muốn xóa kiến thức:
                                </p>
                                <p className="text-red-400 font-semibold mt-1">"{deleteConfirm.title}"</p>
                                {deleteConfirm.syncedAt && (
                                    <p className="text-yellow-400 text-xs mt-2">
                                        ⚠️ Record này đã được sync lên Pinecone — vector sẽ bị xóa đồng thời.
                                    </p>
                                )}
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 text-sm transition-all"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white text-sm font-semibold transition-all"
                                >
                                    {deleting ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : <FontAwesomeIcon icon={faTrash} />}
                                    {deleting ? 'Đang xóa...' : 'Xóa'}
                                </button>
                            </div>
                        </div>
                    </Modal>
                )}
            </AnimatePresence>
        </div>
    )
}
