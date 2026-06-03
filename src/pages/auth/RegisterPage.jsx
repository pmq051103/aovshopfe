import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useDispatch, useSelector } from 'react-redux'
import { register, clearError } from '../../store/slices/authSlice'
import { Spinner } from '../../components/common/UIComponents'
import { useSiteSettings } from '../../context/SiteSettingsContext'
import toast from 'react-hot-toast'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faWandMagicSparkles,
  faUser,
  faEnvelope,
  faLock,
  faEye,
  faEyeSlash,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons'

function InputField({ name, label, type = 'text', placeholder, icon, extra, form, setForm, errors, setErrors }) {
  return (
    <div>
      <label className="text-xs text-white/40 uppercase tracking-wider font-display block mb-2">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">
          <FontAwesomeIcon icon={icon} />
        </span>
        <input
          type={type}
          value={form[name]}
          onChange={e => {
            setForm(p => ({ ...p, [name]: e.target.value }))
            setErrors(p => ({ ...p, [name]: '' }))
          }}
          placeholder={placeholder}
          className={`input-gaming pl-9 ${extra || ''} ${errors[name] ? 'border-red-500/50' : ''}`}
        />
      </div>
      {errors[name] && <p className="text-red-400 text-xs mt-1">{errors[name]}</p>}
    </div>
  )
}

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '', displayName: '' })
  const [showPass, setShowPass] = useState(false)
  const [errors, setErrors] = useState({})

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error } = useSelector(s => s.auth)
  const { settings: siteSettings } = useSiteSettings()

  const siteName = siteSettings.site_name || 'LQ SHOP'
  const siteLogo = siteSettings.site_logo

  const validate = () => {
    const errs = {}
    if (!form.username || form.username.length < 4) errs.username = 'Username tối thiểu 4 ký tự'
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Email không hợp lệ'
    if (!form.password || form.password.length < 8) errs.password = 'Mật khẩu tối thiểu 8 ký tự'
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Mật khẩu không khớp'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async e => {
    e.preventDefault()
    dispatch(clearError())
    if (!validate()) return
    const result = await dispatch(register({
      username: form.username,
      email: form.email,
      password: form.password,
      displayName: form.displayName || form.username,
    }))
    if (register.fulfilled.match(result)) {
      toast.success('Đăng ký thành công!')
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-animated grid-bg flex items-center justify-center p-4 py-10">
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-neon-purple/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-neon-blue/5 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <div className="gaming-card border-neon-purple p-8">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex flex-col items-center gap-2">
              {siteLogo ? (
                <img src={siteLogo} alt={siteName} className="h-14 w-auto object-contain" />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center shadow-neon-purple">
                  <span className="font-gaming text-2xl font-black text-white">
                    {siteName.substring(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="font-gaming text-2xl font-bold text-gradient">
                {siteName.toUpperCase()}
              </span>
            </Link>
            <p className="text-white/40 text-sm mt-2">Tạo tài khoản miễn phí</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center flex items-center justify-center gap-2"
            >
              <FontAwesomeIcon icon={faTriangleExclamation} />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <InputField name="displayName" label="Tên hiển thị" placeholder="Tên của bạn" icon={faWandMagicSparkles} form={form} setForm={setForm} errors={errors} setErrors={setErrors} />
            <InputField name="username" label="Username *" placeholder="username (4-20 ký tự)" icon={faUser} form={form} setForm={setForm} errors={errors} setErrors={setErrors} />
            <InputField name="email" label="Email *" type="email" placeholder="your@email.com" icon={faEnvelope} form={form} setForm={setForm} errors={errors} setErrors={setErrors} />

            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider font-display block mb-2">Mật Khẩu *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
                  <FontAwesomeIcon icon={faLock} />
                </span>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => { setForm(p => ({ ...p, password: e.target.value })); setErrors(p => ({ ...p, password: '' })) }}
                  placeholder="Tối thiểu 8 ký tự"
                  className={`input-gaming pl-9 pr-10 ${errors.password ? 'border-red-500/50' : ''}`}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  <FontAwesomeIcon icon={showPass ? faEyeSlash : faEye} />
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider font-display block mb-2">Xác Nhận Mật Khẩu *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
                  <FontAwesomeIcon icon={faLock} />
                </span>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={e => { setForm(p => ({ ...p, confirmPassword: e.target.value })); setErrors(p => ({ ...p, confirmPassword: '' })) }}
                  placeholder="Nhập lại mật khẩu"
                  className={`input-gaming pl-9 ${errors.confirmPassword ? 'border-red-500/50' : ''}`}
                />
              </div>
              {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>

            {form.password && (
              <div className="flex gap-1">
                {[...Array(4)].map((_, i) => {
                  const strength = [
                    form.password.length >= 8,
                    /[A-Z]/.test(form.password),
                    /[0-9]/.test(form.password),
                    /[^A-Za-z0-9]/.test(form.password),
                  ].filter(Boolean).length
                  return (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < strength ? ['bg-red-500','bg-yellow-500','bg-blue-500','bg-neon-green'][strength - 1] : 'bg-white/10'}`} />
                  )
                })}
              </div>
            )}

            <div className="text-xs text-white/30">
              Bằng việc đăng ký, bạn đồng ý với{' '}
              <span className="text-neon-pink cursor-pointer hover:underline">Điều khoản dịch vụ</span>{' '}
              và{' '}
              <span className="text-neon-pink cursor-pointer hover:underline">Chính sách bảo mật</span>{' '}
              của chúng tôi.
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? (<><Spinner size="sm" color="white" />Đang đăng ký...</>) : <>Tạo Tài Khoản</>}
            </button>
          </form>

          <div className="text-center mt-6 text-white/40 text-sm">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-neon-pink hover:text-neon-pink/80 font-medium">Đăng Nhập</Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}