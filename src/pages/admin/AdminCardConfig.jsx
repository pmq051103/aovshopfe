import { useState, useEffect, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Modal, Spinner, Pagination } from '../../components/common/UIComponents'
import {
  faCreditCard,
  faPlus,
  faPen,
  faTrash,
  faImage,
  faFloppyDisk,
  faToggleOn,
  faToggleOff,
  faSearch,
  faRotate,
  faCircleCheck,
  faCircleXmark,
  faXmark,
  faGamepad,
  faMobileScreen,
  faTag,
  faMoneyBillWave,
  faBoxOpen,
  faCartShopping,
  faMobileRetro,
  faCoins,
  faClock,
  faUser,
  faReceipt,
  faLayerGroup,
  faFilter,
  faCheck,
  faBan,
  faPaperPlane,
  faEye,
  faCopy,
  faTriangleExclamation,
  faWrench,
} from '@fortawesome/free-solid-svg-icons'
import api from '../../api/axios'
import { formatCurrency, formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'

const CONFIG_LIMIT = 5
const HISTORY_LIMIT = 10

const TELCO_PRESETS = {
  phone: [
    { id: 'VIETTEL', label: 'Viettel' },
    { id: 'VINAPHONE', label: 'Vinaphone' },
    { id: 'MOBIFONE', label: 'Mobifone' },
    { id: 'VIETNAMOBILE', label: 'Vietnamobile' },
    { id: 'GMOBILE', label: 'Gmobile' },
    { id: 'REDDI', label: 'Reddi' },
  ],
  game: [
    { id: 'ZING', label: 'Zing Card' },
    { id: 'GATE', label: 'Gate' },
    { id: 'GARENA', label: 'Garena' },
    { id: 'VCOIN', label: 'VCoin' },
    { id: 'APPOTAPAY', label: 'Appotapay' },
    { id: 'ONCASH', label: 'OnCash' },
    { id: 'SCOIN', label: 'Scoin' },
    { id: 'SKULL', label: 'Skull' },
    { id: 'GAME', label: 'Game' },
  ],
}

const ALL_TELCO_OPTIONS = [...TELCO_PRESETS.phone, ...TELCO_PRESETS.game]

const DENOM_PRESETS = [
  10000,
  20000,
  30000,
  50000,
  100000,
  200000,
  300000,
  500000,
  1000000,
  2000000,
]

function StatusBadge({ v, label = 'Bật' }) {
  return v ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-neon-green/10 text-neon-green border border-neon-green/25">
      <FontAwesomeIcon icon={faCircleCheck} />
      {label}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/25">
      <FontAwesomeIcon icon={faCircleXmark} />
      Tắt
    </span>
  )
}

function ModeButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
        active
          ? 'bg-neon-pink/20 text-neon-pink border border-neon-pink/40'
          : 'bg-dark-600 border border-white/10 text-white/35 hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

function ConfigForm({ initial, onSave, onClose, saving }) {
  const [form, setForm] = useState({
    telco: initial?.telco || '',
    telcoLabel: initial?.telcoLabel || '',
    denomination: initial?.denomination || '',
    depositEnabled: initial?.depositEnabled ?? true,
    depositDiscount: initial?.depositDiscount ?? 27,
    buyEnabled: initial?.buyEnabled ?? true,
    buyDiscount: initial?.buyDiscount ?? 10,
    sortOrder: initial?.sortOrder ?? 0,
  })

  const [telcoMode, setTelcoMode] = useState('preset')
  const [denomMode, setDenomMode] = useState('preset')
  const [customDenom, setCustomDenom] = useState('')
  const [preview, setPreview] = useState(initial?.thumbnailUrl || null)
  const [file, setFile] = useState(null)

  const fileRef = useRef(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const selectPresetTelco = t => {
    set('telco', t.id)
    set('telcoLabel', t.label)
  }

  const onFile = e => {
    const f = e.target.files?.[0]
    if (!f) return

    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const handleRemoveImg = async () => {
    if (initial?.id && initial?.thumbnailUrl) {
      try {
        await api.delete(`/card/admin/configs/${initial.id}/thumbnail`)
      } catch {}
    }

    setPreview(null)
    setFile(null)

    if (fileRef.current) {
      fileRef.current.value = ''
    }
  }

  const handleSubmit = () => {
    const telcoKey = form.telco.toUpperCase().trim().replace(/\s+/g, '_')

    if (!telcoKey) {
      toast.error('Chọn hoặc nhập loại thẻ')
      return
    }

    const denom =
      denomMode === 'custom'
        ? parseFloat(customDenom)
        : parseFloat(form.denomination)

    if (!denom || denom <= 0) {
      toast.error('Chọn hoặc nhập mệnh giá hợp lệ')
      return
    }

    const fd = new FormData()
    fd.append('telco', telcoKey)
    fd.append('telcoLabel', form.telcoLabel || telcoKey)
    fd.append('denomination', denom)
    fd.append('depositEnabled', form.depositEnabled)
    fd.append('depositDiscount', form.depositDiscount)
    fd.append('buyEnabled', form.buyEnabled)
    fd.append('buyDiscount', form.buyDiscount)
    fd.append('sortOrder', form.sortOrder)

    if (file) {
      fd.append('thumbnail', file)
    }

    onSave(fd)
  }

  const denom =
    denomMode === 'custom'
      ? parseFloat(customDenom) || 0
      : parseFloat(form.denomination) || 0

  const depositReceive =
    denom > 0 ? Math.round(denom * (1 - form.depositDiscount / 100)) : 0

  const buyPrice =
    denom > 0 ? Math.round(denom * (1 - form.buyDiscount / 100)) : 0

  const activeTelco = form.telco?.toUpperCase()

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-white/40 font-display uppercase tracking-wider">
            Loại thẻ / Nhà mạng *
          </label>

          <div className="flex gap-1">
            <ModeButton active={telcoMode === 'preset'} onClick={() => setTelcoMode('preset')}>
              Chọn nhanh
            </ModeButton>
            <ModeButton active={telcoMode === 'custom'} onClick={() => setTelcoMode('custom')}>
              Tự nhập
            </ModeButton>
          </div>
        </div>

        {telcoMode === 'preset' ? (
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FontAwesomeIcon icon={faMobileScreen} className="text-blue-400 text-xs" />
                <span className="text-white/35 text-[10px] uppercase tracking-wider font-bold">
                  Thẻ điện thoại
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TELCO_PRESETS.phone.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => selectPresetTelco(t)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      activeTelco === t.id
                        ? 'bg-neon-pink/20 border-neon-pink/40 text-neon-pink'
                        : 'bg-dark-600 border-white/10 text-white/50 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <FontAwesomeIcon icon={faMobileRetro} />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <FontAwesomeIcon icon={faGamepad} className="text-neon-green text-xs" />
                <span className="text-white/35 text-[10px] uppercase tracking-wider font-bold">
                  Thẻ game
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TELCO_PRESETS.game.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => selectPresetTelco(t)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      activeTelco === t.id
                        ? 'bg-neon-purple/20 border-neon-purple/40 text-purple-300'
                        : 'bg-dark-600 border-white/10 text-white/50 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <FontAwesomeIcon icon={faGamepad} />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-white/35 text-[10px] mb-1 block">
                Mã telco *
              </label>
              <input
                type="text"
                placeholder="VD: VCOIN, GATE, GARENA..."
                value={form.telco}
                onChange={e => set('telco', e.target.value.toUpperCase().replace(/\s+/g, '_'))}
                className="input-gaming text-sm py-2 font-mono uppercase"
              />
              <p className="text-white/25 text-[10px] mt-1">
                Phải khớp với mã telco của API.
              </p>
            </div>

            <div>
              <label className="text-white/35 text-[10px] mb-1 block">
                Tên hiển thị
              </label>
              <input
                type="text"
                placeholder="VD: Zing Card, Gate, Garena..."
                value={form.telcoLabel}
                onChange={e => set('telcoLabel', e.target.value)}
                className="input-gaming text-sm py-2"
              />
            </div>
          </div>
        )}

        {form.telco && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-neon-purple/10 border border-neon-purple/25">
            <FontAwesomeIcon icon={faTag} className="text-purple-300 text-xs" />
            <span className="text-purple-300 text-xs font-bold">{form.telco}</span>
            {form.telcoLabel && form.telcoLabel !== form.telco && (
              <span className="text-white/40 text-xs">({form.telcoLabel})</span>
            )}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-white/40 font-display uppercase tracking-wider">
            Mệnh giá *
          </label>

          <div className="flex gap-1">
            <ModeButton active={denomMode === 'preset'} onClick={() => setDenomMode('preset')}>
              Chọn nhanh
            </ModeButton>
            <ModeButton active={denomMode === 'custom'} onClick={() => setDenomMode('custom')}>
              Tự nhập
            </ModeButton>
          </div>
        </div>

        {denomMode === 'preset' ? (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {DENOM_PRESETS.map(d => (
              <button
                key={d}
                type="button"
                onClick={() => set('denomination', d)}
                className={`py-2 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  parseFloat(form.denomination) === d
                    ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300'
                    : 'bg-dark-600 border-white/10 text-white/50 hover:text-white hover:border-white/20'
                }`}
              >
                <FontAwesomeIcon icon={faCoins} />
                {d >= 1000000 ? `${d / 1000000}tr` : `${d / 1000}k`}
              </button>
            ))}
          </div>
        ) : (
          <div>
            <input
              type="number"
              min="1000"
              step="1000"
              placeholder="VD: 10000"
              value={customDenom}
              onChange={e => setCustomDenom(e.target.value)}
              className="input-gaming text-sm py-2"
            />
            <p className="text-white/25 text-[10px] mt-1">
              Nhập số nguyên, đơn vị VNĐ.
            </p>
          </div>
        )}

        {denom > 0 && (
          <div className="mt-2 text-right text-white/40 text-[10px]">
            Mệnh giá đã chọn:{' '}
            <span className="text-yellow-400 font-bold">{formatCurrency(denom)}</span>
          </div>
        )}
      </div>

      <div>
        <label className="text-xs text-white/40 font-display uppercase tracking-wider block mb-2">
          Ảnh thumbnail thẻ
        </label>

        <div className="flex items-center gap-3">
          {preview ? (
            <div className="relative">
              <img
                src={preview}
                alt="thumb"
                className="w-24 h-16 object-cover rounded-xl border border-white/15 bg-dark-600"
              />

              <button
                type="button"
                onClick={handleRemoveImg}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white text-xs hover:bg-red-600 transition-colors"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
          ) : (
            <div className="w-24 h-16 rounded-xl border border-dashed border-white/15 flex items-center justify-center text-white/25 text-xl bg-dark-600">
              <FontAwesomeIcon icon={faImage} />
            </div>
          )}

          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFile}
            />

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="px-3 py-2 rounded-lg border border-white/10 bg-dark-600 text-white/50 hover:text-white hover:border-white/20 text-xs transition-all flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faImage} />
              {preview ? 'Đổi ảnh' : 'Tải ảnh lên'}
            </button>

            <p className="text-white/25 text-[10px] mt-1">
              PNG, JPG, WebP — tối đa 5MB.
            </p>
          </div>
        </div>

        {!preview && form.telco && (
          <p className="text-white/25 text-[10px] mt-2">
            Nếu nhóm <b>{form.telco}</b> đã có ảnh, ảnh đó sẽ tự động được dùng chung.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-blue-500/8 border border-blue-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-blue-300 text-xs font-bold uppercase tracking-wide flex items-center gap-2">
              <FontAwesomeIcon icon={faMoneyBillWave} />
              Nạp thẻ
            </span>

            <button
              type="button"
              onClick={() => set('depositEnabled', !form.depositEnabled)}
              className={`transition-colors text-xl ${
                form.depositEnabled ? 'text-neon-green' : 'text-white/20'
              }`}
            >
              <FontAwesomeIcon icon={form.depositEnabled ? faToggleOn : faToggleOff} />
            </button>
          </div>

          <div>
            <label className="text-white/50 text-[11px] mb-1.5 block">
              Chiết khấu:{' '}
              <span className="text-yellow-400 font-bold">{form.depositDiscount}%</span>
            </label>

            <input
              type="range"
              min="0"
              max="50"
              step="0.5"
              value={form.depositDiscount}
              onChange={e => set('depositDiscount', parseFloat(e.target.value))}
              className="w-full accent-blue-500"
              disabled={!form.depositEnabled}
            />

            {denom > 0 && (
              <p className="text-white/35 text-[10px] mt-1">
                Thẻ {formatCurrency(denom)} → nhận{' '}
                <span className="text-neon-green font-bold">
                  {formatCurrency(depositReceive)}
                </span>
              </p>
            )}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-neon-green/8 border border-neon-green/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-neon-green text-xs font-bold uppercase tracking-wide flex items-center gap-2">
              <FontAwesomeIcon icon={faCartShopping} />
              Mua thẻ
            </span>

            <button
              type="button"
              onClick={() => set('buyEnabled', !form.buyEnabled)}
              className={`transition-colors text-xl ${
                form.buyEnabled ? 'text-neon-green' : 'text-white/20'
              }`}
            >
              <FontAwesomeIcon icon={form.buyEnabled ? faToggleOn : faToggleOff} />
            </button>
          </div>

          <div>
            <label className="text-white/50 text-[11px] mb-1.5 block">
              Chiết khấu:{' '}
              <span className="text-yellow-400 font-bold">{form.buyDiscount}%</span>
            </label>

            <input
              type="range"
              min="0"
              max="30"
              step="0.5"
              value={form.buyDiscount}
              onChange={e => set('buyDiscount', parseFloat(e.target.value))}
              className="w-full accent-green-500"
              disabled={!form.buyEnabled}
            />

            {denom > 0 && (
              <p className="text-white/35 text-[10px] mt-1">
                Thẻ {formatCurrency(denom)} → trả{' '}
                <span className="text-yellow-400 font-bold">
                  {formatCurrency(buyPrice)}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>

      <div>
        <label className="text-xs text-white/40 font-display uppercase tracking-wider block mb-1">
          Thứ tự hiển thị
        </label>

        <input
          type="number"
          min="0"
          value={form.sortOrder}
          onChange={e => set('sortOrder', parseInt(e.target.value) || 0)}
          className="input-gaming text-sm py-2 max-w-[160px]"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-3 rounded-xl border border-white/10 text-white/50 hover:text-white hover:border-white/20 text-sm transition-all"
        >
          Hủy
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="flex-1 btn-primary py-3 text-sm flex items-center justify-center gap-2"
        >
          {saving ? <Spinner size="sm" color="white" /> : <FontAwesomeIcon icon={faFloppyDisk} />}
          {initial ? 'Cập nhật' : 'Thêm cấu hình'}
        </button>
      </div>
    </div>
  )
}

export default function AdminCardConfig() {
  const [tab, setTab] = useState('configs')

  const [configs, setConfigs] = useState([])
  const [deposits, setDeposits] = useState([])
  const [purchases, setPurchases] = useState([])

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  // Modal cập nhật trạng thái nạp thẻ
  const [depUpdateTarget, setDepUpdateTarget] = useState(null)
  const [depUpdateForm, setDepUpdateForm] = useState({ status: 'SUCCESS', realAmount: '', note: '' })
  const [depUpdating, setDepUpdating] = useState(false)

  // Modal xem chi tiết
  const [viewTarget, setViewTarget] = useState(null)

  // Modal gửi thẻ thủ công cho mua thẻ
  const [purResendTarget, setPurResendTarget] = useState(null)
  const [purResendCards, setPurResendCards] = useState([{ serial: '', code: '', expireDate: '' }])
  const [purResendNote, setPurResendNote] = useState('')
  const [purResending, setPurResending] = useState(false)

  const [configPage, setConfigPage] = useState(1)

  const [depStatus, setDepStatus] = useState('ALL')
  const [depTelco, setDepTelco] = useState('ALL')
  const [depSearch, setDepSearch] = useState('')
  const [depPage, setDepPage] = useState(1)
  const [depTotal, setDepTotal] = useState(0)

  const [purStatus, setPurStatus] = useState('ALL')
  const [purTelco, setPurTelco] = useState('ALL')
  const [purPage, setPurPage] = useState(1)
  const [purTotal, setPurTotal] = useState(0)

  useEffect(() => {
    fetchConfigs()
  }, [])

  useEffect(() => {
    if (tab === 'deposits') fetchDeposits()
  }, [tab, depStatus, depTelco, depSearch, depPage])

  useEffect(() => {
    if (tab === 'purchases') fetchPurchases()
  }, [tab, purStatus, purTelco, purPage])

  const fetchConfigs = async () => {
    setLoading(true)

    try {
      const { data } = await api.get('/card/admin/configs')
      setConfigs(data.data || [])
    } catch {
      toast.error('Lỗi tải cấu hình')
    } finally {
      setLoading(false)
    }
  }

  const fetchDeposits = async () => {
    setLoading(true)

    try {
      const q = new URLSearchParams({
        page: depPage,
        limit: HISTORY_LIMIT,
        status: depStatus,
        telco: depTelco,
        ...(depSearch && { search: depSearch }),
      })

      const { data } = await api.get(`/card/admin/deposits?${q}`)
      setDeposits(data.data || [])
      setDepTotal(data.pagination?.total || 0)
    } catch {
      setDeposits([])
    } finally {
      setLoading(false)
    }
  }

  const fetchPurchases = async () => {
    setLoading(true)

    try {
      const q = new URLSearchParams({
        page: purPage,
        limit: HISTORY_LIMIT,
        status: purStatus,
        telco: purTelco,
      })

      const { data } = await api.get(`/card/admin/purchases?${q}`)
      setPurchases(data.data || [])
      setPurTotal(data.pagination?.total || 0)
    } catch {
      setPurchases([])
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditItem(null)
    setShowForm(true)
  }

  // Mở modal cập nhật trạng thái nạp thẻ
  const openDepUpdate = (dep) => {
    setDepUpdateTarget(dep)
    setDepUpdateForm({ status: 'SUCCESS', realAmount: dep.declaredAmount || '', note: '' })
  }

  const handleDepUpdate = async () => {
    if (!depUpdateTarget) return
    setDepUpdating(true)
    try {
      await api.put(`/card/admin/deposits/${depUpdateTarget.id}/status`, depUpdateForm)
      toast.success('Đã cập nhật trạng thái!')
      setDepUpdateTarget(null)
      fetchDeposits()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi cập nhật')
    } finally {
      setDepUpdating(false)
    }
  }

  // Mở modal gửi thẻ thủ công
  const openPurResend = (pur) => {
    setPurResendTarget(pur)
    // Tạo sẵn số ô thẻ theo quantity
    setPurResendCards(Array.from({ length: pur.quantity || 1 }, () => ({ serial: '', code: '', expireDate: '' })))
    setPurResendNote('')
  }

  const updateResendCard = (idx, field, value) => {
    setPurResendCards(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c))
  }

  const handlePurResend = async () => {
    if (!purResendTarget) return
    const valid = purResendCards.every(c => c.serial.trim() && c.code.trim())
    if (!valid) { toast.error('Điền đầy đủ serial và mã thẻ'); return }
    setPurResending(true)
    try {
      await api.post(`/card/admin/purchases/${purResendTarget.id}/resend`, { cards: purResendCards, note: purResendNote })
      toast.success('Đã gửi thẻ thủ công!')
      setPurResendTarget(null)
      fetchPurchases()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi gửi thẻ')
    } finally {
      setPurResending(false)
    }
  }

  const openEdit = cfg => {
    setEditItem(cfg)
    setShowForm(true)
  }

  const handleSave = async formData => {
    setSaving(true)

    try {
      if (editItem) {
        await api.put(`/card/admin/configs/${editItem.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        toast.success('Đã cập nhật!')
      } else {
        await api.post('/card/admin/configs', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        toast.success('Đã thêm cấu hình!')
      }

      setShowForm(false)
      setEditItem(null)
      fetchConfigs()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi lưu')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    try {
      await api.delete(`/card/admin/configs/${deleteTarget.id}`)
      toast.success('Đã xóa!')
      setDeleteTarget(null)
      fetchConfigs()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi xóa')
    }
  }

  const groupedConfigs = configs.reduce((acc, c) => {
    if (!acc[c.telco]) acc[c.telco] = []
    acc[c.telco].push(c)
    return acc
  }, {})

  const groupedEntries = Object.entries(groupedConfigs)
  const totalConfigPages = Math.ceil(groupedEntries.length / CONFIG_LIMIT) || 1
  const paginatedConfigEntries = groupedEntries.slice(
    (configPage - 1) * CONFIG_LIMIT,
    configPage * CONFIG_LIMIT
  )

  const uniqueTelcos = [...new Set(configs.map(c => c.telco))]

  const telcoInfo = (id, telcoLabel) => {
    const preset = ALL_TELCO_OPTIONS.find(t => t.id === id)
    return preset || { label: telcoLabel || id }
  }

  const isPhoneTelco = id => TELCO_PRESETS.phone.some(t => t.id === id)

  // ── View Detail Modal ──────────────────────────────────────
  const ViewModal = () => {
    if (!viewTarget) return null
    const { type, data } = viewTarget
    const isPurchase = type === 'purchase'
    const cards = typeof data.cards === 'string' ? JSON.parse(data.cards || '[]') : (data.cards || [])

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setViewTarget(null)}>
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        <div className="relative z-10 w-full max-w-lg gaming-card p-6 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-gaming text-lg font-black text-white">
              <FontAwesomeIcon icon={isPurchase ? faBoxOpen : faMoneyBillWave} className="mr-2 text-neon-pink" />
              {isPurchase ? 'Chi Tiết Mua Thẻ' : 'Chi Tiết Nạp Thẻ'}
            </h3>
            <button onClick={() => setViewTarget(null)} className="text-white/40 hover:text-white text-lg"><FontAwesomeIcon icon={faXmark} /></button>
          </div>

          <div className="space-y-2 mb-5">
            {[
              { label: 'Người dùng', value: data.user?.displayName || data.user?.username || '—' },
              { label: 'Email', value: data.user?.email || '—' },
              { label: 'Loại thẻ', value: isPurchase ? (data.cardConfig?.telcoLabel || data.telco) : data.telco },
              { label: 'Mệnh giá', value: formatCurrency(isPurchase ? data.denomination : data.declaredAmount) },
              isPurchase ? { label: 'Số lượng', value: data.quantity } : null,
              isPurchase
                ? { label: 'Tổng tiền', value: formatCurrency(data.totalPrice) }
                : { label: 'Thực nhận', value: formatCurrency(data.receivedAmount) },
              { label: 'Trạng thái', value: data.status },
              { label: 'Thời gian', value: formatDate(data.createdAt) },
              data.note ? { label: 'Ghi chú', value: data.note } : null,
              data.message ? { label: 'Message', value: data.message } : null,
            ].filter(Boolean).map(row => (
              <div key={row.label} className="flex gap-3 text-sm">
                <span className="text-white/40 w-28 shrink-0">{row.label}</span>
                <span className="text-white font-medium break-all">{row.value}</span>
              </div>
            ))}
          </div>

          {/* Nạp thẻ: code + serial trực tiếp trên record */}
          {!isPurchase && (data.code || data.serial) && (
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider font-bold mb-3">Thông Tin Thẻ</p>
              <div className="bg-dark-700/60 border border-white/10 rounded-xl p-3 space-y-2">
                {data.code && (
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2 text-xs flex-1">
                      <span className="text-white/40 w-16 shrink-0">Mã thẻ:</span>
                      <span className="text-yellow-400 font-mono font-bold break-all">{data.code}</span>
                    </div>
                    <button onClick={() => navigator.clipboard.writeText(data.code)} className="text-neon-blue text-xs hover:text-white flex items-center gap-1 ml-2">
                      <FontAwesomeIcon icon={faCopy} /> Copy
                    </button>
                  </div>
                )}
                {data.serial && (
                  <div className="flex gap-2 text-xs">
                    <span className="text-white/40 w-16 shrink-0">Serial:</span>
                    <span className="text-white/70 font-mono break-all">{data.serial}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mua thẻ: mảng cards */}
          {isPurchase && cards.length > 0 && (
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider font-bold mb-3">Mã Thẻ ({cards.length})</p>
              <div className="space-y-2">
                {cards.map((c, i) => (
                  <div key={i} className="bg-dark-700/60 border border-white/10 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white/40 text-xs">Thẻ {i + 1}</span>
                      <button onClick={() => navigator.clipboard.writeText(c.pin || c.code || '')} className="text-neon-blue text-xs hover:text-white flex items-center gap-1">
                        <FontAwesomeIcon icon={faCopy} /> Copy
                      </button>
                    </div>
                    <div className="space-y-1">
                      {(c.pin || c.code) && (
                        <div className="flex gap-2 text-xs">
                          <span className="text-white/40 w-16 shrink-0">Mã thẻ:</span>
                          <span className="text-yellow-400 font-mono font-bold break-all">{c.pin || c.code}</span>
                        </div>
                      )}
                      {c.serial && (
                        <div className="flex gap-2 text-xs">
                          <span className="text-white/40 w-16 shrink-0">Serial:</span>
                          <span className="text-white/70 font-mono break-all">{c.serial}</span>
                        </div>
                      )}
                      {c.expireDate && (
                        <div className="flex gap-2 text-xs">
                          <span className="text-white/40 w-16 shrink-0">HSD:</span>
                          <span className="text-white/50 font-mono">{c.expireDate}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isPurchase && cards.length === 0 && (
            <div className="text-center text-white/30 text-sm py-4">Chưa có mã thẻ</div>
          )}
        </div>
      </div>
    )
  }

  const depStatusColor = {
    PENDING: 'text-yellow-400',
    SUCCESS: 'text-neon-green',
    WRONG_VALUE: 'text-orange-400',
    FAILED: 'text-red-400',
  }

  const depStatusLabel = {
    PENDING: 'Đang xử lý',
    SUCCESS: 'Thành công',
    WRONG_VALUE: 'Sai mệnh giá',
    FAILED: 'Thất bại',
  }

  const purchaseStatusLabel = {
    PENDING: 'Đang xử lý',
    SUCCESS: 'Thành công',
    FAILED: 'Thất bại',
  }

  const purchaseStatusColor = {
    PENDING: 'text-yellow-400',
    SUCCESS: 'text-neon-green',
    FAILED: 'text-red-400',
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-gaming text-xl font-bold text-gradient flex items-center gap-3">
            <FontAwesomeIcon icon={faCreditCard} />
            Quản Lý Thẻ Cào
          </h1>

          <p className="text-white/40 text-sm">
            {configs.length} cấu hình — {groupedEntries.length} loại thẻ
          </p>
        </div>

        <button
          onClick={openCreate}
          className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faPlus} />
          Thêm Cấu Hình
        </button>
      </div>

      <div className="flex gap-1 border-b border-white/10 overflow-x-auto">
        {[
          { id: 'configs', icon: faLayerGroup, label: `Cấu Hình (${configs.length})` },
          { id: 'deposits', icon: faMoneyBillWave, label: 'Lịch Sử Nạp' },
          { id: 'purchases', icon: faBoxOpen, label: 'Lịch Sử Mua' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-xs font-bold transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
              tab === t.id
                ? 'border-neon-pink text-neon-pink'
                : 'border-transparent text-white/40 hover:text-white'
            }`}
          >
            <FontAwesomeIcon icon={t.icon} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'configs' && (
        loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : configs.length === 0 ? (
          <div className="gaming-card p-12 text-center">
            <FontAwesomeIcon icon={faCreditCard} className="text-5xl text-white/20 mb-4" />
            <p className="text-white/40 text-sm">Chưa có cấu hình thẻ nào</p>

            <button
              onClick={openCreate}
              className="mt-4 btn-primary px-5 py-2.5 text-sm flex items-center gap-2 mx-auto"
            >
              <FontAwesomeIcon icon={faPlus} />
              Thêm cấu hình đầu tiên
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {paginatedConfigEntries.map(([telco, items]) => {
              const info = telcoInfo(telco, items[0]?.telcoLabel)
              const groupIcon = isPhoneTelco(telco) ? faMobileScreen : faGamepad

              return (
                <div key={telco} className="gaming-card overflow-hidden">
                  <div className="px-5 py-3 border-b border-white/5 flex items-center gap-3 bg-white/[0.02]">
                    {items[0]?.thumbnailUrl ? (
                      <img
                        src={items[0].thumbnailUrl}
                        alt=""
                        className="w-11 h-8 rounded-lg object-cover border border-white/10 bg-dark-600"
                      />
                    ) : (
                      <div className="w-11 h-8 rounded-lg bg-dark-600 border border-white/10 flex items-center justify-center text-white/35">
                        <FontAwesomeIcon icon={groupIcon} />
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="font-gaming font-bold text-white text-sm flex items-center gap-2">
                        <FontAwesomeIcon icon={groupIcon} className="text-neon-pink text-xs" />
                        {info.label}
                      </div>

                      <div className="text-white/30 text-xs">
                        {items.length} mệnh giá
                      </div>
                    </div>
                  </div>

                  <div className="divide-y divide-white/[0.05]">
                    {items.map(cfg => (
                      <div
                        key={cfg.id}
                        className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.03] transition-colors"
                      >
                        <div className="w-14 h-10 flex-shrink-0">
                          {cfg.thumbnailUrl ? (
                            <img
                              src={cfg.thumbnailUrl}
                              alt=""
                              className="w-14 h-10 rounded-lg object-cover border border-white/10 bg-dark-600"
                            />
                          ) : (
                            <div className="w-14 h-10 rounded-lg border border-dashed border-white/15 flex items-center justify-center text-white/20 text-lg bg-dark-600">
                              <FontAwesomeIcon icon={faImage} />
                            </div>
                          )}
                        </div>

                        <div className="w-28 flex-shrink-0">
                          <div className="font-gaming font-black text-white text-base">
                            {formatCurrency(cfg.denomination)}
                          </div>
                          <div className="text-white/25 text-[10px] font-mono">
                            #{cfg.sortOrder || 0}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="text-white/40 text-[10px] uppercase tracking-wide mb-1 flex items-center gap-1">
                            <FontAwesomeIcon icon={faMoneyBillWave} />
                            Nạp thẻ
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            <StatusBadge v={cfg.depositEnabled} />
                            {cfg.depositEnabled && (
                              <>
                                <span className="text-blue-300 text-xs font-bold">
                                  CK {cfg.depositDiscount}%
                                </span>
                                <span className="text-white/30 text-[10px]">
                                  → nhận{' '}
                                  {formatCurrency(
                                    Math.round(
                                      parseFloat(cfg.denomination) *
                                        (1 - parseFloat(cfg.depositDiscount) / 100)
                                    )
                                  )}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="text-white/40 text-[10px] uppercase tracking-wide mb-1 flex items-center gap-1">
                            <FontAwesomeIcon icon={faCartShopping} />
                            Mua thẻ
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            <StatusBadge v={cfg.buyEnabled} />
                            {cfg.buyEnabled && (
                              <>
                                <span className="text-neon-green text-xs font-bold">
                                  CK {cfg.buyDiscount}%
                                </span>
                                <span className="text-white/30 text-[10px]">
                                  → trả{' '}
                                  {formatCurrency(
                                    Math.round(
                                      parseFloat(cfg.denomination) *
                                        (1 - parseFloat(cfg.buyDiscount) / 100)
                                    )
                                  )}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => openEdit(cfg)}
                            className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 text-xs transition-colors"
                            title="Sửa"
                          >
                            <FontAwesomeIcon icon={faPen} />
                          </button>

                          <button
                            onClick={() => setDeleteTarget(cfg)}
                            className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs transition-colors"
                            title="Xóa"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}

            {groupedEntries.length > CONFIG_LIMIT && (
              <div className="gaming-card p-4">
                <Pagination
                  page={configPage}
                  pages={totalConfigPages}
                  onPageChange={setConfigPage}
                />
              </div>
            )}
          </div>
        )
      )}

      {tab === 'deposits' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">
                <FontAwesomeIcon icon={faSearch} />
              </span>

              <input
                value={depSearch}
                onChange={e => {
                  setDepSearch(e.target.value)
                  setDepPage(1)
                }}
                placeholder="Tìm user..."
                className="input-gaming text-sm py-2 pl-9"
              />
            </div>

            <select
              value={depStatus}
              onChange={e => {
                setDepStatus(e.target.value)
                setDepPage(1)
              }}
              className="input-gaming text-sm py-2 max-w-[190px]"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PENDING">Đang xử lý</option>
              <option value="SUCCESS">Thành công</option>
              <option value="WRONG_VALUE">Sai mệnh giá</option>
              <option value="FAILED">Thất bại</option>
            </select>

            <select
              value={depTelco}
              onChange={e => {
                setDepTelco(e.target.value)
                setDepPage(1)
              }}
              className="input-gaming text-sm py-2 max-w-[190px]"
            >
              <option value="ALL">Tất cả loại thẻ</option>
              {uniqueTelcos.map(t => {
                const info = telcoInfo(t, configs.find(c => c.telco === t)?.telcoLabel)
                return (
                  <option key={t} value={t}>
                    {info.label}
                  </option>
                )
              })}
            </select>

            <button
              onClick={fetchDeposits}
              className="px-3 py-2 rounded-lg border border-white/10 bg-dark-600 text-white/50 hover:text-white hover:border-white/20 text-sm transition-all"
            >
              <FontAwesomeIcon icon={faRotate} />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <div className="gaming-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-xs text-white/40 uppercase tracking-wider">
                      <th className="text-left p-4">User</th>
                      <th className="text-left p-4">Loại thẻ</th>
                      <th className="text-left p-4">Mệnh giá</th>
                      <th className="text-left p-4">CK</th>
                      <th className="text-left p-4">Thực nhận</th>
                      <th className="text-left p-4">Trạng thái</th>
                      <th className="text-left p-4">Thời gian</th>
                      <th className="text-left p-4">Thao tác</th>
                    </tr>
                  </thead>

                  <tbody>
                    {deposits.map(d => {
                      const info = telcoInfo(d.telco, d.cardConfig?.telcoLabel)

                      return (
                        <tr
                          key={d.id}
                          className="border-b border-white/5 hover:bg-white/2 transition-colors"
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              {d.user?.avatar ? (
                                <img src={d.user.avatar} className="w-7 h-7 rounded-full object-cover" />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-dark-600 border border-white/10 flex items-center justify-center text-white/30">
                                  <FontAwesomeIcon icon={faUser} />
                                </div>
                              )}

                              <div>
                                <div className="text-white text-xs font-medium">
                                  {d.user?.displayName || d.user?.username || '—'}
                                </div>
                                {d.user?.username && (
                                  <div className="text-white/25 text-[10px]">
                                    @{d.user.username}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="p-4">
                            <span className="inline-flex items-center gap-2 text-white/70 text-xs font-medium">
                              <FontAwesomeIcon icon={isPhoneTelco(d.telco) ? faMobileScreen : faGamepad} />
                              {info.label}
                            </span>
                          </td>

                          <td className="p-4 text-yellow-400 font-bold text-xs">
                            {formatCurrency(d.declaredAmount)}
                          </td>

                          <td className="p-4 text-white/50 text-xs">
                            {d.depositDiscount}%
                          </td>

                          <td className="p-4">
                            {Number(d.receivedAmount) > 0 ? (
                              <span className="text-neon-green font-bold text-xs">
                                +{formatCurrency(d.receivedAmount)}
                              </span>
                            ) : (
                              <span className="text-white/20 text-xs">—</span>
                            )}
                          </td>

                          <td className="p-4">
                            <span className={`text-xs font-bold ${depStatusColor[d.status]}`}>
                              {depStatusLabel[d.status] || d.status}
                            </span>
                          </td>

                          <td className="p-4 text-white/40 text-[11px]">
                            {formatDate(d.createdAt)}
                          </td>

                          <td className="p-4">
                            <div className="flex gap-2 items-center">
                              <button
                                onClick={() => setViewTarget({ type: 'deposit', data: d })}
                                className="px-3 py-1.5 rounded-lg bg-neon-blue/20 text-neon-blue hover:bg-neon-blue/30 text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap"
                              >
                                <FontAwesomeIcon icon={faEye} />
                                Xem
                              </button>
                              {d.status === 'PENDING' && (
                                <button
                                  onClick={() => openDepUpdate(d)}
                                  className="px-3 py-1.5 rounded-lg bg-neon-pink/20 text-neon-pink hover:bg-neon-pink/30 text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap"
                                >
                                  <FontAwesomeIcon icon={faWrench} />
                                  Xử lý
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}

                    {deposits.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-10 text-center text-white/30 text-sm">
                          Không có dữ liệu
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {depTotal > HISTORY_LIMIT && (
                <div className="p-4">
                  <Pagination
                    page={depPage}
                    pages={Math.ceil(depTotal / HISTORY_LIMIT)}
                    onPageChange={setDepPage}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'purchases' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <select
              value={purStatus}
              onChange={e => {
                setPurStatus(e.target.value)
                setPurPage(1)
              }}
              className="input-gaming text-sm py-2 max-w-[190px]"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PENDING">Đang xử lý</option>
              <option value="SUCCESS">Thành công</option>
              <option value="FAILED">Thất bại</option>
            </select>

            <select
              value={purTelco}
              onChange={e => {
                setPurTelco(e.target.value)
                setPurPage(1)
              }}
              className="input-gaming text-sm py-2 max-w-[190px]"
            >
              <option value="ALL">Tất cả loại thẻ</option>
              {uniqueTelcos.map(t => {
                const info = telcoInfo(t, configs.find(c => c.telco === t)?.telcoLabel)
                return (
                  <option key={t} value={t}>
                    {info.label}
                  </option>
                )
              })}
            </select>

            <button
              onClick={fetchPurchases}
              className="px-3 py-2 rounded-lg border border-white/10 bg-dark-600 text-white/50 hover:text-white hover:border-white/20 text-sm transition-all"
            >
              <FontAwesomeIcon icon={faRotate} />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <div className="gaming-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-xs text-white/40 uppercase tracking-wider">
                      <th className="text-left p-4">User</th>
                      <th className="text-left p-4">Loại thẻ</th>
                      <th className="text-left p-4">Mệnh giá</th>
                      <th className="text-center p-4">SL</th>
                      <th className="text-left p-4">CK</th>
                      <th className="text-right p-4">Thanh toán</th>
                      <th className="text-left p-4">Trạng thái</th>
                      <th className="text-left p-4">Thời gian</th>
                      <th className="text-left p-4">Thao tác</th>
                    </tr>
                  </thead>

                  <tbody>
                    {purchases.map(p => {
                      const info = telcoInfo(p.telco, p.cardConfig?.telcoLabel)

                      return (
                        <tr
                          key={p.id}
                          className="border-b border-white/5 hover:bg-white/2 transition-colors"
                        >
                          <td className="p-4 text-white text-xs font-medium">
                            {p.user?.displayName || p.user?.username || '—'}
                          </td>

                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              {p.cardConfig?.thumbnailUrl ? (
                                <img
                                  src={p.cardConfig.thumbnailUrl}
                                  className="w-10 h-7 rounded object-cover border border-white/10 bg-dark-600"
                                />
                              ) : (
                                <div className="w-10 h-7 rounded bg-dark-600 border border-white/10 flex items-center justify-center text-white/30">
                                  <FontAwesomeIcon icon={isPhoneTelco(p.telco) ? faMobileScreen : faGamepad} />
                                </div>
                              )}

                              <span className="text-white/70 text-xs font-medium">
                                {info.label}
                              </span>
                            </div>
                          </td>

                          <td className="p-4 text-yellow-400 font-bold text-xs">
                            {formatCurrency(p.denomination)}
                          </td>

                          <td className="p-4 text-center text-white text-xs">
                            {p.quantity}
                          </td>

                          <td className="p-4 text-white/50 text-xs">
                            {p.buyDiscount}%
                          </td>

                          <td className="p-4 text-right text-red-400 font-bold text-xs">
                            -{formatCurrency(p.totalPrice)}
                          </td>

                          <td className="p-4">
                            <span className={`text-xs font-bold ${purchaseStatusColor[p.status]}`}>
                              {purchaseStatusLabel[p.status] || p.status}
                            </span>
                          </td>

                          <td className="p-4 text-white/40 text-[11px]">
                            {formatDate(p.createdAt)}
                          </td>

                          <td className="p-4">
                            <div className="flex gap-2 items-center">
                              <button
                                onClick={() => setViewTarget({ type: 'purchase', data: p })}
                                className="px-3 py-1.5 rounded-lg bg-neon-blue/20 text-neon-blue hover:bg-neon-blue/30 text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap"
                              >
                                <FontAwesomeIcon icon={faEye} />
                                Xem
                              </button>
                              {(p.status === 'FAILED' || p.status === 'PENDING') && (
                                <button
                                  onClick={() => openPurResend(p)}
                                  className="px-3 py-1.5 rounded-lg bg-neon-green/20 text-neon-green hover:bg-neon-green/30 text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap"
                                >
                                  <FontAwesomeIcon icon={faPaperPlane} />
                                  Gửi thẻ
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}

                    {purchases.length === 0 && (
                      <tr>
                        <td colSpan={9} className="px-4 py-10 text-center text-white/30 text-sm">
                          Không có dữ liệu
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {purTotal > HISTORY_LIMIT && (
                <div className="p-4">
                  <Pagination
                    page={purPage}
                    pages={Math.ceil(purTotal / HISTORY_LIMIT)}
                    onPageChange={setPurPage}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <Modal
            isOpen
            title={
              editItem
                ? `Sửa cấu hình — ${telcoInfo(editItem.telco, editItem.telcoLabel).label} ${formatCurrency(editItem.denomination)}`
                : 'Thêm cấu hình thẻ mới'
            }
            onClose={() => {
              if (!saving) {
                setShowForm(false)
                setEditItem(null)
              }
            }}
            size="lg"
          >
            <ConfigForm
              initial={editItem}
              onSave={handleSave}
              onClose={() => {
                setShowForm(false)
                setEditItem(null)
              }}
              saving={saving}
            />
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTarget && (
          <Modal
            isOpen
            title="Xác nhận xóa"
            onClose={() => setDeleteTarget(null)}
          >
            <p className="text-white/70 text-sm mb-6">
              Xóa cấu hình thẻ{' '}
              <span className="text-yellow-400 font-bold">
                {telcoInfo(deleteTarget.telco, deleteTarget.telcoLabel).label} —{' '}
                {formatCurrency(deleteTarget.denomination)}
              </span>
              ?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-3 rounded-xl border border-white/10 text-white/50 hover:text-white text-sm transition-all"
              >
                Hủy
              </button>

              <button
                onClick={handleDelete}
                className="flex-1 py-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 text-sm font-bold transition-all"
              >
                <FontAwesomeIcon icon={faTrash} className="mr-2" />
                Xóa
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Modal cập nhật trạng thái nạp thẻ */}
      <AnimatePresence>
        {depUpdateTarget && (
          <Modal isOpen title="Xử lý nạp thẻ thủ công" onClose={() => !depUpdating && setDepUpdateTarget(null)} size="sm">
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-xs space-y-1">
                <div className="text-white/40">User: <span className="text-white font-medium">{depUpdateTarget.user?.displayName || depUpdateTarget.user?.username}</span></div>
                <div className="text-white/40">Thẻ: <span className="text-yellow-400 font-bold">{depUpdateTarget.telco} — {formatCurrency(depUpdateTarget.declaredAmount)}</span></div>
              </div>

              <div>
                <label className="text-white/40 text-xs block mb-2">Trạng thái *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { v: 'SUCCESS', label: 'Thành công', color: 'neon-green' },
                    { v: 'WRONG_VALUE', label: 'Sai mệnh giá', color: 'orange-400' },
                    { v: 'FAILED', label: 'Thất bại', color: 'red-400' },
                  ].map(opt => (
                    <button
                      key={opt.v}
                      onClick={() => setDepUpdateForm(f => ({ ...f, status: opt.v }))}
                      className={`py-2 px-2 rounded-lg border text-xs font-bold transition-all ${
                        depUpdateForm.status === opt.v
                          ? `bg-${opt.color}/20 border-${opt.color}/40 text-${opt.color}`
                          : 'bg-dark-600 border-white/10 text-white/40 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {depUpdateForm.status !== 'FAILED' && (
                <div>
                  <label className="text-white/40 text-xs block mb-1">Mệnh giá thực tế (VNĐ)</label>
                  <input
                    type="number"
                    value={depUpdateForm.realAmount}
                    onChange={e => setDepUpdateForm(f => ({ ...f, realAmount: e.target.value }))}
                    placeholder={`Mặc định: ${depUpdateTarget.declaredAmount}`}
                    className="input-gaming text-sm py-2 w-full"
                  />
                  {depUpdateForm.status === 'WRONG_VALUE' && (
                    <p className="text-orange-400 text-[10px] mt-1">
                      ⚠️ Sai mệnh giá — user nhận 40% sau chiết khấu {depUpdateTarget.depositDiscount}%
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="text-white/40 text-xs block mb-1">Ghi chú (tùy chọn)</label>
                <input
                  type="text"
                  value={depUpdateForm.note}
                  onChange={e => setDepUpdateForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="Lý do từ chối, ghi chú..."
                  className="input-gaming text-sm py-2 w-full"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={() => setDepUpdateTarget(null)} disabled={depUpdating} className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/50 hover:text-white text-sm transition-all">
                  Hủy
                </button>
                <button
                  onClick={handleDepUpdate}
                  disabled={depUpdating}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                    depUpdateForm.status === 'FAILED'
                      ? 'bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30'
                      : depUpdateForm.status === 'WRONG_VALUE'
                      ? 'bg-orange-400/20 border border-orange-400/40 text-orange-400 hover:bg-orange-400/30'
                      : 'btn-primary'
                  }`}
                >
                  {depUpdating ? <Spinner size="sm" color="white" /> : <FontAwesomeIcon icon={faCheck} />}
                  Xác nhận
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Modal gửi thẻ thủ công */}
      <AnimatePresence>
        {purResendTarget && (
          <Modal isOpen title="Gửi thẻ thủ công" onClose={() => !purResending && setPurResendTarget(null)} size="md">
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-xs space-y-1">
                <div className="text-white/40">User: <span className="text-white font-medium">{purResendTarget.user?.displayName || purResendTarget.user?.username}</span></div>
                <div className="text-white/40">Đơn: <span className="text-yellow-400 font-bold">{purResendTarget.telco} {formatCurrency(purResendTarget.denomination)} x{purResendTarget.quantity}</span></div>
              </div>

              <div className="space-y-3">
                {purResendCards.map((card, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-white/[0.03] border border-white/10 space-y-2">
                    <div className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Thẻ #{idx + 1}</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-white/30 text-[10px] block mb-1">Serial *</label>
                        <input
                          value={card.serial}
                          onChange={e => updateResendCard(idx, 'serial', e.target.value)}
                          placeholder="Số serial"
                          className="input-gaming text-xs py-1.5 w-full font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-white/30 text-[10px] block mb-1">Mã thẻ / PIN *</label>
                        <input
                          value={card.code}
                          onChange={e => updateResendCard(idx, 'code', e.target.value)}
                          placeholder="Mã thẻ"
                          className="input-gaming text-xs py-1.5 w-full font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-white/30 text-[10px] block mb-1">Hạn sử dụng (tùy chọn)</label>
                      <input
                        value={card.expireDate}
                        onChange={e => updateResendCard(idx, 'expireDate', e.target.value)}
                        placeholder="VD: 12/2025"
                        className="input-gaming text-xs py-1.5 w-full"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="text-white/40 text-xs block mb-1">Ghi chú (tùy chọn)</label>
                <input
                  value={purResendNote}
                  onChange={e => setPurResendNote(e.target.value)}
                  placeholder="Lý do gửi thủ công..."
                  className="input-gaming text-sm py-2 w-full"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={() => setPurResendTarget(null)} disabled={purResending} className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/50 hover:text-white text-sm transition-all">
                  Hủy
                </button>
                <button onClick={handlePurResend} disabled={purResending} className="flex-1 py-2.5 rounded-xl btn-primary text-sm font-bold flex items-center justify-center gap-2">
                  {purResending ? <Spinner size="sm" color="white" /> : <FontAwesomeIcon icon={faPaperPlane} />}
                  Gửi thẻ
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* View Detail Modal */}
      <AnimatePresence>
        {viewTarget && <ViewModal />}
      </AnimatePresence>
    </div>
  )
}
