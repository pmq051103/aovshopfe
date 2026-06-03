import { useState, useEffect, useRef, useMemo } from 'react'
import ReactQuill, { Quill } from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import api from '../../api/axios'
import { Modal, Spinner } from '../../components/common/UIComponents'
import toast from 'react-hot-toast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPlus,
  faPen,
  faTrash,
  faCamera,
  faFloppyDisk,
  faEye,
  faEyeSlash,
  faNewspaper,
  faMagnifyingGlass,
  faTag,
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons'

/* ── Thêm font chữ vào Quill ─────────────────────────────────────────── */
const Font = Quill.import('formats/font')
Font.whitelist = [
  'sans-serif',
  'serif',
  'monospace',
  'roboto',
  'open-sans',
  'montserrat',
  'dancing-script',
]
Quill.register(Font, true)

/* ── Cấu hình toolbar ────────────────────────────────────────────────── */
const TOOLBAR = [
  [{ font: Font.whitelist }],
  [{ header: [1, 2, 3, 4, false] }],
  [{ size: ['small', false, 'large', 'huge'] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ color: [] }, { background: [] }],
  [{ align: [] }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ indent: '-1' }, { indent: '+1' }],
  ['blockquote', 'code-block'],
  ['link', 'image', 'video'],
  ['clean'],
]

const quillStyle = `
  .ql-toolbar.ql-snow {
    background: #0e0e1a;
    border-color: rgba(255,255,255,0.1) !important;
    border-radius: 8px 8px 0 0;
    flex-wrap: wrap;
  }
  .ql-container.ql-snow {
    background: #12121f;
    border-color: rgba(255,255,255,0.1) !important;
    border-radius: 0 0 8px 8px;
    min-height: 280px;
  }
  .ql-editor {
    color: #e2e8f0;
    font-size: 14px;
    min-height: 280px;
    line-height: 1.7;
  }
  .ql-editor.ql-blank::before { color: rgba(255,255,255,0.25); }
  .ql-snow .ql-stroke { stroke: rgba(255,255,255,0.6); }
  .ql-snow .ql-fill  { fill:   rgba(255,255,255,0.6); }
  .ql-snow .ql-picker-label { color: rgba(255,255,255,0.6); }
  .ql-snow .ql-picker-options {
    background: #1a1a2e;
    border-color: rgba(255,255,255,0.1);
  }
  .ql-snow .ql-picker-item { color: #e2e8f0; }
  .ql-snow .ql-picker-item:hover,
  .ql-snow .ql-picker-label:hover { color: #f472b6; }
  .ql-snow button:hover .ql-stroke { stroke: #f472b6; }
  .ql-snow button:hover .ql-fill  { fill:  #f472b6; }
  .ql-snow .ql-active .ql-stroke  { stroke: #f472b6; }
  .ql-snow .ql-active .ql-fill    { fill: #f472b6; }

  .ql-font-roboto         { font-family: 'Roboto', sans-serif; }
  .ql-font-open-sans      { font-family: 'Open Sans', sans-serif; }
  .ql-font-montserrat     { font-family: 'Montserrat', sans-serif; }
  .ql-font-dancing-script { font-family: 'Dancing Script', cursive; }
  .ql-font-serif          { font-family: Georgia, serif; }
  .ql-font-monospace      { font-family: monospace; }
`

const defaultForm = {
  title: '',
  summary: '',
  content: '',
  tags: '',
  isPublished: false,
  image: null,
  thumbnailUrl: '',
}

function Badge({ published }) {
  return published ? (
    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/20">
      Đã đăng
    </span>
  ) : (
    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/20">
      Nháp
    </span>
  )
}

export default function AdminNews() {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(defaultForm)
  const [preview, setPreview] = useState('')
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const fileRef = useRef()

  useEffect(() => {
    if (document.getElementById('quill-dark')) return

    const s = document.createElement('style')
    s.id = 'quill-dark'
    s.textContent = quillStyle
    document.head.appendChild(s)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNews()
    }, 300)

    return () => clearTimeout(timer)
  }, [page, search])

  const fetchNews = async () => {
    setLoading(true)

    try {
      const { data } = await api.get('/news/admin/all', {
        params: {
          page,
          limit,
          search: search.trim(),
        },
      })

      setNews(data.data || [])
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || Math.ceil((data.total || 0) / limit) || 1)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi tải tin tức')
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditing(null)
    setForm(defaultForm)
    setPreview('')
    setShowModal(true)
  }

  const openEdit = n => {
    setEditing(n)
    setForm({ ...defaultForm, ...n, image: null })
    setPreview(n.thumbnailUrl || '')
    setShowModal(true)
  }

  const handleImage = e => {
    const file = e.target.files[0]
    if (!file) return

    setForm(p => ({ ...p, image: file }))
    setPreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error('Nhập tiêu đề')
    if (!form.content || form.content === '<p><br></p>') return toast.error('Nhập nội dung')

    setSaving(true)

    try {
      const fd = new FormData()
      fd.append('title', form.title)
      fd.append('summary', form.summary)
      fd.append('content', form.content)
      fd.append('tags', form.tags)
      fd.append('isPublished', form.isPublished)

      if (form.image) fd.append('thumbnail', form.image)
      else if (form.thumbnailUrl) fd.append('thumbnailUrl', form.thumbnailUrl)

      if (editing) {
        await api.put(`/news/${editing.id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        toast.success('Đã cập nhật tin tức')
      } else {
        await api.post('/news', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        toast.success('Đã tạo tin tức')
        setPage(1)
      }

      setShowModal(false)
      fetchNews()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi lưu tin tức')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async id => {
    if (!confirm('Xóa tin tức này?')) return

    try {
      await api.delete(`/news/${id}`)
      toast.success('Đã xóa')

      if (news.length === 1 && page > 1) {
        setPage(p => p - 1)
      } else {
        fetchNews()
      }
    } catch {
      toast.error('Lỗi xóa')
    }
  }

  const goToPage = newPage => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return
    setPage(newPage)
  }

  const pageNumbers = useMemo(() => {
    const pages = []
    const start = Math.max(1, page - 2)
    const end = Math.min(totalPages, page + 2)

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    return pages
  }, [page, totalPages])

  const quillModules = useMemo(() => ({ toolbar: TOOLBAR }), [])

  const quillFormats = [
    'font',
    'header',
    'size',
    'bold',
    'italic',
    'underline',
    'strike',
    'color',
    'background',
    'align',
    'list',
    'bullet',
    'indent',
    'blockquote',
    'code-block',
    'link',
    'image',
    'video',
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-gaming font-bold text-white flex items-center gap-2">
            <FontAwesomeIcon icon={faNewspaper} className="text-neon-pink" />
            Quản lý Tin tức
          </h1>

          <p className="text-white/40 text-sm mt-1">
            Tổng {total} bài viết
          </p>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-neon-pink/15 hover:bg-neon-pink/25 border border-neon-pink/30 text-neon-pink rounded-lg text-sm font-medium transition-all"
        >
          <FontAwesomeIcon icon={faPlus} />
          Tạo tin mới
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <FontAwesomeIcon
          icon={faMagnifyingGlass}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm"
        />

        <input
          value={search}
          onChange={e => {
            setSearch(e.target.value)
            setPage(1)
          }}
          placeholder="Tìm theo tiêu đề, tóm tắt, tag..."
          className="w-full bg-dark-800 border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-neon-pink/50"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : (
        <div className="bg-dark-800 rounded-xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-white/5 text-white/40 text-xs uppercase">
                  <th className="text-left px-4 py-3">Ảnh</th>
                  <th className="text-left px-4 py-3">Tiêu đề</th>
                  <th className="text-left px-4 py-3">Tags</th>
                  <th className="text-left px-4 py-3">Trạng thái</th>
                  <th className="text-left px-4 py-3">Lượt xem</th>
                  <th className="text-left px-4 py-3">Ngày tạo</th>
                  <th className="text-right px-4 py-3">Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {news.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-white/30">
                      Chưa có tin tức nào
                    </td>
                  </tr>
                )}

                {news.map(n => (
                  <tr
                    key={n.id}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3">
                      {n.thumbnailUrl ? (
                        <img
                          src={n.thumbnailUrl}
                          className="w-16 h-11 object-cover rounded-md border border-white/10"
                          alt={n.title}
                        />
                      ) : (
                        <div className="w-16 h-11 rounded-md bg-white/5 flex items-center justify-center text-white/20">
                          <FontAwesomeIcon icon={faNewspaper} />
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-white text-sm font-medium line-clamp-1 max-w-[260px]">
                        {n.title}
                      </div>

                      <div className="text-white/40 text-xs line-clamp-1 max-w-[260px]">
                        {n.summary}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(n.tags || '')
                          .split(',')
                          .filter(Boolean)
                          .slice(0, 2)
                          .map(t => (
                            <span
                              key={t}
                              className="px-1.5 py-0.5 rounded text-[10px] bg-neon-purple/20 text-neon-purple border border-neon-purple/20"
                            >
                              {t.trim()}
                            </span>
                          ))}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <Badge published={n.isPublished} />
                    </td>

                    <td className="px-4 py-3 text-white/50 text-sm">
                      {n.viewCount || 0}
                    </td>

                    <td className="px-4 py-3 text-white/40 text-xs">
                      {new Date(n.createdAt).toLocaleDateString('vi-VN')}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => openEdit(n)}
                          className="p-1.5 rounded hover:bg-neon-pink/10 text-white/40 hover:text-neon-pink transition-colors"
                        >
                          <FontAwesomeIcon icon={faPen} className="text-xs" />
                        </button>

                        <button
                          onClick={() => handleDelete(n.id)}
                          className="p-1.5 rounded hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors"
                        >
                          <FontAwesomeIcon icon={faTrash} className="text-xs" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-t border-white/5">
            <div className="text-white/40 text-xs">
              Trang {page}/{totalPages} - Hiển thị {news.length}/{total} bài viết
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => goToPage(page - 1)}
                className="w-8 h-8 rounded-lg bg-white/5 text-white/60 text-xs disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
              >
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>

              {pageNumbers[0] > 1 && (
                <>
                  <button
                    onClick={() => goToPage(1)}
                    className="w-8 h-8 rounded-lg bg-white/5 text-white/60 text-xs hover:bg-white/10 transition-colors"
                  >
                    1
                  </button>
                  <span className="px-1 text-white/30 text-xs">...</span>
                </>
              )}

              {pageNumbers.map(p => (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                    p === page
                      ? 'bg-neon-pink/20 border border-neon-pink/30 text-neon-pink'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {p}
                </button>
              ))}

              {pageNumbers[pageNumbers.length - 1] < totalPages && (
                <>
                  <span className="px-1 text-white/30 text-xs">...</span>
                  <button
                    onClick={() => goToPage(totalPages)}
                    className="w-8 h-8 rounded-lg bg-white/5 text-white/60 text-xs hover:bg-white/10 transition-colors"
                  >
                    {totalPages}
                  </button>
                </>
              )}

              <button
                disabled={page >= totalPages}
                onClick={() => goToPage(page + 1)}
                className="w-8 h-8 rounded-lg bg-white/5 text-white/60 text-xs disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
              >
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal tạo/sửa */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Chỉnh sửa tin tức' : 'Tạo tin tức mới'}
        size="xl"
      >
        <div className="space-y-4">
          {/* Thumbnail */}
          <div>
            <label className="text-white/60 text-xs mb-1 block">
              Ảnh thumbnail
            </label>

            <div
              className="relative h-36 rounded-xl overflow-hidden border-2 border-dashed border-white/10 hover:border-neon-pink/30 cursor-pointer transition-colors bg-dark-900"
              onClick={() => fileRef.current?.click()}
            >
              {preview ? (
                <img src={preview} className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-white/30">
                  <FontAwesomeIcon icon={faCamera} className="text-2xl" />
                  <span className="text-xs">Click để chọn ảnh</span>
                </div>
              )}

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImage}
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-white/60 text-xs mb-1 block">
              Tiêu đề *
            </label>

            <input
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="Nhập tiêu đề bài viết..."
              className="w-full bg-dark-900 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-neon-pink/50"
            />
          </div>

          {/* Summary */}
          <div>
            <label className="text-white/60 text-xs mb-1 block">
              Tóm tắt
            </label>

            <textarea
              value={form.summary}
              onChange={e => setForm(p => ({ ...p, summary: e.target.value }))}
              rows={2}
              placeholder="Mô tả ngắn về bài viết..."
              className="w-full bg-dark-900 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-neon-pink/50 resize-none"
            />
          </div>

          {/* Quill Editor */}
          <div>
            <label className="text-white/60 text-xs mb-1 block">
              Nội dung *
            </label>

            <link
              rel="stylesheet"
              href="https://fonts.googleapis.com/css2?family=Roboto&family=Open+Sans&family=Montserrat&family=Dancing+Script&display=swap"
            />

            <ReactQuill
              theme="snow"
              value={form.content}
              onChange={val => setForm(p => ({ ...p, content: val }))}
              modules={quillModules}
              formats={quillFormats}
              placeholder="Nhập nội dung bài viết..."
            />
          </div>

          {/* Tags + Published */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-white/60 text-xs mb-1 block">
                <FontAwesomeIcon icon={faTag} className="mr-1" />
                Tags <span className="text-white/30">(phân cách bằng dấu phẩy)</span>
              </label>

              <input
                value={form.tags}
                onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
                placeholder="game, update, skin..."
                className="w-full bg-dark-900 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-neon-pink/50"
              />
            </div>

            <div>
              <label className="text-white/60 text-xs mb-1 block">
                Trạng thái
              </label>

              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, isPublished: !p.isPublished }))}
                className={`w-full py-2.5 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  form.isPublished
                    ? 'bg-green-500/15 border-green-500/30 text-green-400'
                    : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                }`}
              >
                <FontAwesomeIcon icon={form.isPublished ? faEye : faEyeSlash} />
                {form.isPublished ? 'Đã đăng' : 'Nháp'}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowModal(false)}
              className="flex-1 py-2.5 rounded-lg border border-white/10 text-white/50 hover:text-white text-sm transition-colors"
            >
              Hủy
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 rounded-lg bg-neon-pink/20 hover:bg-neon-pink/30 border border-neon-pink/30 text-neon-pink text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saving ? <Spinner size="sm" /> : <FontAwesomeIcon icon={faFloppyDisk} />}
              {editing ? 'Lưu thay đổi' : 'Tạo bài viết'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}