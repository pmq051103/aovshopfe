import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useSelector, useDispatch } from 'react-redux'
import { updateUser } from '../../store/slices/authSlice'
import api from '../../api/axios'
import { formatCurrency, formatDate } from '../../utils/helpers'
import { Spinner } from '../../components/common/UIComponents'
import toast from 'react-hot-toast'

import {
  faGem,
  faMoneyBillWave,
  faCartShopping,
  faCamera,
  faUser,
  faLock,
  faFloppyDisk,
  faKey,
  faCoins
} from '@fortawesome/free-solid-svg-icons'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

export default function ProfilePage() {
  const { user } = useSelector(s => s.auth)
  const dispatch = useDispatch()
  const fileRef = useRef(null)

  const [tab, setTab] = useState('profile')
  const [form, setForm] = useState({ displayName: user?.displayName || '' })
  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { data } = await api.put('/users/profile', form)
      dispatch(updateUser(data.data))
      toast.success('Cập nhật thành công!')
    } catch (e) {
      toast.error('Lỗi cập nhật')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)

    try {
      const fd = new FormData()
      fd.append('avatar', file)

      const { data } = await api.post('/users/avatar', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      dispatch(updateUser({ avatar: data.data.avatar }))
      toast.success('Cập nhật avatar thành công!')
    } catch (e) {
      toast.error('Lỗi tải lên ảnh')
    } finally {
      setUploading(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()

    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('Mật khẩu không khớp')
      return
    }

    if (pwForm.newPassword.length < 8) {
      toast.error('Mật khẩu tối thiểu 8 ký tự')
      return
    }

    setSaving(true)

    try {
      await api.put('/users/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword
      })

      toast.success('Đổi mật khẩu thành công!')
      setPwForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi đổi mật khẩu')
    } finally {
      setSaving(false)
    }
  }

  const stats = [
    {
      icon: faGem,
      label: 'Số dư',
      value: formatCurrency(user?.balance),
      color: 'text-yellow-400',
      glow: 'from-yellow-400/20'
    },
    {
      icon: faCoins,
      label: 'Quân Huy',
      value: `${(user?.quanHuyBalance || 0).toLocaleString('vi-VN')} QH`,
      color: 'text-orange-400',
      glow: 'from-orange-400/20'
    },
    {
      icon: faMoneyBillWave,
      label: 'Tổng nạp',
      value: formatCurrency(user?.totalDeposit),
      color: 'text-neon-green',
      glow: 'from-neon-green/20'
    },
    {
      icon: faCartShopping,
      label: 'Tổng chi',
      value: formatCurrency(user?.totalSpent),
      color: 'text-neon-pink',
      glow: 'from-neon-pink/20'
    },
  ]

  return (
    <div className="pt-20 pb-20 min-h-screen">
      <div className="page-container max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="gaming-card p-5 sm:p-6 md:p-8 mb-6 overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-neon-pink/5 via-transparent to-neon-blue/5 pointer-events-none" />
          <div className="absolute -top-24 -right-24 w-56 h-56 bg-neon-pink/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6">
              <div className="relative group shrink-0">
                <img
                  src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`}
                  alt={user?.displayName}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl border-2 border-neon-pink/30 object-cover shadow-[0_0_30px_rgba(255,45,115,0.18)]"
                />

                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="absolute inset-0 rounded-3xl bg-black/55 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                >
                  {uploading ? (
                    <Spinner size="sm" />
                  ) : (
                    <span className="text-white text-xs flex items-center gap-1">
                      <FontAwesomeIcon icon={faCamera} />
                      Đổi ảnh
                    </span>
                  )}
                </button>

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>

              <div className="flex-1 min-w-0 text-center sm:text-left">
                <div className="flex items-center gap-2 justify-center sm:justify-start mb-2">
                  <h1 className="font-gaming text-3xl sm:text-4xl font-black text-white leading-tight break-words">
                    {user?.displayName || user?.username}
                  </h1>

                  {user?.role === 'ADMIN' && (
                    <span className="px-2 py-0.5 bg-neon-pink/20 text-neon-pink text-xs rounded-lg font-bold border border-neon-pink/30 shrink-0">
                      ADMIN
                    </span>
                  )}
                </div>

                <div className="text-white/45 text-sm mb-1 truncate">
                  @{user?.username}
                </div>

                <div className="text-white/30 text-xs truncate">
                  {user?.email}
                </div>

                <div className="text-white/25 text-xs mt-1">
                  Tham gia: {formatDate(user?.createdAt)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {stats.map(s => (
                <div
                  key={s.label}
                  className="relative overflow-hidden rounded-2xl border border-white/10 bg-dark-800/60 p-4 text-center shadow-lg"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${s.glow} via-transparent to-transparent opacity-60 pointer-events-none`} />

                  <div className="relative z-10">
                    <div className={`text-2xl mb-2 ${s.color}`}>
                      <FontAwesomeIcon icon={s.icon} />
                    </div>

                    <div className={`font-gaming text-base sm:text-lg font-black ${s.color} leading-tight break-words`}>
                      {s.value}
                    </div>

                    <div className="text-white/35 text-[11px] uppercase tracking-wider mt-1 font-display">
                      {s.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="flex gap-2 mb-6 border-b border-white/10 pb-2">
          {[
            [
              'profile',
              <>
                <FontAwesomeIcon icon={faUser} className="mr-2" />
                Thông Tin
              </>
            ],
            [
              'password',
              <>
                <FontAwesomeIcon icon={faLock} className="mr-2" />
                Mật Khẩu
              </>
            ]
          ].map(([t, l]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-t-lg font-display font-medium text-sm transition-all ${
                tab === t
                  ? 'bg-neon-pink/20 text-neon-pink border-b-2 border-neon-pink'
                  : 'text-white/40 hover:text-white'
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        {tab === 'profile' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="gaming-card p-6"
          >
            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider font-display block mb-2">
                  Tên hiển thị
                </label>

                <input
                  type="text"
                  value={form.displayName}
                  onChange={e => setForm(p => ({
                    ...p,
                    displayName: e.target.value
                  }))}
                  className="input-gaming"
                />
              </div>

              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider font-display block mb-2">
                  Username
                </label>

                <input
                  type="text"
                  value={user?.username}
                  disabled
                  className="input-gaming opacity-50 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider font-display block mb-2">
                  Email
                </label>

                <input
                  type="email"
                  value={user?.email}
                  disabled
                  className="input-gaming opacity-50 cursor-not-allowed"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="btn-primary px-8 py-3 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Spinner size="sm" color="white" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faFloppyDisk} />
                    Lưu Thay Đổi
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}

        {tab === 'password' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="gaming-card p-6"
          >
            <form onSubmit={handleChangePassword} className="space-y-5">
              {[
                {
                  name: 'currentPassword',
                  label: 'Mật khẩu hiện tại',
                  placeholder: 'Nhập mật khẩu hiện tại'
                },
                {
                  name: 'newPassword',
                  label: 'Mật khẩu mới',
                  placeholder: 'Tối thiểu 8 ký tự'
                },
                {
                  name: 'confirmPassword',
                  label: 'Xác nhận mật khẩu mới',
                  placeholder: 'Nhập lại mật khẩu mới'
                },
              ].map(f => (
                <div key={f.name}>
                  <label className="text-xs text-white/40 uppercase tracking-wider font-display block mb-2">
                    {f.label}
                  </label>

                  <input
                    type="password"
                    value={pwForm[f.name]}
                    onChange={e => setPwForm(p => ({
                      ...p,
                      [f.name]: e.target.value
                    }))}
                    placeholder={f.placeholder}
                    className="input-gaming"
                    required
                  />
                </div>
              ))}

              <button
                type="submit"
                disabled={saving}
                className="btn-primary px-8 py-3 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Spinner size="sm" color="white" />
                    Đang đổi...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faKey} />
                    Đổi Mật Khẩu
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  )
}