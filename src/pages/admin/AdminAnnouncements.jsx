import { useState, useEffect, useRef, useMemo } from 'react'
import ReactQuill, { Quill } from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import api from '../../api/axios'
import { Modal, Spinner } from '../../components/common/UIComponents'
import toast from 'react-hot-toast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPlus, faPen, faTrash, faBell, faToggleOn, faToggleOff,
  faEye, faCheckCircle, faTimesCircle, faCalendarAlt, faBellSlash,
} from '@fortawesome/free-solid-svg-icons'
import { motion, AnimatePresence } from 'framer-motion'

/* ── Quill dark theme ────────────────────────────────────── */
const quillStyle = `
  .ann-ql .ql-toolbar.ql-snow {
    background: #0e0e1a;
    border-color: rgba(255,255,255,0.1) !important;
    border-radius: 8px 8px 0 0;
    flex-wrap: wrap;
  }
  .ann-ql .ql-container.ql-snow {
    background: #12121f;
    border-color: rgba(255,255,255,0.1) !important;
    border-radius: 0 0 8px 8px;
    min-height: 220px;
  }
  .ann-ql .ql-editor {
    color: #e2e8f0;
    font-size: 14px;
    min-height: 220px;
    line-height: 1.7;
  }
  .ann-ql .ql-editor.ql-blank::before { color: rgba(255,255,255,0.25); }
  .ann-ql .ql-snow .ql-stroke { stroke: rgba(255,255,255,0.6); }
  .ann-ql .ql-snow .ql-fill  { fill:   rgba(255,255,255,0.6); }
  .ann-ql .ql-snow .ql-picker-label { color: rgba(255,255,255,0.6); }
  .ann-ql .ql-snow .ql-picker-options { background: #1a1a2e; border-color: rgba(255,255,255,0.1); }
  .ann-ql .ql-snow .ql-picker-item { color: #e2e8f0; }
  .ann-ql .ql-snow .ql-picker-item:hover,
  .ann-ql .ql-snow .ql-picker-label:hover { color: #f472b6; }
  .ann-ql .ql-snow button:hover .ql-stroke { stroke: #f472b6; }
  .ann-ql .ql-snow button:hover .ql-fill  { fill:  #f472b6; }
  .ann-ql .ql-snow .ql-active .ql-stroke  { stroke: #f472b6; }
  .ann-ql .ql-snow .ql-active .ql-fill    { fill:  #f472b6; }
`

const TOOLBAR = [
  [{ header: [1, 2, 3, false] }],
  [{ size: ['small', false, 'large', 'huge'] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ color: [] }, { background: [] }],
  [{ align: [] }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['link', 'image'],
  ['clean'],
]

const defaultForm = {
  title: '',
  content: '',
  isActive: true,
  sortOrder: 0,
  startAt: '',
  endAt: '',
}

function StatusBadge({ active }) {
  return active
    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/15 text-green-400 border border-green-500/20">
        <FontAwesomeIcon icon={faCheckCircle} className="text-[9px]" /> Đang bật
      </span>
    : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/20">
        <FontAwesomeIcon icon={faTimesCircle} className="text-[9px]" /> Đã tắt
      </span>
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function PreviewModal({ ann, onClose }) {
  return (
    <Modal isOpen={true} title={`Preview: ${ann.title}`} onClose={onClose} size="lg">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <StatusBadge active={ann.isActive} />
          {ann.startAt && <span className="text-xs text-white/40">Từ {fmtDate(ann.startAt)}</span>}
          {ann.endAt   && <span className="text-xs text-white/40">→ {fmtDate(ann.endAt)}</span>}
        </div>
        <div
          className="prose prose-invert max-w-none bg-dark-700 rounded-xl p-5 border border-white/5 text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: ann.content }}
        />
      </div>
    </Modal>
  )
}

export default function AdminAnnouncements() {
  const [items, setItems]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showPreview, setShowPreview] = useState(null)
  const [editing, setEditing]     = useState(null)
  const [form, setForm]           = useState(defaultForm)
  const [saving, setSaving]       = useState(false)
  const [toggling, setToggling]   = useState(null)
  const quillRef = useRef()

  // Inject style once
  useEffect(() => {
    if (document.getElementById('ann-quill-style')) return
    const s = document.createElement('style')
    s.id = 'ann-quill-style'
    s.textContent = quillStyle
    document.head.appendChild(s)
  }, [])

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/announcements/admin')
      setItems(data.data || [])
    } catch { toast.error('Không tải được danh sách') }
    finally { setLoading(false) }
  }

  const openCreate = () => {
    setEditing(null)
    setForm(defaultForm)
    setShowModal(true)
  }

  const openEdit = (item) => {
    setEditing(item)
    setForm({
      title:     item.title,
      content:   item.content,
      isActive:  item.isActive,
      sortOrder: item.sortOrder,
      startAt:   item.startAt ? item.startAt.slice(0, 16) : '',
      endAt:     item.endAt   ? item.endAt.slice(0, 16)   : '',
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error('Vui lòng nhập tiêu đề')
    if (!form.content || form.content === '<p><br></p>') return toast.error('Vui lòng nhập nội dung')
    setSaving(true)
    try {
      const payload = {
        ...form,
        startAt: form.startAt || null,
        endAt:   form.endAt   || null,
      }
      if (editing) {
        await api.put(`/announcements/admin/${editing.id}`, payload)
        toast.success('Đã cập nhật thông báo')
      } else {
        await api.post('/announcements/admin', payload)
        toast.success('Đã tạo thông báo')
      }
      setShowModal(false)
      fetchAll()
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Có lỗi xảy ra')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id, title) => {
    if (!confirm(`Xóa thông báo "${title}"?`)) return
    try {
      await api.delete(`/announcements/admin/${id}`)
      toast.success('Đã xóa')
      setItems(prev => prev.filter(i => i.id !== id))
    } catch { toast.error('Xóa thất bại') }
  }

  const handleToggle = async (id) => {
    setToggling(id)
    try {
      const { data } = await api.patch(`/announcements/admin/${id}/toggle`)
      setItems(prev => prev.map(i => i.id === id ? { ...i, isActive: data.data.isActive } : i))
      toast.success(data.data.isActive ? 'Đã bật thông báo' : 'Đã tắt thông báo')
    } catch { toast.error('Thao tác thất bại') }
    finally { setToggling(null) }
  }

  const modules = useMemo(() => ({ toolbar: TOOLBAR }), [])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-pink to-orange-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
            <FontAwesomeIcon icon={faBell} />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-white">Quản lý Thông báo</h1>
            <p className="text-xs text-white/40">Thông báo popup hiển thị khi người dùng vào web</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-neon-pink to-orange-500 text-white text-sm font-semibold hover:opacity-90 transition shadow-lg shadow-pink-500/20"
        >
          <FontAwesomeIcon icon={faPlus} />
          Thêm thông báo
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Tổng', value: items.length, color: 'from-blue-500 to-cyan-500' },
          { label: 'Đang bật', value: items.filter(i => i.isActive).length, color: 'from-green-500 to-emerald-500' },
          { label: 'Đã tắt', value: items.filter(i => !i.isActive).length, color: 'from-red-500 to-pink-500' },
        ].map(s => (
          <div key={s.label} className="bg-dark-700 border border-white/5 rounded-xl p-4">
            <p className="text-xs text-white/40 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="bg-dark-700 border border-white/5 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-white/30 gap-3">
            <FontAwesomeIcon icon={faBellSlash} className="text-4xl" />
            <p>Chưa có thông báo nào</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            <AnimatePresence>
              {items.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: idx * 0.04 }}
                  className="flex items-start gap-4 p-4 hover:bg-white/[0.02] transition-colors"
                >
                  {/* Toggle */}
                  <button
                    onClick={() => handleToggle(item.id)}
                    disabled={toggling === item.id}
                    className="mt-0.5 text-xl transition-colors disabled:opacity-50"
                    title={item.isActive ? 'Tắt thông báo' : 'Bật thông báo'}
                  >
                    {toggling === item.id
                      ? <span className="inline-block w-5 h-5 border-2 border-white/20 border-t-pink-400 rounded-full animate-spin" />
                      : <FontAwesomeIcon
                          icon={item.isActive ? faToggleOn : faToggleOff}
                          className={item.isActive ? 'text-green-400' : 'text-white/20'}
                        />
                    }
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-semibold text-white truncate">{item.title}</span>
                      <StatusBadge active={item.isActive} />
                      {item.sortOrder > 0 && (
                        <span className="text-[10px] text-white/30 border border-white/10 px-1.5 py-0.5 rounded">
                          Ưu tiên: {item.sortOrder}
                        </span>
                      )}
                    </div>
                    <div
                      className="text-xs text-white/40 line-clamp-2 [&_*]:text-white/40 [&_strong]:text-white/50"
                      dangerouslySetInnerHTML={{ __html: item.content }}
                    />
                    {(item.startAt || item.endAt) && (
                      <div className="flex items-center gap-2 mt-1.5 text-[11px] text-white/30">
                        <FontAwesomeIcon icon={faCalendarAlt} className="text-[10px]" />
                        {item.startAt && <span>{fmtDate(item.startAt)}</span>}
                        {item.startAt && item.endAt && <span>→</span>}
                        {item.endAt && <span>{fmtDate(item.endAt)}</span>}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => setShowPreview(item)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-blue-400 hover:bg-blue-500/10 transition-colors text-sm"
                      title="Xem trước"
                    >
                      <FontAwesomeIcon icon={faEye} />
                    </button>
                    <button
                      onClick={() => openEdit(item)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors text-sm"
                      title="Chỉnh sửa"
                    >
                      <FontAwesomeIcon icon={faPen} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.title)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors text-sm"
                      title="Xóa"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <Modal
            isOpen={showModal}
            title={editing ? 'Chỉnh sửa thông báo' : 'Tạo thông báo mới'}
            onClose={() => setShowModal(false)}
            size="lg"
          >
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs text-white/50 mb-1.5 font-medium">Tiêu đề *</label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Ví dụ: 🎉 Khuyến mãi tháng 6"
                  className="w-full bg-dark-600 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-pink-500/50 transition"
                />
              </div>

              {/* Content - Quill */}
              <div>
                <label className="block text-xs text-white/50 mb-1.5 font-medium">Nội dung *</label>
                <div className="ann-ql">
                  <ReactQuill
                    ref={quillRef}
                    theme="snow"
                    value={form.content}
                    onChange={v => setForm(f => ({ ...f, content: v }))}
                    modules={modules}
                    placeholder="Nhập nội dung thông báo..."
                  />
                </div>
              </div>

              {/* Settings row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-white/50 mb-1.5 font-medium">Thứ tự ưu tiên</label>
                  <input
                    type="number"
                    min="0"
                    value={form.sortOrder}
                    onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))}
                    className="w-full bg-dark-600 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500/50 transition"
                  />
                </div>
                <div className="flex items-end pb-0.5">
                  <label className="flex items-center gap-3 cursor-pointer select-none group">
                    <div
                      onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${form.isActive ? 'bg-green-500' : 'bg-white/10'}`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${form.isActive ? 'left-6' : 'left-0.5'}`} />
                    </div>
                    <span className="text-sm text-white/70 group-hover:text-white transition-colors">
                      {form.isActive ? 'Đang bật' : 'Đang tắt'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Date range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-white/50 mb-1.5 font-medium">
                    <FontAwesomeIcon icon={faCalendarAlt} className="mr-1.5" />
                    Bắt đầu (tuỳ chọn)
                  </label>
                  <input
                    type="datetime-local"
                    value={form.startAt}
                    onChange={e => setForm(f => ({ ...f, startAt: e.target.value }))}
                    className="w-full bg-dark-600 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/70 focus:outline-none focus:border-pink-500/50 transition [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1.5 font-medium">
                    <FontAwesomeIcon icon={faCalendarAlt} className="mr-1.5" />
                    Kết thúc (tuỳ chọn)
                  </label>
                  <input
                    type="datetime-local"
                    value={form.endAt}
                    onChange={e => setForm(f => ({ ...f, endAt: e.target.value }))}
                    className="w-full bg-dark-600 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/70 focus:outline-none focus:border-pink-500/50 transition [color-scheme:dark]"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 pt-2 border-t border-white/5">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/5 transition"
                >
                  Huỷ
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-neon-pink to-orange-500 text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
                >
                  {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {editing ? 'Cập nhật' : 'Tạo thông báo'}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      {showPreview && (
        <PreviewModal ann={showPreview} onClose={() => setShowPreview(null)} />
      )}
    </div>
  )
}
