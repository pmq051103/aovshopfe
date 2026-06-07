import { useState, useEffect, useRef, useCallback } from 'react'
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
  faWandMagicSparkles,
  faLayerGroup,
  faSpinner,
  faCheckCircle,
  faChevronDown,
  faChevronUp,
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

  // Skin Picker state
  const [showSkinPicker, setShowSkinPicker]       = useState(false)
  const [skinTemplates, setSkinTemplates]         = useState([])
  const [skinPickerSearch, setSkinPickerSearch]   = useState('')
  const [skinPickerHero, setSkinPickerHero]       = useState('')
  const [skinPickerLoading, setSkinPickerLoading] = useState(false)
  const [selectedSkins, setSelectedSkins]         = useState([])
  const [skinPickerHeroes, setSkinPickerHeroes]   = useState([])
  // AI detect state
  const [detectLoading, setDetectLoading]   = useState(false)
  const [detectedSkins, setDetectedSkins]   = useState([])
  const [showDetectPanel, setShowDetectPanel] = useState(false)

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
    setDetectedSkins([])
    setShowDetectPanel(false)
    setSelectedSkins([])
    setShowSkinPicker(false)
    setSkinPickerSearch('')
    setSkinPickerHero('')
    setShowModal(true)
  }

  const openEdit = async acc => {
    try {
      const { data } = await api.get(`/accounts/${acc.id}`)
      const detail = data.data

      setEditing(detail)
      setSelectedSkins(detail.skins_rel?.map(s => ({
        skinName: s.skinName, heroName: s.heroName || '', rarity: s.tier || 'COMMON', templateId: s.templateId || null
      })) || [])
      setShowSkinPicker(false)
      setSkinPickerSearch('')
      setSkinPickerHero('')
      setDetectedSkins([])
      setShowDetectPanel(false)
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

      // Sync skinNames từ selectedSkins trước khi submit
      const currentSkinNames = selectedSkins.map(s => s.skinName).join('\n')

      Object.entries(form).forEach(([k, v]) => {
        if (k === 'skinNames') {
          // Dùng selectedSkins thay vì form.skinNames để đảm bảo sync
          fd.append('skinNames', currentSkinNames)
        } else if (NULLABLE_FIELDS.includes(k)) {
          fd.append(k, v ?? '')
        } else if (v !== null && v !== undefined && v !== '') {
          fd.append(k, v)
        }
      })

      // Gửi kèm skin data đầy đủ (có templateId, heroName) để backend lưu đúng
      // Luôn gửi skinsData kể cả rỗng để backend biết phải xóa hết skin cũ
      fd.append('skinsData', JSON.stringify(selectedSkins))

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

  // ── Skin Picker: load templates ────────────────────────
  const openSkinPicker = async () => {
    setShowSkinPicker(true)
    if (skinTemplates.length) return
    setSkinPickerLoading(true)
    try {
      const [tplRes, heroRes] = await Promise.all([
        api.get('/skin-templates?limit=500'),
        api.get('/skin-templates/heroes'),
      ])
      setSkinTemplates(tplRes.data.data || [])
      setSkinPickerHeroes(heroRes.data.data || [])
    } catch { toast.error('Không load được danh sách skin') }
    finally { setSkinPickerLoading(false) }
  }

  const toggleSelectedSkin = (tpl) => {
    setSelectedSkins(prev => {
      const exists = prev.find(s => s.templateId === tpl.id)
      if (exists) return prev.filter(s => s.templateId !== tpl.id)
      return [...prev, { skinName: tpl.skinName, heroName: tpl.heroName, rarity: tpl.rarity, templateId: tpl.id }]
    })
  }

  // Fix: dùng cả templateId và skinName để xác định đúng skin cần xóa
  const removeSkin = async (templateId, skinName) => {
    const newSkins = selectedSkins.filter(s =>
      templateId ? s.templateId !== templateId : s.skinName !== skinName
    )
    setSelectedSkins(newSkins)

    // Nếu đang edit → lưu luôn vào DB không cần bấm Cập nhật
    if (editing?.id) {
      try {
        await api.post(`/skin-templates/confirm/${editing.id}`, { skins: newSkins })
      } catch {
        toast.error('Lỗi xóa skin')
      }
    }
  }

  const handleSaveSkins = async () => {
    if (!editing?.id) {
      const names = selectedSkins.map(s => s.skinName).join('\n')
      setForm(p => ({ ...p, skinNames: names, skins: String(selectedSkins.length) }))
      setShowSkinPicker(false)
      toast.success(`Đã chọn ${selectedSkins.length} skin`)
      return
    }
    try {
      await api.post(`/skin-templates/confirm/${editing.id}`, { skins: selectedSkins })
      const names = selectedSkins.map(s => s.skinName).join('\n')
      setForm(p => ({ ...p, skinNames: names, skins: String(selectedSkins.length) }))
      toast.success(`Đã lưu ${selectedSkins.length} skin`)
      setShowSkinPicker(false)
    } catch { toast.error('Lỗi lưu skin') }
  }

  // ── AI Detect ────────────────────────────────────────────
  // Logic mới: AI detect chỉ hiển thị ở panel dưới.
  // KHÔNG tự động thêm vào selectedSkins (ô skin nổi bật).
  // Admin phải click "+" trên từng skin để thêm lên trên.
  const handleDetectSkins = async () => {
    const imageUrl = imagePreviews[0] || editing?.images?.[0]?.url || editing?.thumbnailUrl
    if (!imageUrl) return toast.error('Cần có ảnh account để AI phân tích')
    if (!editing?.id) return toast.error('Lưu account trước khi dùng AI detect')

    setDetectLoading(true)
    setShowDetectPanel(true)
    setDetectedSkins([])

    try {
      const { data } = await api.post(`/skin-templates/detect/${editing.id}`, { imageUrl })
      const skins = data.data || []
      setDetectedSkins(skins)
      // Debug: xem backend tra confidence dang gi
      console.log('[AI Detect]', skins.map(s => ({ name: s.skinName, conf: s.confidence, type: typeof s.confidence })))
      if (skins.length) {
        // Auto-add skin 100%: dung >= 0.99 de tranh float precision
        const autoAdd = skins.filter(s =>
  s.isMatched && Number(s.confidence) >= 0.95
)
        if (autoAdd.length) {
          setSelectedSkins(prev => {
            const existIds = new Set(prev.map(s => s.templateId).filter(Boolean))
            const existNames = new Set(prev.map(s => s.skinName))
            const toAdd = autoAdd
              .filter(s => s.templateId ? !existIds.has(s.templateId) : !existNames.has(s.skinName))
              .map(s => ({
                skinName: s.skinName,
                heroName: s.heroName || '',
                rarity: s.rarity || 'COMMON',
                templateId: s.templateId || null,
              }))
            return [...prev, ...toAdd]
          })
        }
        toast.success(`AI nhận diện được ${skins.length} skin${autoAdd.length ? ` — tự thêm ${autoAdd.length} skin 100%` : ''}`)
      } else {
        toast('Không nhận diện được skin nào. Dùng "Chọn tay" để bổ sung.', { icon: '🔍' })
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi AI detect')
      setShowDetectPanel(false)
    } finally {
      setDetectLoading(false)
    }
  }

  // Thêm một skin từ panel AI detect vào selectedSkins
  const addDetectedSkin = (s) => {
    setSelectedSkins(prev => {
      const alreadyIn = prev.some(sel =>
        s.templateId
          ? sel.templateId === s.templateId
          : sel.skinName === s.skinName
      )
      if (alreadyIn) return prev
      return [...prev, {
        skinName: s.skinName,
        heroName: s.heroName || '',
        rarity: s.rarity || 'COMMON',
        templateId: s.templateId || null,
      }]
    })
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

              {/* ── SKIN SECTION ─────────────────────────────── */}
              <div className="mb-4 space-y-2">

                {/* Header */}
                <div className="flex items-center justify-between">
                  <label className="text-xs text-white/40 font-display uppercase tracking-wider flex items-center gap-2">
                    <FontAwesomeIcon icon={faStar} />
                    Skin nổi bật
                    {selectedSkins.length > 0 && (
                      <span className="bg-purple-500/30 text-purple-300 text-[10px] rounded-full px-1.5 py-0.5">
                        {selectedSkins.length}
                      </span>
                    )}
                  </label>
                  <div className="flex items-center gap-2">
                    {/* Nút Gen AI */}
                    <button
                      type="button"
                      onClick={handleDetectSkins}
                      disabled={detectLoading}
                      title={!editing ? 'Lưu account trước' : ''}
                      className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-300 hover:bg-purple-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      {detectLoading
                        ? <><FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Đang phân tích...</>
                        : <><FontAwesomeIcon icon={faWandMagicSparkles} /> Gen AI</>
                      }
                    </button>
                    {/* Nút chọn tay */}
                    <button
                      type="button"
                      onClick={openSkinPicker}
                      className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white/60 hover:bg-white/15 hover:text-white transition-all"
                    >
                      <FontAwesomeIcon icon={faLayerGroup} /> Chọn tay
                    </button>
                  </div>
                </div>

                {/* Selected skins chips — ô skin nổi bật */}
                {selectedSkins.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-white/3 border border-white/10 min-h-[40px]">
                    {selectedSkins.map((s, i) => (
                      <motion.span
                        key={s.templateId || s.skinName}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="inline-flex items-center gap-1 text-xs bg-purple-500/20 border border-purple-500/30 text-purple-200 rounded-full pl-2.5 pr-1 py-0.5"
                      >
                        {s.skinName}
                        <button
                          type="button"
                          onClick={() => removeSkin(s.templateId, s.skinName)}
                          className="w-4 h-4 rounded-full hover:bg-purple-500/50 flex items-center justify-center ml-0.5 text-purple-300 hover:text-white transition-colors"
                        >
                          <FontAwesomeIcon icon={faXmark} className="text-[9px]" />
                        </button>
                      </motion.span>
                    ))}
                  </div>
                )}

                {selectedSkins.length === 0 && (
                  <div className="text-center py-3 rounded-lg border border-dashed border-white/10 text-white/20 text-xs">
                    Chưa chọn skin — dùng Gen AI hoặc Chọn tay
                  </div>
                )}

                {/* AI Detect result panel — chỉ hiển thị kết quả, admin click + để thêm */}
                <AnimatePresence>
                  {showDetectPanel && detectedSkins.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="rounded-xl border border-purple-500/20 bg-purple-500/5 overflow-hidden"
                    >
                      <div className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-purple-300 flex items-center gap-1.5">
                            <FontAwesomeIcon icon={faWandMagicSparkles} className="text-[10px]" />
                            Skin được gen từ AI — click <FontAwesomeIcon icon={faPlus} className="text-[9px]" /> để thêm vào skin nổi bật
                          </span>
                          <button type="button" onClick={() => setShowDetectPanel(false)} className="text-white/30 hover:text-white/60">
                            <FontAwesomeIcon icon={faXmark} className="text-xs" />
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {detectedSkins.map((s, i) => {
                            const conf = Math.round((s.confidence || 0) * 100)
                            const isAdded = selectedSkins.some(sel =>
                              s.templateId
                                ? sel.templateId === s.templateId
                                : sel.skinName === s.skinName
                            )
                            return (
                              <span
                                key={i}
                                className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                                  isAdded
                                    ? 'bg-green-500/10 border-green-500/30 text-green-300'
                                    : 'bg-purple-500/10 border-purple-500/25 text-purple-200 hover:border-purple-500/50'
                                }`}
                              >
                                {s.skinName}
                                <span className="opacity-50">{conf}%</span>
                                {!s.isMatched && <span className="text-yellow-400/70 ml-0.5">~</span>}
                                {isAdded ? (
                                  <FontAwesomeIcon icon={faCheck} className="text-[9px] ml-0.5 text-green-400" />
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => addDetectedSkin(s)}
                                    className="w-3.5 h-3.5 rounded-full bg-purple-500/40 hover:bg-purple-500 flex items-center justify-center ml-0.5 transition-colors flex-shrink-0"
                                  >
                                    <FontAwesomeIcon icon={faPlus} className="text-[8px] text-white" />
                                  </button>
                                )}
                              </span>
                            )
                          })}
                        </div>
                        <p className="text-white/20 text-[10px] mt-2">
                          ✓ đã thêm vào skin nổi bật &nbsp;·&nbsp; ~ không match DB (vẫn có thể thêm)
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── SKIN PICKER MODAL ─────────────────────────── */}
              <AnimatePresence>
                {showSkinPicker && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center p-4"
                    onClick={e => e.target === e.currentTarget && setShowSkinPicker(false)}
                  >
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      className="relative w-full max-w-2xl max-h-[80vh] flex flex-col glass rounded-2xl border border-white/10 overflow-hidden"
                    >
                      {/* Picker header */}
                      <div className="flex items-center justify-between p-4 border-b border-white/10">
                        <div>
                          <h3 className="text-white font-display font-bold">Chọn skin nổi bật</h3>
                          <p className="text-white/40 text-xs mt-0.5">Đã chọn {selectedSkins.length} skin</p>
                        </div>
                        <button type="button" onClick={() => setShowSkinPicker(false)} className="text-white/40 hover:text-white">
                          <FontAwesomeIcon icon={faXmark} />
                        </button>
                      </div>

                      {/* Filters */}
                      <div className="p-3 border-b border-white/10 flex gap-2">
                        <div className="relative flex-1">
                          <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-xs" />
                          <input
                            type="text"
                            placeholder="Tìm tên skin, tướng..."
                            value={skinPickerSearch}
                            onChange={e => setSkinPickerSearch(e.target.value)}
                            className="input-gaming text-sm py-1.5 pl-8 w-full"
                          />
                        </div>
                        <select
                          value={skinPickerHero}
                          onChange={e => setSkinPickerHero(e.target.value)}
                          className="input-gaming text-sm py-1.5 max-w-[140px]"
                        >
                          <option value="">Tất cả tướng</option>
                          {skinPickerHeroes.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>

                      {/* List */}
                      <div className="flex-1 overflow-y-auto p-3">
                        {skinPickerLoading ? (
                          <div className="flex justify-center py-10 text-white/40">
                            <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xl" />
                          </div>
                        ) : (() => {
                          const q = skinPickerSearch.toLowerCase()
                          const filtered = skinTemplates.filter(t =>
                            (!skinPickerHero || t.heroName === skinPickerHero) &&
                            (!q || t.skinName.toLowerCase().includes(q) || t.heroName.toLowerCase().includes(q) || (t.aliases || '').toLowerCase().includes(q))
                          )
                          if (!filtered.length) return (
                            <p className="text-center text-white/30 text-sm py-10">Không tìm thấy skin nào</p>
                          )
                          const grouped = filtered.reduce((acc, t) => {
                            if (!acc[t.heroName]) acc[t.heroName] = []
                            acc[t.heroName].push(t)
                            return acc
                          }, {})
                          return Object.entries(grouped).map(([hero, skins]) => (
                            <div key={hero} className="mb-4">
                              <p className="text-white/40 text-xs font-display uppercase tracking-wider mb-1.5 px-1">{hero}</p>
                              <div className="grid grid-cols-1 gap-1">
                                {skins.map(tpl => {
                                  const isSelected = selectedSkins.some(s => s.templateId === tpl.id)
                                  const rarityColors = {
                                    MYTHIC: 'text-red-400', LEGENDARY: 'text-yellow-400',
                                    EPIC: 'text-purple-400', RARE: 'text-blue-400', COMMON: 'text-gray-400'
                                  }
                                  return (
                                    <button
                                      key={tpl.id}
                                      type="button"
                                      onClick={() => toggleSelectedSkin(tpl)}
                                      className={`flex items-center gap-3 p-2 rounded-lg text-left transition-all border ${
                                        isSelected
                                          ? 'bg-purple-500/20 border-purple-500/40'
                                          : 'bg-white/3 border-transparent hover:bg-white/8 hover:border-white/10'
                                      }`}
                                    >
                                      {tpl.imageUrl ? (
                                        <img src={tpl.imageUrl} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                                      ) : (
                                        <div className="w-8 h-8 rounded bg-white/5 flex-shrink-0" />
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <p className="text-white text-xs font-medium truncate">{tpl.skinName}</p>
                                        <p className={`text-[10px] ${rarityColors[tpl.rarity] || 'text-gray-400'}`}>{tpl.rarity}</p>
                                      </div>
                                      <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${
                                        isSelected ? 'bg-purple-500 border-purple-500' : 'border-white/20'
                                      }`}>
                                        {isSelected && <FontAwesomeIcon icon={faCheckCircle} className="text-white text-[9px]" />}
                                      </div>
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          ))
                        })()}
                      </div>

                      {/* Footer */}
                      <div className="p-3 border-t border-white/10 flex items-center gap-3">
                        <span className="text-xs text-white/40 flex-1">Đã chọn {selectedSkins.length} skin</span>
                        <button type="button" onClick={() => setSelectedSkins([])} className="text-xs text-white/40 hover:text-white/70 px-2 py-1 rounded">
                          Bỏ tất cả
                        </button>
                        <button type="button" onClick={handleSaveSkins}
                          className="btn-primary text-sm flex items-center gap-2">
                          <FontAwesomeIcon icon={faFloppyDisk} /> Lưu {selectedSkins.length} skin
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

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