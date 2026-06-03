import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  faCheck,
  faImage,
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons'

const defaultForm = {
  title: '',
  subtitle: '',
  image: null,
  imageUrl: '',
  linkUrl: '',
  linkText: '',
  sortOrder: 0,
  isActive: true,
  mediaType: 'image',
}

const LIMIT = 6

export default function AdminBanners() {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(defaultForm)
  const [preview, setPreview] = useState('')
  const [saving, setSaving] = useState(false)

  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: LIMIT,
    total: 0,
    totalPages: 1,
  })

  useEffect(() => {
    fetchBanners(page)
  }, [page])

  const fetchBanners = async (pageNumber = 1) => {
    setLoading(true)

    try {
      const { data } = await api.get(`/banners/admin?page=${pageNumber}&limit=${LIMIT}`)

      setBanners(data.data || [])
      setPagination(data.pagination || {
        page: pageNumber,
        limit: LIMIT,
        total: 0,
        totalPages: 1,
      })
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi tải banner')
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

  const openEdit = b => {
    setEditing(b)
    setForm({
      ...defaultForm,
      ...b,
      image: null,
      mediaType: b.mediaType || 'image',
    })
    setPreview(b.imageUrl || '')
    setShowModal(true)
  }

  const handleImageChange = e => {
    const file = e.target.files[0]
    if (!file) return

    const mediaType = file.type.startsWith('video/') ? 'video' : 'image'

    setForm(p => ({
      ...p,
      image: file,
      mediaType,
    }))

    setPreview(URL.createObjectURL(file))
  }

  const handleSave = async e => {
    e.preventDefault()
    setSaving(true)

    try {
      const formData = new FormData()

      formData.append('title', form.title)
      formData.append('subtitle', form.subtitle || '')
      formData.append('linkUrl', form.linkUrl || '')
      formData.append('linkText', form.linkText || '')
      formData.append('sortOrder', form.sortOrder || 0)
      formData.append('isActive', form.isActive)

      if (form.image) {
        formData.append('image', form.image)
      }

      if (editing) {
        await api.put(`/banners/${editing.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        toast.success('Cập nhật banner!')
      } else {
        if (!form.image) {
          toast.error('Vui lòng chọn ảnh hoặc video banner')
          setSaving(false)
          return
        }

        await api.post('/banners', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })

        toast.success('Tạo banner mới!')
        setPage(1)
      }

      setShowModal(false)
      fetchBanners(editing ? page : 1)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi lưu banner')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async id => {
    if (!confirm('Xóa banner?')) return

    try {
      await api.delete(`/banners/${id}`)
      toast.success('Đã xóa')

      const nextPage =
        banners.length === 1 && page > 1
          ? page - 1
          : page

      setPage(nextPage)
      fetchBanners(nextPage)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi xóa banner')
    }
  }

  const goPage = nextPage => {
    if (nextPage < 1 || nextPage > pagination.totalPages) return
    setPage(nextPage)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-gaming text-xl font-bold text-gradient">
            Quản Lý Banner
          </h1>
          <p className="text-white/40 text-xs mt-1">
            Tổng: {pagination.total} banner
          </p>
        </div>

        <button
          onClick={openCreate}
          className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faPlus} />
          Thêm Banner
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : banners.length === 0 ? (
        <div className="gaming-card p-10 text-center text-white/50">
          Chưa có banner nào
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {banners.map((b, i) => (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="gaming-card overflow-hidden"
              >
                <div className="relative aspect-[16/7] min-h-[220px] bg-dark-800">
                  {b.mediaType === 'video' ? (
                    <video
                      src={b.imageUrl}
                      className="w-full h-full object-cover"
                      muted
                      loop
                      autoPlay
                      playsInline
                    />
                  ) : (
                    <img
                      src={b.imageUrl}
                      alt={b.title}
                      className="w-full h-full object-cover"
                      onError={e => {
                        e.currentTarget.style.background = '#14141f'
                      }}
                    />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 to-transparent" />

                  <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                    {b.mediaType === 'video' && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-purple-500/90 text-white">
                        VIDEO
                      </span>
                    )}

                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        b.isActive
                          ? 'bg-neon-green/90 text-dark-900'
                          : 'bg-white/20 text-white/60'
                      }`}
                    >
                      {b.isActive ? 'Active' : 'Hidden'}
                    </span>
                  </div>

                  <div className="absolute bottom-2 left-2 right-2">
                    <div className="text-white font-bold text-sm truncate">
                      {b.title}
                    </div>
                    {b.subtitle && (
                      <div className="text-white/50 text-xs truncate">
                        {b.subtitle}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-3 flex items-center justify-between">
                  <div className="text-white/30 text-xs">
                    Thứ tự: {b.sortOrder}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(b)}
                      className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 text-xs"
                    >
                      <FontAwesomeIcon icon={faPen} />
                    </button>

                    <button
                      onClick={() => handleDelete(b.id)}
                      className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => goPage(page - 1)}
                disabled={page <= 1}
                className="px-3 py-2 rounded-lg bg-dark-700 text-white/70 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>

              {Array.from({ length: pagination.totalPages }).map((_, idx) => {
                const pageNumber = idx + 1

                return (
                  <button
                    key={pageNumber}
                    onClick={() => goPage(pageNumber)}
                    className={`min-w-[36px] px-3 py-2 rounded-lg text-sm font-bold ${
                      page === pageNumber
                        ? 'bg-neon-pink text-white'
                        : 'bg-dark-700 text-white/60 hover:text-white'
                    }`}
                  >
                    {pageNumber}
                  </button>
                )
              })}

              <button
                onClick={() => goPage(page + 1)}
                disabled={page >= pagination.totalPages}
                className="px-3 py-2 rounded-lg bg-dark-700 text-white/70 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {showModal && (
          <Modal
            isOpen
            title={editing ? 'Sửa Banner' : 'Thêm Banner'}
            onClose={() => !saving && setShowModal(false)}
          >
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider font-display block mb-1">
                  Tiêu đề *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Banner Title"
                  required
                  className="input-gaming text-sm py-2"
                />
              </div>

              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider font-display block mb-1">
                  Phụ đề
                </label>
                <input
                  type="text"
                  value={form.subtitle || ''}
                  onChange={e => setForm(p => ({ ...p, subtitle: e.target.value }))}
                  placeholder="Mô tả ngắn"
                  className="input-gaming text-sm py-2"
                />
              </div>

              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider font-display block mb-2">
                  Ảnh / Video banner {editing ? '' : '*'}
                </label>

                <div
                  onClick={() => document.getElementById('banner-image-input')?.click()}
                  className="border-2 border-dashed border-white/20 rounded-2xl p-4 text-center cursor-pointer hover:border-neon-pink/50 transition-colors bg-dark-700/40"
                >
                  {preview ? (
                    <div className="relative group">
                      {form.mediaType === 'video' ||
                      (editing && editing.mediaType === 'video' && !form.image) ? (
                        <video
                          src={preview}
                          className="w-full max-h-[420px] object-contain rounded-xl border border-white/10 bg-black"
                          muted
                          loop
                          autoPlay
                          playsInline
                          controls
                        />
                      ) : (
                        <img
                          src={preview}
                          alt=""
                          className="w-full max-h-[420px] object-contain rounded-xl border border-white/10 bg-black"
                        />
                      )}

                      <div className="absolute inset-0 rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-sm font-bold flex items-center gap-2">
                          <FontAwesomeIcon icon={faCamera} />
                          Click để đổi file
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8">
                      <div className="text-5xl mb-3 text-white/30">
                        <FontAwesomeIcon icon={faImage} />
                      </div>
                      <p className="text-white/60 text-sm font-bold">
                        Click để chọn ảnh hoặc video banner
                      </p>
                      <p className="text-white/25 text-xs mt-1">
                        JPG, PNG, WebP, GIF — hoặc MP4, WebM, MOV
                      </p>
                    </div>
                  )}
                </div>

                <input
                  id="banner-image-input"
                  type="file"
                  accept="image/*,video/mp4,video/webm,video/quicktime"
                  onChange={handleImageChange}
                  required={!editing}
                  className="hidden"
                />

                {form.image && (
                  <p className="text-neon-green text-xs mt-2 flex items-center gap-1">
                    <FontAwesomeIcon icon={faCheck} />
                    Đã chọn file mới: {form.image.name}
                  </p>
                )}

                {editing && preview && !form.image && (
                  <p className="text-white/30 text-xs mt-2">
                    File hiện tại. Click vào preview để thay file mới.
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider font-display block mb-1">
                  Link URL
                </label>
                <input
                  type="text"
                  value={form.linkUrl || ''}
                  onChange={e => setForm(p => ({ ...p, linkUrl: e.target.value }))}
                  placeholder="/shop"
                  className="input-gaming text-sm py-2"
                />
              </div>

              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider font-display block mb-1">
                  Text nút
                </label>
                <input
                  type="text"
                  value={form.linkText || ''}
                  onChange={e => setForm(p => ({ ...p, linkText: e.target.value }))}
                  placeholder="Xem ngay"
                  className="input-gaming text-sm py-2"
                />
              </div>

              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider font-display block mb-1">
                  Thứ tự
                </label>
                <input
                  type="number"
                  value={form.sortOrder || 0}
                  onChange={e =>
                    setForm(p => ({
                      ...p,
                      sortOrder: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="input-gaming text-sm py-2"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))}
                  className="w-4 h-4 accent-pink-500"
                />

                <span className="text-white/70 text-sm">
                  Hiển thị banner
                </span>
              </label>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
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
    </div>
  )
}