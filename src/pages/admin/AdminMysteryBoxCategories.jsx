import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import api from '../../api/axios'
import { formatCurrency, getRarityLabel } from '../../utils/helpers'
import { Spinner, RarityBadge } from '../../components/common/UIComponents'
import toast from 'react-hot-toast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBoxOpen,
  faPlus,
  faPen,
  faTrash,
  faImage,
  faFloppyDisk,
  faToggleOn,
  faToggleOff,
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons'

const RARITIES = ['COMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC']
const LIMIT = 6

const defaultForm = {
  name: '',
  slug: '',
  description: '',
  price: '',
  rarity: 'COMMON',
  isActive: true,
  sortOrder: 0,
  thumbnail: null,
  thumbnailPreview: '',
  detail: null,
  detailPreview: '',
}

const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['blockquote', 'link'],
    ['clean'],
  ],
}

export default function AdminMysteryBoxCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editCat, setEditCat] = useState(null)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [htmlMode, setHtmlMode] = useState(false)

  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: LIMIT,
    total: 0,
    totalPages: 1,
  })

  useEffect(() => {
    fetchCategories(page)
  }, [page])

  const fetchCategories = async (pageNumber = 1) => {
    setLoading(true)

    try {
      const { data } = await api.get(
        `/mystery-box/admin/categories?page=${pageNumber}&limit=${LIMIT}`
      )

      setCategories(data.data || [])
      setPagination(
        data.pagination || {
          page: pageNumber,
          limit: LIMIT,
          total: 0,
          totalPages: 1,
        }
      )
    } catch {
      toast.error('Lỗi tải danh sách')
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditCat(null)
    setForm(defaultForm)
    setShowModal(true)
  }

  const openEdit = cat => {
    setEditCat(cat)
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      price: cat.price,
      rarity: cat.rarity,
      isActive: cat.isActive,
      sortOrder: cat.sortOrder,
      thumbnail: null,
      thumbnailPreview: cat.thumbnail || '',
      detail: null,
      detailPreview: cat.detailImage || '',
    })
    setShowModal(true)
  }

  const handleImageChange = (field, e) => {
    const file = e.target.files[0]
    if (!file) return

    const preview = URL.createObjectURL(file)

    setForm(f => ({
      ...f,
      [field]: file,
      [`${field}Preview`]: preview,
    }))
  }

  const handleSave = async () => {
    if (!form.name || !form.price) {
      toast.error('Vui lòng nhập tên và giá')
      return
    }

    setSaving(true)

    try {
      const fd = new FormData()

      fd.append('name', form.name)
      fd.append(
        'slug',
        form.slug ||
          form.name
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
      )
      fd.append('description', form.description || '')
      fd.append('price', form.price)
      fd.append('rarity', form.rarity)
      fd.append('isActive', form.isActive)
      fd.append('sortOrder', form.sortOrder)

      if (form.thumbnail) fd.append('thumbnail', form.thumbnail)
      if (form.detail) fd.append('detail', form.detail)

      if (editCat) {
        await api.put(`/mystery-box/admin/categories/${editCat.id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        toast.success('Cập nhật thành công')
      } else {
        await api.post('/mystery-box/admin/categories', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        toast.success('Tạo category thành công')
        setPage(1)
      }

      setShowModal(false)
      fetchCategories(editCat ? page : 1)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi lưu')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async id => {
    try {
      await api.delete(`/mystery-box/admin/categories/${id}`)
      toast.success('Đã xóa')

      const nextPage = categories.length === 1 && page > 1 ? page - 1 : page
      setPage(nextPage)
      fetchCategories(nextPage)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi xóa')
    }

    setDeleteConfirm(null)
  }

  const toggleActive = async cat => {
    try {
      await api.put(`/mystery-box/admin/categories/${cat.id}`, {
        isActive: !cat.isActive,
      })

      fetchCategories(page)
    } catch {
      toast.error('Lỗi cập nhật')
    }
  }

  const goPage = nextPage => {
    if (nextPage < 1 || nextPage > pagination.totalPages) return
    setPage(nextPage)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-gaming text-xl font-bold text-white flex items-center gap-2">
            <FontAwesomeIcon icon={faBoxOpen} className="text-neon-pink" />
            Quản Lý Category Túi Mù
          </h2>
          <p className="text-white/40 text-sm mt-1">
            Tổng {pagination.total} category
          </p>
        </div>

        <button
          onClick={openCreate}
          className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faPlus} />
          Thêm Category
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : (
        <>
          <div className="gaming-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5 text-white/40 text-xs uppercase tracking-wider">
                    <th className="text-left px-4 py-3">Thumbnail</th>
                    <th className="text-left px-4 py-3">Ảnh Chi Tiết</th>
                    <th className="text-left px-4 py-3">Tên / Slug</th>
                    <th className="text-left px-4 py-3">Giá</th>
                    <th className="text-left px-4 py-3">Rarity</th>
                    <th className="text-left px-4 py-3">Acc</th>
                    <th className="text-left px-4 py-3">Đã bán</th>
                    <th className="text-left px-4 py-3">Sort</th>
                    <th className="text-left px-4 py-3">Trạng thái</th>
                    <th className="text-left px-4 py-3">Hành động</th>
                  </tr>
                </thead>

                <tbody>
                  {categories.map(cat => (
                    <tr
                      key={cat.id}
                      className="border-b border-white/5 hover:bg-white/2 transition-colors"
                    >
                      <td className="px-4 py-3">
                        {cat.thumbnail ? (
                          <img
                            src={cat.thumbnail}
                            alt=""
                            className="w-20 h-14 rounded-lg object-contain bg-black/30 border border-white/10"
                          />
                        ) : (
                          <div className="w-20 h-14 rounded-lg bg-dark-700 flex items-center justify-center">
                            <FontAwesomeIcon
                              icon={faImage}
                              className="text-white/20"
                            />
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {cat.detailImage ? (
                          <img
                            src={cat.detailImage}
                            alt=""
                            className="w-24 h-14 rounded-lg object-contain"
                          />
                        ) : (
                          <div className="w-24 h-14 rounded-lg bg-dark-700 border border-dashed border-white/10 flex items-center justify-center">
                            <FontAwesomeIcon
                              icon={faImage}
                              className="text-white/15 text-xs"
                            />
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium text-white text-sm">
                          {cat.name}
                        </div>
                        <div className="text-white/30 text-xs font-mono">
                          {cat.slug}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-gaming font-bold text-neon-pink text-sm">
                          {formatCurrency(cat.price)}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <RarityBadge rarity={cat.rarity} size="xs" />
                      </td>

                      <td className="px-4 py-3 text-white/70 text-sm">
                        {cat._count?.accounts || 0}
                      </td>

                      <td className="px-4 py-3 text-white/70 text-sm">
                        {cat.soldCount}
                      </td>

                      <td className="px-4 py-3 text-white/50 text-sm">
                        {cat.sortOrder}
                      </td>

                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleActive(cat)}
                          className={`text-lg ${
                            cat.isActive ? 'text-neon-green' : 'text-white/20'
                          }`}
                        >
                          <FontAwesomeIcon
                            icon={cat.isActive ? faToggleOn : faToggleOff}
                          />
                        </button>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEdit(cat)}
                            className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-sm transition-colors"
                            title="Sửa"
                          >
                            <FontAwesomeIcon icon={faPen} />
                          </button>

                          <button
                            onClick={() => setDeleteConfirm(cat)}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm transition-colors"
                            title="Xóa"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {categories.length === 0 && (
                    <tr>
                      <td
                        colSpan={10}
                        className="text-center py-12 text-white/30"
                      >
                        Chưa có category nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
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
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => !saving && setShowModal(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative gaming-card w-full max-w-2xl my-8 p-6 z-10"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="font-gaming text-lg font-bold text-white mb-5 flex items-center gap-2">
                <FontAwesomeIcon icon={faBoxOpen} className="text-neon-pink" />
                {editCat ? 'Sửa Category' : 'Tạo Category Mới'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-white/50 text-xs mb-1.5 uppercase tracking-wider">
                    Tên *
                  </label>
                  <input
                    className="input-gaming w-full"
                    value={form.name}
                    onChange={e =>
                      setForm(f => ({
                        ...f,
                        name: e.target.value,
                        slug:
                          f.slug ||
                          e.target.value
                            .toLowerCase()
                            .replace(/\s+/g, '-')
                            .replace(/[^a-z0-9-]/g, ''),
                      }))
                    }
                    placeholder="Túi Mù 99K"
                  />
                </div>

                <div>
                  <label className="block text-white/50 text-xs mb-1.5 uppercase tracking-wider">
                    Slug
                  </label>
                  <input
                    className="input-gaming w-full font-mono text-sm"
                    value={form.slug}
                    onChange={e =>
                      setForm(f => ({ ...f, slug: e.target.value }))
                    }
                    placeholder="tui-mu-99k"
                  />
                </div>

                <div>
                  <label className="block text-white/50 text-xs mb-1.5 uppercase tracking-wider">
                    Giá *
                  </label>
                  <input
                    className="input-gaming w-full"
                    type="number"
                    value={form.price}
                    onChange={e =>
                      setForm(f => ({ ...f, price: e.target.value }))
                    }
                    placeholder="99000"
                  />
                </div>

                <div>
                  <label className="block text-white/50 text-xs mb-1.5 uppercase tracking-wider">
                    Rarity
                  </label>
                  <select
                    className="input-gaming w-full"
                    value={form.rarity}
                    onChange={e =>
                      setForm(f => ({ ...f, rarity: e.target.value }))
                    }
                  >
                    {RARITIES.map(r => (
                      <option key={r} value={r}>
                        {getRarityLabel(r)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-white/50 text-xs mb-1.5 uppercase tracking-wider">
                    Sort Order
                  </label>
                  <input
                    className="input-gaming w-full"
                    type="number"
                    value={form.sortOrder}
                    onChange={e =>
                      setForm(f => ({ ...f, sortOrder: e.target.value }))
                    }
                  />
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-white/50 text-xs uppercase tracking-wider">
                    Hoạt động
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setForm(f => ({ ...f, isActive: !f.isActive }))
                    }
                    className={`text-2xl ${
                      form.isActive ? 'text-neon-green' : 'text-white/20'
                    }`}
                  >
                    <FontAwesomeIcon
                      icon={form.isActive ? faToggleOn : faToggleOff}
                    />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                {[
                  ['thumbnail', 'Thumbnail'],
                  ['detail', 'Ảnh Chi Tiết'],
                ].map(([field, label]) => (
                  <div key={field}>
                    <label className="block text-white/50 text-xs mb-1.5 uppercase tracking-wider">
                      <FontAwesomeIcon icon={faImage} className="mr-1" />
                      {label}
                    </label>

                    <div className="relative">
                      {form[`${field}Preview`] ? (
                        <div className="relative h-28 rounded-xl overflow-hidden bg-dark-700 mb-2 border border-white/10">
                          <img
                            src={form[`${field}Preview`]}
                            alt=""
                            className="w-full h-full object-contain bg-black/30"
                          />
                          <button
                            className="absolute top-1 right-1 text-white/60 hover:text-white bg-dark-900/80 rounded px-1.5 text-xs"
                            onClick={() =>
                              setForm(f => ({
                                ...f,
                                [field]: null,
                                [`${field}Preview`]: '',
                              }))
                            }
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="h-28 rounded-xl bg-dark-700 border border-white/10 flex items-center justify-center mb-2">
                          <FontAwesomeIcon
                            icon={faImage}
                            className="text-2xl text-white/20"
                          />
                        </div>
                      )}

                      <label className="btn-neon text-xs py-1.5 px-2 cursor-pointer w-full text-center block">
                        Chọn ảnh
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => handleImageChange(field, e)}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mb-5">
                <label className="block text-white/50 text-xs mb-1.5 uppercase tracking-wider">
                  Mô tả
                </label>

                <div className="admin-quill-editor rounded-xl overflow-hidden">
                  <ReactQuill
                    value={form.description}
                    onChange={val =>
                      setForm(f => ({ ...f, description: val }))
                    }
                    modules={QUILL_MODULES}
                    theme="snow"
                    placeholder="Nhập mô tả về túi mù này..."
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  className="btn-neon text-sm px-5 py-2.5"
                >
                  Hủy
                </button>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary text-sm px-6 py-2.5 flex items-center gap-2"
                >
                  {saving ? (
                    <Spinner size="sm" color="white" />
                  ) : (
                    <FontAwesomeIcon icon={faFloppyDisk} />
                  )}
                  {editCat ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black/70"
              onClick={() => setDeleteConfirm(null)}
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative gaming-card p-6 max-w-sm w-full z-10 text-center"
            >
              <div className="text-4xl mb-3">⚠️</div>
              <h3 className="font-gaming font-bold text-white mb-2">
                Xóa Category?
              </h3>
              <p className="text-white/50 text-sm mb-5">
                Xóa{' '}
                <strong className="text-white">
                  {deleteConfirm.name}
                </strong>
                ? Nếu có acc đã bán, bạn không thể xóa.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 btn-neon text-sm py-2.5"
                >
                  Hủy
                </button>

                <button
                  onClick={() => handleDelete(deleteConfirm.id)}
                  className="flex-1 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-colors"
                >
                  Xóa
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}