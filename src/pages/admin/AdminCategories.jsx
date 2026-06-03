import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../api/axios'
import { Spinner } from '../../components/common/UIComponents'
import toast from 'react-hot-toast'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faFolderOpen,
  faGamepad,
  faCrown,
  faGem,
  faFire,
  faStar,
  faTrophy,
  faBullseye,
  faMoneyBillWave,
  faGift,
  faMoon,
  faXmark,
  faFloppyDisk,
  faPlus,
  faLock,
  faCheck,
  faPen,
  faTrash,
  faShieldHalved,
  faDice,
  faCoins,
  faBolt,
  faDragon,
  faGhost,
  faSkull,
  faRocket,
  faMedal,
  faWandMagicSparkles,
  faHeart,
  faHammer,
  faBomb,
  faKey,
  faImage,
  faUpload,
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons'

const LIMIT = 6

const ICON_OPTIONS = [
  { value: 'gamepad', icon: faGamepad },
  { value: 'crown', icon: faCrown },
  { value: 'gem', icon: faGem },
  { value: 'fire', icon: faFire },
  { value: 'star', icon: faStar },
  { value: 'trophy', icon: faTrophy },
  { value: 'target', icon: faBullseye },
  { value: 'money', icon: faMoneyBillWave },
  { value: 'gift', icon: faGift },
  { value: 'moon', icon: faMoon },
  { value: 'folder', icon: faFolderOpen },
  { value: 'shield', icon: faShieldHalved },
  { value: 'dice', icon: faDice },
  { value: 'coins', icon: faCoins },
  { value: 'bolt', icon: faBolt },
  { value: 'dragon', icon: faDragon },
  { value: 'ghost', icon: faGhost },
  { value: 'skull', icon: faSkull },
  { value: 'rocket', icon: faRocket },
  { value: 'medal', icon: faMedal },
  { value: 'wand', icon: faWandMagicSparkles },
  { value: 'heart', icon: faHeart },
  { value: 'hammer', icon: faHammer },
  { value: 'bomb', icon: faBomb },
  { value: 'key', icon: faKey },
  { value: 'lock', icon: faLock },
]

const ICON_MAP = ICON_OPTIONS.reduce((acc, item) => {
  acc[item.value] = item.icon
  return acc
}, {})

function CategoryIcon({ value, className = '' }) {
  return (
    <FontAwesomeIcon
      icon={ICON_MAP[value] || faFolderOpen}
      className={className}
    />
  )
}

function CategoryForm({ cat, onClose, onSaved }) {
  const isEdit = !!cat?.id

  const [form, setForm] = useState({
    name: cat?.name || '',
    description: cat?.description || '',
    icon: cat?.icon || 'folder',
    image: null,
    imagePreview: cat?.imageUrl || '',
    isActive: cat?.isActive ?? true,
    sortOrder: cat?.sortOrder || 0,
  })

  const [loading, setLoading] = useState(false)

  const handleImageChange = e => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh')
      return
    }

    setForm(p => ({
      ...p,
      image: file,
      imagePreview: URL.createObjectURL(file),
    }))
  }

  const save = async () => {
    if (!form.name.trim()) return toast.error('Vui lòng nhập tên danh mục')

    setLoading(true)

    try {
      const fd = new FormData()
      fd.append('name', form.name)
      fd.append('description', form.description || '')
      fd.append('icon', form.icon || 'folder')
      fd.append('sortOrder', form.sortOrder || 0)
      fd.append('isActive', form.isActive)

      if (form.image) {
        fd.append('image', form.image)
      }

      if (isEdit) {
        await api.put(`/categories/admin/${cat.id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      } else {
        await api.post('/categories/admin', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }

      toast.success(isEdit ? 'Đã cập nhật' : 'Đã tạo danh mục')
      onSaved()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi lưu danh mục')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="gaming-card border border-white/10 w-full max-w-2xl p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-gaming font-bold text-white flex items-center gap-2">
            <FontAwesomeIcon icon={faFolderOpen} className="text-neon-pink" />
            {isEdit ? 'Chỉnh sửa' : 'Tạo'} danh mục
          </h3>

          <button
            onClick={onClose}
            className="text-white/40 hover:text-white text-xl leading-none"
            disabled={loading}
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-4">
            <div>
              <label className="text-xs text-white/40 uppercase font-display block mb-1.5">
                Tên danh mục *
              </label>

              <input
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="input-gaming w-full"
                placeholder="VD: Acc Thách Đấu"
              />
            </div>

            <div>
              <label className="text-xs text-white/40 uppercase font-display block mb-1.5">
                Mô tả
              </label>

              <textarea
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                rows={4}
                className="input-gaming resize-none w-full"
                placeholder="Mô tả ngắn về danh mục..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/40 uppercase font-display block mb-1.5">
                  Thứ tự
                </label>

                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={e =>
                    setForm(p => ({
                      ...p,
                      sortOrder: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="input-gaming w-full"
                />
              </div>

              <div>
                <label className="text-xs text-white/40 uppercase font-display block mb-1.5">
                  Trạng thái
                </label>

                <button
                  type="button"
                  onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))}
                  className={`w-full h-[42px] rounded-xl border flex items-center justify-center gap-2 text-sm font-bold transition-all ${
                    form.isActive
                      ? 'border-green-400/30 bg-green-400/10 text-green-400'
                      : 'border-white/10 bg-dark-700 text-white/40'
                  }`}
                >
                  <FontAwesomeIcon icon={form.isActive ? faCheck : faLock} />
                  {form.isActive ? 'Đang hiện' : 'Đang ẩn'}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-white/40 uppercase font-display block mb-1.5">
              Ảnh bìa danh mục
            </label>

            <div className="relative h-44 rounded-2xl overflow-hidden bg-dark-700 border border-white/10 mb-3">
              {form.imagePreview ? (
                <>
                  <img
                    src={form.imagePreview}
                    alt=""
                    className="w-full h-full object-contain bg-black/30"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setForm(p => ({
                        ...p,
                        image: null,
                        imagePreview: '',
                      }))
                    }
                    className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-black/70 text-white/70 hover:text-white"
                  >
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-white/25">
                  <FontAwesomeIcon icon={faImage} className="text-4xl" />
                  <span className="text-xs">Chưa chọn ảnh</span>
                </div>
              )}
            </div>

            <label className="btn-neon w-full py-2.5 text-sm cursor-pointer flex items-center justify-center gap-2">
              <FontAwesomeIcon icon={faUpload} />
              Chọn ảnh upload
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </label>

            <div className="text-white/25 text-xs mt-2">
              Nên dùng ảnh ngang, ví dụ 800x450 hoặc 1200x675.
            </div>
          </div>
        </div>

        <div className="mt-5">
          <label className="text-xs text-white/40 uppercase font-display block mb-1.5">
            Icon
          </label>

          <div className="flex gap-2 mb-2 flex-wrap max-h-28 overflow-y-auto pr-1">
            {ICON_OPTIONS.map(item => (
              <button
                key={item.value}
                type="button"
                onClick={() => setForm(p => ({ ...p, icon: item.value }))}
                className={`w-9 h-9 rounded-lg text-base flex items-center justify-center border transition-all ${
                  form.icon === item.value
                    ? 'border-neon-pink bg-neon-pink/10 text-neon-pink'
                    : 'border-white/10 hover:border-white/30 text-white/70'
                }`}
              >
                <FontAwesomeIcon icon={item.icon} />
              </button>
            ))}
          </div>

          <div className="text-white/30 text-xs">
            Icon đang chọn:{' '}
            <span className="text-neon-pink font-mono">{form.icon}</span>
          </div>
        </div>

        <div className="flex gap-3 pt-5">
          <button
            onClick={onClose}
            disabled={loading}
            className="btn-neon flex-1 py-3 text-sm"
          >
            Hủy
          </button>

          <button
            onClick={save}
            disabled={loading}
            className="btn-primary flex-1 py-3 text-sm flex items-center justify-center gap-2"
          >
            {loading ? (
              <Spinner size="sm" color="white" />
            ) : isEdit ? (
              <>
                <FontAwesomeIcon icon={faFloppyDisk} />
                Lưu
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faPlus} />
                Tạo
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(null)

  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: LIMIT,
    total: 0,
    totalPages: 1,
  })

  const fetchCategories = useCallback(async (pageNumber = 1) => {
    setLoading(true)

    try {
      const { data } = await api.get(`/categories/admin?page=${pageNumber}&limit=${LIMIT}`)
      setCategories(data.data || [])
      setPagination(data.pagination || {
        page: pageNumber,
        limit: LIMIT,
        total: 0,
        totalPages: 1,
      })
    } catch (e) {
      setCategories([])
      toast.error(e.response?.data?.message || 'Lỗi tải danh mục')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories(page)
  }, [fetchCategories, page])

  const deleteCategory = async id => {
    if (!confirm('Xóa danh mục này?')) return

    try {
      await api.delete(`/categories/admin/${id}`)
      toast.success('Đã xóa')

      const nextPage = categories.length === 1 && page > 1 ? page - 1 : page
      setPage(nextPage)
      fetchCategories(nextPage)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi')
    }
  }

  const toggleActive = async cat => {
    try {
      const fd = new FormData()
      fd.append('isActive', !cat.isActive)

      await api.put(`/categories/admin/${cat.id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      fetchCategories(page)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi')
    }
  }

  const goPage = nextPage => {
    if (nextPage < 1 || nextPage > pagination.totalPages) return
    setPage(nextPage)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-gaming text-2xl font-bold text-gradient flex items-center gap-2">
            <FontAwesomeIcon icon={faFolderOpen} />
            Danh mục tài khoản
          </h1>

          <p className="text-white/40 text-sm">
            Quản lý thể loại tài khoản trong shop · Tổng {pagination.total} danh mục
          </p>
        </div>

        <button
          onClick={() => setForm({ icon: 'folder', isActive: true, sortOrder: 0 })}
          className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faPlus} />
          Tạo danh mục
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : categories.length === 0 ? (
        <div className="col-span-full text-center py-16 text-white/30 gaming-card">
          <div className="text-5xl mb-3">
            <FontAwesomeIcon icon={faFolderOpen} />
          </div>
          <p>Chưa có danh mục nào</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`gaming-card border p-5 transition-all ${
                  cat.isActive ? 'border-white/10' : 'border-white/5 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-24 h-16 rounded-xl overflow-hidden bg-dark-700 flex items-center justify-center flex-shrink-0 border border-white/5 text-neon-pink">
                    {cat.imageUrl ? (
                      <img
                        src={cat.imageUrl}
                        alt=""
                        className="w-full h-full object-contain bg-black/30"
                      />
                    ) : (
                      <span className="text-2xl">
                        <CategoryIcon value={cat.icon} />
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white truncate">{cat.name}</p>
                    <p className="text-white/40 text-xs font-mono truncate">{cat.slug}</p>
                    <p className="text-white/30 text-xs">
                      {cat.availableCount ?? cat._count?.accounts ?? 0} tài khoản khả dụng
                    </p>
                  </div>

                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      cat.isActive ? 'bg-green-400' : 'bg-white/20'
                    }`}
                  />
                </div>

                {cat.description && (
                  <p className="text-white/30 text-xs mb-4 line-clamp-2">
                    {cat.description}
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => toggleActive(cat)}
                    className={`flex-1 text-xs py-2 rounded-lg border transition-all flex items-center justify-center gap-1 ${
                      cat.isActive
                        ? 'border-red-400/20 text-red-400/60 hover:bg-red-400/10 hover:text-red-400'
                        : 'border-green-400/20 text-green-400/60 hover:bg-green-400/10 hover:text-green-400'
                    }`}
                  >
                    {cat.isActive ? (
                      <>
                        <FontAwesomeIcon icon={faLock} />
                        Ẩn
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faCheck} />
                        Hiện
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setForm(cat)}
                    className="flex-1 text-xs py-2 rounded-lg border border-white/10 text-white/60 hover:border-white/30 hover:text-white transition-all flex items-center justify-center gap-1"
                  >
                    <FontAwesomeIcon icon={faPen} />
                    Sửa
                  </button>

                  <button
                    onClick={() => deleteCategory(cat.id)}
                    className="px-3 text-xs py-2 rounded-lg border border-red-400/20 text-red-400/60 hover:bg-red-400/10 hover:text-red-400 transition-all"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
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
        {form !== null && (
          <CategoryForm
            cat={form}
            onClose={() => setForm(null)}
            onSaved={() => {
              setForm(null)
              if (!form?.id) {
                setPage(1)
                fetchCategories(1)
              } else {
                fetchCategories(page)
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}