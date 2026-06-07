/**
 * AdminSkinTemplates.jsx
 * Quản lý Skin Templates — Admin seed dữ liệu để AI nhận diện
 * Dùng Gemini Vision + MySQL fuzzy match (không Pinecone)
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faWandMagicSparkles, faPlus, faPen, faTrash, faSearch,
  faXmark, faFloppyDisk, faImage, faCamera,
  faShieldHalved, faStar, faBolt, faCrown, faGem,
} from '@fortawesome/free-solid-svg-icons'
import api from '../../api/axios'
import { Modal, Spinner, Pagination } from '../../components/common/UIComponents'
import toast from 'react-hot-toast'

const PAGE_LIMIT = 10

const RARITY_OPTIONS = [
  { value: 'COMMON', label: 'SS', color: 'text-gray-400', bg: 'bg-gray-400/10 border-gray-400/30', icon: faShieldHalved },
  { value: 'RARE', label: 'SS Hữu Hạn', color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/30', icon: faStar },
  { value: 'EPIC', label: 'Hợp Tác', color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/30', icon: faGem },
  { value: 'LEGENDARY', label: 'SSS', color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/30', icon: faCrown },
  { value: 'MYTHIC', label: 'SSS+', color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/30', icon: faBolt },
]

const getRarity = r => RARITY_OPTIONS.find(o => o.value === r) || RARITY_OPTIONS[0]

const defaultForm = {
  skinName: '',
  heroName: '',
  rarity: 'COMMON',
  aliases: '',
}

export default function AdminSkinTemplates() {
  const [templates, setTemplates] = useState([])
  const [heroes, setHeroes] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)

  const [search, setSearch] = useState('')
  const [filterHero, setFilterHero] = useState('')
  const [filterRarity, setFilterRarity] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(defaultForm)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const fileRef = useRef(null)

  const totalPages = Math.ceil(total / PAGE_LIMIT)

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    try {
      const q = new URLSearchParams({ page, limit: PAGE_LIMIT })

      if (search.trim()) q.set('search', search.trim())
      if (filterHero) q.set('heroName', filterHero)
      if (filterRarity) q.set('rarity', filterRarity)

      const { data } = await api.get(`/skin-templates?${q}`)
      setTemplates(data.data || [])
      setTotal(data.pagination?.total || 0)
    } catch {
      setTemplates([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, search, filterHero, filterRarity])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  useEffect(() => {
    fetchHeroes()
    fetchStats()
  }, [])

  const fetchHeroes = async () => {
    try {
      const { data } = await api.get('/skin-templates/heroes')
      setHeroes(data.data || [])
    } catch {
      setHeroes([])
    }
  }

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/skin-templates/stats')
      setStats(data.data)
    } catch {}
  }

  const resetFilters = () => {
    setSearch('')
    setFilterHero('')
    setFilterRarity('')
    setPage(1)
  }

  const openCreate = () => {
    setEditing(null)
    setForm(defaultForm)
    setImageFile(null)
    setImagePreview(null)
    setShowModal(true)
  }

  const openEdit = tpl => {
    setEditing(tpl)
    setForm({
      skinName: tpl.skinName,
      heroName: tpl.heroName,
      rarity: tpl.rarity,
      aliases: tpl.aliases || '',
    })
    setImageFile(null)
    setImagePreview(tpl.imageUrl || null)
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.skinName.trim()) return toast.error('Nhập tên skin')
    if (!form.heroName.trim()) return toast.error('Nhập tên tướng')

    setSaving(true)

    try {
      const fd = new FormData()
      fd.append('skinName', form.skinName.trim())
      fd.append('heroName', form.heroName.trim())
      fd.append('rarity', form.rarity)
      fd.append('aliases', form.aliases.trim())

      if (imageFile) fd.append('image', imageFile)

      if (editing) {
        await api.put(`/skin-templates/${editing.id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        toast.success('Cập nhật thành công')
      } else {
        const { data } = await api.post('/skin-templates', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })

        toast.success('Tạo skin template thành công')

        if (data.verifyResult && !data.verifyResult.isMatch) {
          toast('Gemini nhận thấy ảnh có thể không khớp tên skin — kiểm tra lại', {
            icon: '⚠️',
          })
        }
      }

      setShowModal(false)
      fetchTemplates()
      fetchHeroes()
      fetchStats()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi lưu')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async id => {
    if (!window.confirm('Xóa skin template này?')) return

    setDeleting(id)

    try {
      await api.delete(`/skin-templates/${id}`)
      toast.success('Đã xóa')
      fetchTemplates()
      fetchStats()
    } catch {
      toast.error('Lỗi xóa')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-3">
            <FontAwesomeIcon icon={faWandMagicSparkles} className="text-purple-400" />
            Skin Templates
          </h1>
          <p className="text-white/40 text-sm mt-1">
            Seed dữ liệu skin — AI dùng để nhận diện tự động từ ảnh account
          </p>
        </div>

        <button
          onClick={openCreate}
          className="btn-primary text-sm flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faPlus} />
          Thêm skin
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="glass rounded-xl p-3 border border-purple-500/20 min-h-[78px]">
            <p className="text-white/40 text-[11px] font-display uppercase tracking-wider">
              Tổng skin
            </p>
            <p className="text-white text-xl font-bold mt-1">{stats.total}</p>
          </div>

          {RARITY_OPTIONS.slice(1).map(r => {
            const count = stats.byRarity?.find(b => b.rarity === r.value)?._count || 0

            return (
              <div
                key={r.value}
                className={`glass rounded-xl p-3 border ${r.bg} min-h-[78px]`}
              >
                <p className={`text-[11px] font-display uppercase tracking-wider ${r.color}`}>
                  <FontAwesomeIcon icon={r.icon} className="mr-1" />
                  {r.label}
                </p>
                <p className="text-white text-xl font-bold mt-1">{count}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Filters */}
      <div className="glass rounded-xl p-3 flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-[260px]">
          <FontAwesomeIcon
            icon={faSearch}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-xs"
          />
          <input
            type="text"
            placeholder="Tìm skin, tướng, alias..."
            value={search}
            onChange={e => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="input-gaming text-sm py-2 pl-8 w-full"
          />
        </div>

        <select
          value={filterHero}
          onChange={e => {
            setFilterHero(e.target.value)
            setPage(1)
          }}
          className="input-gaming text-sm py-2 w-full sm:w-[150px]"
        >
          <option value="">Tất cả tướng</option>
          {heroes.map(h => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>

        <select
          value={filterRarity}
          onChange={e => {
            setFilterRarity(e.target.value)
            setPage(1)
          }}
          className="input-gaming text-sm py-2 w-full sm:w-[150px]"
        >
          <option value="">Tất cả độ hiếm</option>
          {RARITY_OPTIONS.map(r => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>

        {(search || filterHero || filterRarity) && (
          <button
            onClick={resetFilters}
            className="btn-secondary text-sm h-[38px] px-3 flex items-center gap-1"
          >
            <FontAwesomeIcon icon={faXmark} />
            Xóa
          </button>
        )}

        <div className="ml-auto text-white/30 text-xs hidden md:block">
          {total} skin
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-16 text-white/40">
            <FontAwesomeIcon icon={faWandMagicSparkles} className="text-4xl mb-3 opacity-30" />
            <p className="mb-4">Chưa có skin template nào</p>
            <button onClick={openCreate} className="btn-primary text-sm">
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              Thêm skin đầu tiên
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    {['Skin', 'Tướng', 'Độ hiếm', 'Aliases', ''].map(h => (
                      <th
                        key={h}
                        className="text-left text-xs text-white/40 font-display uppercase tracking-wider px-4 py-3"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  <AnimatePresence>
                    {templates.map((tpl, i) => {
                      const rarity = getRarity(tpl.rarity)

                      return (
                        <motion.tr
                          key={tpl.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="border-b border-white/5 hover:bg-white/3 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {tpl.imageUrl ? (
                                <img
                                  src={tpl.imageUrl}
                                  alt={tpl.skinName}
                                  className="w-10 h-10 rounded-lg object-cover border border-white/10"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                                  <FontAwesomeIcon icon={faImage} className="text-white/20" />
                                </div>
                              )}

                              <span className="text-white font-medium text-sm">
                                {tpl.skinName}
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-3 text-white/70 text-sm">
                            {tpl.heroName}
                          </td>

                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 text-xs border rounded-full px-2 py-0.5 ${rarity.bg} ${rarity.color}`}>
                              <FontAwesomeIcon icon={rarity.icon} className="text-[10px]" />
                              {rarity.label}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-white/40 text-xs max-w-[260px] truncate">
                            {tpl.aliases || '—'}
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 justify-end">
                              <button
                                onClick={() => openEdit(tpl)}
                                className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                              >
                                <FontAwesomeIcon icon={faPen} className="text-xs" />
                              </button>

                              <button
                                onClick={() => handleDelete(tpl.id)}
                                disabled={deleting === tpl.id}
                                className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-colors"
                              >
                                <FontAwesomeIcon icon={faTrash} className="text-xs" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      )
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="p-4 bg-dark-800 border-t border-white/10">
                <Pagination
                  page={page}
                  pages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Sửa Skin Template' : 'Thêm Skin Template'}
      >
        <div className="space-y-4">
          {/* Image */}
          <div>
            <label className="text-xs text-white/40 font-display uppercase tracking-wider block mb-2 flex items-center gap-2">
              <FontAwesomeIcon icon={faCamera} />
              Ảnh mẫu skin
              <span className="text-white/20 normal-case">
                (Gemini dùng để verify)
              </span>
            </label>

            <div
              onClick={() => fileRef.current?.click()}
              className="relative w-full h-36 rounded-xl border-2 border-dashed border-white/20 hover:border-purple-400/50 transition-colors cursor-pointer flex items-center justify-center overflow-hidden group"
            >
              {imagePreview ? (
                <>
                  <img
                    src={imagePreview}
                    alt=""
                    className="w-full h-full object-cover"
                  />

                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <FontAwesomeIcon icon={faCamera} className="text-white text-2xl" />
                  </div>
                </>
              ) : (
                <div className="text-center text-white/30">
                  <FontAwesomeIcon icon={faImage} className="text-2xl mb-2" />
                  <p className="text-xs">Click để upload ảnh skin mẫu</p>
                </div>
              )}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={e => {
                const f = e.target.files[0]
                if (f) {
                  setImageFile(f)
                  setImagePreview(URL.createObjectURL(f))
                }
              }}
              className="hidden"
            />
          </div>

          {/* Skin Name */}
          <div>
            <label className="text-xs text-white/40 font-display uppercase tracking-wider block mb-1">
              Tên skin *
            </label>
            <input
              type="text"
              value={form.skinName}
              onChange={e => setForm(p => ({ ...p, skinName: e.target.value }))}
              placeholder="VD: Nakroth Tử Thần"
              className="input-gaming text-sm py-2 w-full"
            />
          </div>

          {/* Hero Name */}
          <div>
            <label className="text-xs text-white/40 font-display uppercase tracking-wider block mb-1">
              Tên tướng *
            </label>
            <input
              type="text"
              value={form.heroName}
              onChange={e => setForm(p => ({ ...p, heroName: e.target.value }))}
              placeholder="VD: Nakroth"
              className="input-gaming text-sm py-2 w-full"
              list="hero-list"
            />
            <datalist id="hero-list">
              {heroes.map(h => (
                <option key={h} value={h} />
              ))}
            </datalist>
          </div>

          {/* Rarity */}
          <div>
            <label className="text-xs text-white/40 font-display uppercase tracking-wider block mb-2">
              Độ hiếm
            </label>

            <div className="flex flex-wrap gap-2">
              {RARITY_OPTIONS.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, rarity: r.value }))}
                  className={`flex items-center gap-1.5 text-xs border rounded-full px-3 py-1.5 transition-all ${
                    form.rarity === r.value
                      ? `${r.bg} ${r.color} ring-1 ring-current`
                      : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                  }`}
                >
                  <FontAwesomeIcon icon={r.icon} className="text-[10px]" />
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Aliases */}
          <div>
            <label className="text-xs text-white/40 font-display uppercase tracking-wider block mb-1">
              Aliases
              <span className="text-white/20 normal-case">
                {' '}cách nhau bởi dấu phẩy — giúp AI match chính xác hơn
              </span>
            </label>

            <input
              type="text"
              value={form.aliases}
              onChange={e => setForm(p => ({ ...p, aliases: e.target.value }))}
              placeholder="VD: Tu Than, Tử Thần Nakroth, Death Nakroth"
              className="input-gaming text-sm py-2 w-full"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowModal(false)}
              className="btn-secondary flex-1 text-sm"
            >
              Hủy
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex-1 text-sm flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <span className="animate-spin">⟳</span>
                  Đang lưu...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faFloppyDisk} />
                  {editing ? 'Cập nhật' : 'Tạo template'}
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}