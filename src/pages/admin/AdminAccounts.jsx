import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../api/axios'
import { formatCurrency, getRankColor } from '../../utils/helpers'
import { Modal, Spinner, Pagination, EmptyState } from '../../components/common/UIComponents'
import toast from 'react-hot-toast'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import {
  faPlus,
  faSearch,
  faCheck,
  faXmark,
  faEyeSlash,
  faGamepad,
  faPen,
  faTrash,
  faFire,
  faStar,
  faShieldHalved,
  faCamera,
  faFloppyDisk,
  faImage,
  faTriangleExclamation,
  faEnvelope,
  faPhone,
  faLink,
  faBan,
} from '@fortawesome/free-solid-svg-icons'

const defaultForm = {
  code: '',
  title: '',
  description: '',
  price: '',
  originalPrice: '',
  server: 'Server 1',
  rank: 'Vàng',
  categoryId: '',
  champions: '',
  skins: '',
  skinNames: '',
  level: '1',
  winRate: '',
  matches: '',
  gems: '',
  vouchers: '',
  gameUsername: '',
  gamePassword: '',
  gameBindEmail: '',
  gameBindPhone: '',
  gameBindFacebook: 'NONE',
  isFeatured: false,
  isNew: false,
  isVerified: false,
}

const NULLABLE_FIELDS = [
  'originalPrice',
  'winRate',
  'description',
  'gameBindEmail',
  'gameBindPhone',
  'gameUsername',
  'gamePassword',
  'skinNames',
  'categoryId',
]

export default function AdminAccounts() {
  const [accounts, setAccounts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [accInfoFilter, setAccInfoFilter] = useState('ALL')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [imageFiles, setImageFiles] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchAccounts()
  }, [page, search, statusFilter, accInfoFilter])

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/categories')
      setCategories(data.data || [])
    } catch (e) {
      setCategories([])
    }
  }

  const fetchAccounts = async () => {
    setLoading(true)

    try {
      const q = new URLSearchParams({
        page,
        limit: 10,
        ...(search && { search }),
        ...(statusFilter !== 'ALL' && { status: statusFilter }),
        ...(accInfoFilter !== 'ALL' && { accInfo: accInfoFilter }),
      })

      const { data } = await api.get(`/accounts?${q}&admin=1`)
      setAccounts(data.data || [])
      setTotal(data.pagination?.total || 0)
    } catch (e) {
      setAccounts([])
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditing(null)
    setForm(defaultForm)
    setImageFiles([])
    setImagePreviews([])
    setShowModal(true)
  }

  const openEdit = async acc => {
    try {
      const { data } = await api.get(`/accounts/${acc.id}`)
      const detail = data.data

      setEditing(detail)
      setForm({
        ...defaultForm,
        ...detail,
        price: detail.price != null ? String(detail.price) : '',
        originalPrice: detail.originalPrice != null ? String(detail.originalPrice) : '',
        categoryId: detail.categoryRelations?.[0]?.categoryId || '',
        champions: detail.champions != null ? String(detail.champions) : '',
        skins: detail.skins != null ? String(detail.skins) : '',
        skinNames: detail.skins_rel?.map(s => s.skinName).join('\n') || '',
        level: detail.level != null ? String(detail.level) : '',
        winRate: detail.winRate != null ? String(detail.winRate) : '',
        matches: detail.matches != null ? String(detail.matches) : '',
        gems: detail.gems != null ? String(detail.gems) : '',
        vouchers: detail.vouchers != null ? String(detail.vouchers) : '',
        gameUsername: detail.gameUsername || '',
        gamePassword: detail.gamePassword || '',
        gameBindEmail: detail.gameBindEmail || '',
        gameBindPhone: detail.gameBindPhone || '',
        gameBindFacebook: detail.gameBindFacebook || 'NONE',
        description: detail.description || '',
      })

      setImageFiles([])
      setImagePreviews(detail.images?.map(i => i.url) || (detail.thumbnailUrl ? [detail.thumbnailUrl] : []))
      setShowModal(true)
    } catch (e) {
      toast.error('Lỗi tải chi tiết tài khoản')
    }
  }

  const handleImageChange = e => {
    const files = Array.from(e.target.files)
    if (!files.length) return

    setImageFiles(files)
    setImagePreviews(files.map(f => URL.createObjectURL(f)))
  }

  const handleSave = async e => {
    e.preventDefault()
    setSaving(true)

    try {
      const fd = new FormData()

      Object.entries(form).forEach(([k, v]) => {
        if (NULLABLE_FIELDS.includes(k)) {
          fd.append(k, v ?? '')
        } else if (v !== null && v !== undefined && v !== '') {
          fd.append(k, v)
        }
      })

      imageFiles.forEach(f => fd.append('images', f))

      if (editing) {
        await api.put(`/accounts/${editing.id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        toast.success('Cập nhật thành công!')
      } else {
        await api.post('/accounts', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        toast.success('Tạo tài khoản thành công!')
      }

      setShowModal(false)
      fetchAccounts()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi lưu')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async id => {
    if (!confirm('Xóa tài khoản này?')) return

    setDeleting(id)

    try {
      await api.delete(`/accounts/${id}`)
      toast.success('Đã xóa')
      fetchAccounts()
    } catch (e) {
      toast.error('Lỗi xóa')
    } finally {
      setDeleting(null)
    }
  }

  const toggleStatus = async acc => {
    const newStatus = acc.status === 'AVAILABLE' ? 'HIDDEN' : 'AVAILABLE'

    try {
      await api.put(`/accounts/${acc.id}`, { status: newStatus })
      fetchAccounts()
    } catch (e) {
      toast.error('Lỗi')
    }
  }

  const getAccountCategory = acc => acc.categoryRelations?.[0]?.category


  const facebookStatusMap = {
    LIVE: {
      label: 'Liên kết sống',
      className: 'bg-neon-green/10 border-neon-green/30 text-neon-green',
      icon: faLink,
    },
    NONE: {
      label: 'Không liên kết',
      className: 'bg-white/10 border-white/10 text-white/45',
      icon: faBan,
    },
    RIP: {
      label: 'Liên kết RIP',
      className: 'bg-red-500/10 border-red-500/30 text-red-400',
      icon: faTriangleExclamation,
    },
  }

  const getFacebookStatus = status => facebookStatusMap[status] || facebookStatusMap.NONE

  const getAccountInfoBadges = acc => {
    const badges = []

    if (acc.gameBindEmail) {
      badges.push({
        key: 'email',
        label: 'Có email',
        icon: faEnvelope,
        className: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
      })
    } else if (acc.gameBindPhone) {
      badges.push({
        key: 'phone',
        label: 'Mỗi số điện thoại',
        icon: faPhone,
        className: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300',
      })
    } else {
      badges.push({
        key: 'empty',
        label: 'Chưa có email/SĐT',
        icon: faTriangleExclamation,
        className: 'bg-white/10 border-white/10 text-white/45',
      })
    }

    const fb = getFacebookStatus(acc.gameBindFacebook)
    badges.push({
      key: 'facebook',
      label: fb.label,
      icon: fb.icon,
      className: fb.className,
    })

    return badges
  }

  const renderStatusLabel = status => {
    if (status === 'AVAILABLE') {
      return (
        <>
          <FontAwesomeIcon icon={faCheck} />
          Có sẵn
        </>
      )
    }

    if (status === 'SOLD') {
      return (
        <>
          <FontAwesomeIcon icon={faXmark} />
          Đã bán
        </>
      )
    }

    return (
      <>
        <FontAwesomeIcon icon={faEyeSlash} />
        Ẩn
      </>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-gaming text-xl font-bold text-gradient">
            Quản Lý Tài Khoản
          </h1>
          <p className="text-white/40 text-sm">{total} tài khoản</p>
        </div>

        <button onClick={openCreate} className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2">
          <FontAwesomeIcon icon={faPlus} />
          Thêm Acc
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative max-w-xs">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">
            <FontAwesomeIcon icon={faSearch} />
          </span>
          <input
            value={search}
            onChange={e => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Tìm kiếm..."
            className="input-gaming text-sm py-2 pl-9"
          />
        </div>


        <select
          value={accInfoFilter}
          onChange={e => {
            setAccInfoFilter(e.target.value)
            setPage(1)
          }}
          className="input-gaming text-sm py-2 max-w-[220px]"
        >
          <option value="ALL">Tất cả thông tin acc</option>
          <option value="email">Có email</option>
          <option value="phone">Mỗi số điện thoại</option>
          <option value="fb_live">Liên kết FB sống</option>
          <option value="fb_rip">Liên kết FB RIP</option>
          <option value="fb_none">Không liên kết FB</option>
        </select>

        <div className="flex gap-2">
          {['ALL', 'AVAILABLE', 'SOLD', 'HIDDEN'].map(s => (
            <button
              key={s}
              onClick={() => {
                setStatusFilter(s)
                setPage(1)
              }}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                statusFilter === s
                  ? 'bg-neon-pink/20 border border-neon-pink/40 text-neon-pink'
                  : 'bg-dark-600 border border-white/10 text-white/50 hover:text-white'
              }`}
            >
              {s === 'ALL' ? 'Tất cả' : renderStatusLabel(s)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : accounts.length === 0 ? (
        <EmptyState
          icon={<FontAwesomeIcon icon={faGamepad} />}
          title="Không có tài khoản"
          action={
            <button onClick={openCreate} className="btn-primary text-sm px-6 py-2.5 flex items-center gap-2">
              <FontAwesomeIcon icon={faPlus} />
              Thêm Acc
            </button>
          }
        />
      ) : (
        <div className="gaming-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-xs text-white/40 uppercase tracking-wider">
                  <th className="text-left p-4">Tài khoản</th>
                  <th className="text-left p-4">Loại</th>
                  <th className="text-left p-4">Rank / Server</th>
                  <th className="text-left p-4">Thông tin acc</th>
                  <th className="text-right p-4">Giá</th>
                  <th className="text-center p-4">Trạng thái</th>
                  <th className="text-right p-4">Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {accounts.map(acc => {
                  const category = getAccountCategory(acc)
                  const infoBadges = getAccountInfoBadges(acc)

                  return (
                    <tr key={acc.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={acc.thumbnailUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=80&h=80&fit=crop'}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                            onError={e => {
                              e.target.style.display = 'none'
                            }}
                          />

                          <div>
                            <div className="font-medium text-white line-clamp-1">{acc.title}</div>
                            <div className="text-white/30 text-xs font-mono">#{acc.code}</div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        {category ? (
                          <span className="px-2 py-1 rounded-lg bg-neon-purple/10 border border-neon-purple/30 text-purple-300 text-xs">
                            {category.name}
                          </span>
                        ) : (
                          <span className="text-white/25 text-xs">Chưa chọn</span>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="font-bold text-xs" style={{ color: getRankColor(acc.rank) }}>
                          {acc.rank}
                        </div>
                        <div className="text-white/30 text-xs">{acc.server}</div>
                      </td>

                      <td className="p-4">
                        <div className="flex flex-wrap gap-1.5 max-w-[220px]">
                          {infoBadges.map(badge => (
                            <span
                              key={badge.key}
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-medium ${badge.className}`}
                            >
                              <FontAwesomeIcon icon={badge.icon} />
                              {badge.label}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="p-4 text-right">
                        <div className="font-gaming font-bold text-neon-pink text-sm">
                          {formatCurrency(acc.price)}
                        </div>
                        {Number(acc.originalPrice) > Number(acc.price) && (
                          <div className="text-white/30 line-through text-xs">
                            {formatCurrency(acc.originalPrice)}
                          </div>
                        )}
                      </td>

                      <td className="p-4 text-center">
                        <button
                          onClick={() => toggleStatus(acc)}
                          className={`px-2 py-1 rounded text-xs font-bold inline-flex items-center gap-1 ${
                            acc.status === 'AVAILABLE'
                              ? 'bg-neon-green/20 text-neon-green'
                              : acc.status === 'SOLD'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-white/10 text-white/40'
                          }`}
                        >
                          {renderStatusLabel(acc.status)}
                        </button>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEdit(acc)}
                            className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 text-xs transition-colors"
                          >
                            <FontAwesomeIcon icon={faPen} />
                          </button>

                          <button
                            onClick={() => handleDelete(acc.id)}
                            disabled={deleting === acc.id}
                            className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs transition-colors"
                          >
                            {deleting === acc.id ? <Spinner size="sm" /> : <FontAwesomeIcon icon={faTrash} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4">
            <Pagination page={page} pages={Math.ceil(total / 10)} onPageChange={setPage} />
          </div>
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <Modal
            isOpen
            title={editing ? 'Sửa Tài Khoản' : 'Thêm Tài Khoản'}
            onClose={() => !saving && setShowModal(false)}
            size="xl"
          >
            <form onSubmit={handleSave}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-xs text-white/40 font-display uppercase tracking-wider block mb-1">
                    Tiêu đề *
                  </label>
                  <input
                    type="text"
                    value={form.title || ''}
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="Tài khoản Kim Cương..."
                    required
                    className="input-gaming text-sm py-2"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/40 font-display uppercase tracking-wider block mb-1">
                    Loại tài khoản
                  </label>
                  <select
                    value={form.categoryId || ''}
                    onChange={e => setForm(p => ({ ...p, categoryId: e.target.value }))}
                    className="input-gaming text-sm py-2"
                  >
                    <option value="">-- Chọn loại acc --</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>


                {[
                  ['price', 'Giá (VNĐ) *', 'number', '500000'],
                  ['originalPrice', 'Giá gốc', 'number', ''],
                  ['server', 'Server', 'text', 'Server 1'],
                  ['rank', 'Rank', 'text', 'Kim Cương'],
                  ['champions', 'Số tướng', 'number', '100'],
                  ['skins', 'Số skin', 'number', '50'],
                  ['level', 'Cấp độ', 'number', '30'],
                  ['winRate', 'Tỉ lệ thắng (%)', 'number', '55'],
                  ['matches', 'Số trận', 'number', '1000'],
                  ['gems', 'Quân Huy', 'number', '0'],
                  ['gameUsername', 'Username game', 'text', ''],
                  ['gamePassword', 'Password game', 'text', ''],
                  ['gameBindEmail', 'Email liên kết', 'email', ''],
                  ['gameBindPhone', 'SĐT liên kết', 'text', ''],
                ].map(([name, label, type, placeholder]) => (
                  <div key={name}>
                    <label className="text-xs text-white/40 font-display uppercase tracking-wider block mb-1">
                      {label}
                    </label>
                    <input
                      type={type}
                      value={form[name] != null ? form[name] : ''}
                      onChange={e => setForm(p => ({ ...p, [name]: e.target.value }))}
                      placeholder={placeholder}
                      required={['price'].includes(name)}
                      className="input-gaming text-sm py-2"
                    />
                  </div>
                ))}


                <div>
                  <label className="text-xs text-white/40 font-display uppercase tracking-wider block mb-1">
                    Liên kết Facebook
                  </label>
                  <select
                    value={form.gameBindFacebook || 'NONE'}
                    onChange={e => setForm(p => ({ ...p, gameBindFacebook: e.target.value }))}
                    className="input-gaming text-sm py-2"
                  >
                    <option value="NONE">Không liên kết</option>
                    <option value="LIVE">Liên kết sống</option>
                    <option value="RIP">Liên kết RIP</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="text-xs text-white/40 font-display uppercase tracking-wider block mb-1">
                  Danh sách skin
                </label>
                <textarea
                  value={form.skinNames || ''}
                  onChange={e => setForm(p => ({ ...p, skinNames: e.target.value }))}
                  rows={4}
                  placeholder="Nhập tên skin, mỗi skin một dòng hoặc cách nhau bằng dấu phẩy..."
                  className="input-gaming text-sm py-2 resize-none"
                />
              </div>

              <div className="mb-4">
                <label className="text-xs text-white/40 font-display uppercase tracking-wider block mb-1">
                  Mô tả
                </label>
                <div className="quill-dark">
                  <ReactQuill
                    theme="snow"
                    value={form.description || ''}
                    onChange={val => setForm(p => ({ ...p, description: val }))}
                    placeholder="Mô tả chi tiết..."
                    modules={{
                      toolbar: [
                        [{ header: [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ color: [] }, { background: [] }],
                        [{ list: 'ordered' }, { list: 'bullet' }],
                        ['link', 'image'],
                        ['clean'],
                      ],
                    }}
                    style={{ minHeight: 160 }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4 mb-6">
                {[
                  ['isFeatured', faFire, 'Nổi bật'],
                  ['isNew', faStar, 'Mới'],
                  ['isVerified', faShieldHalved, 'Xác minh'],
                ].map(([key, icon, label]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form[key] || false}
                      onChange={e => setForm(p => ({ ...p, [key]: e.target.checked }))}
                      className="w-4 h-4 accent-pink-500"
                    />
                    <span className="text-white/70 text-sm flex items-center gap-1">
                      <FontAwesomeIcon icon={icon} />
                      {label}
                    </span>
                  </label>
                ))}
              </div>

              <div className="mb-6">
                <label className="text-xs text-white/40 font-display uppercase tracking-wider block mb-2 flex items-center gap-2">
                  <FontAwesomeIcon icon={faCamera} />
                  Ảnh tài khoản
                </label>

                <div
                  className="border-2 border-dashed border-white/20 rounded-xl p-4 text-center cursor-pointer hover:border-neon-pink/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imagePreviews.length > 0 ? (
                    <div className="flex flex-wrap gap-2 justify-center">
                      {imagePreviews.map((src, i) => (
                        <img
                          key={i}
                          src={src}
                          alt=""
                          className="w-20 h-20 rounded-lg object-cover border border-white/10"
                        />
                      ))}
                      <div className="w-20 h-20 rounded-lg border border-dashed border-white/20 flex items-center justify-center text-white/30 text-xs">
                        <FontAwesomeIcon icon={faPlus} />
                      </div>
                    </div>
                  ) : (
                    <div className="py-4">
                      <div className="text-3xl mb-2 text-white/30">
                        <FontAwesomeIcon icon={faImage} />
                      </div>
                      <p className="text-white/40 text-sm">Click để chọn ảnh tối đa 10 ảnh</p>
                      <p className="text-white/20 text-xs mt-1">JPG, PNG, WebP — tối đa 10MB/ảnh</p>
                    </div>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageChange}
                />

                {imageFiles.length > 0 && (
                  <p className="text-neon-green text-xs mt-2 flex items-center gap-1">
                    <FontAwesomeIcon icon={faCheck} />
                    Đã chọn {imageFiles.length} ảnh mới
                  </p>
                )}

                {editing && imagePreviews.length > 0 && imageFiles.length === 0 && (
                  <p className="text-white/30 text-xs mt-2 flex items-center gap-1">
                    <FontAwesomeIcon icon={faTriangleExclamation} />
                    Chọn ảnh mới để thay thế ảnh cũ
                  </p>
                )}
              </div>

              <div className="flex gap-3 justify-end">
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
                  ) : editing ? (
                    <>
                      <FontAwesomeIcon icon={faFloppyDisk} />
                      Cập nhật
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faPlus} />
                      Tạo mới
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