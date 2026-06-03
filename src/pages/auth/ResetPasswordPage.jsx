import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../../api/axios'
import { Spinner } from '../../components/common/UIComponents'
import { useSiteSettings } from '../../context/SiteSettingsContext'
import toast from 'react-hot-toast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLock, faEye, faEyeSlash, faKey } from '@fortawesome/free-solid-svg-icons'

export default function ResetPasswordPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { settings: siteSettings } = useSiteSettings()

  const siteName = siteSettings.site_name || 'LQ SHOP'
  const siteLogo = siteSettings.site_logo

  const [form, setForm] = useState({ password: '', confirmPassword: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const errs = {}
    if (!form.password || form.password.length < 8) errs.password = 'Mật khẩu tối thiểu 8 ký tự'
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Mật khẩu không khớp'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, password: form.password })
      toast.success('Đặt lại mật khẩu thành công!')
      navigate('/login')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi đặt lại mật khẩu')
    } finally {
      setLoading(false)
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
            <p className="text-white/40 text-sm mt-2">
              Tạo mật khẩu mới cho tài khoản của bạn
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider font-display block mb-2">
                Mật Khẩu Mới *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
                  <FontAwesomeIcon icon={faLock} />
                </span>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => {
                    setForm(p => ({ ...p, password: e.target.value }))
                    setErrors(p => ({ ...p, password: '' }))
                  }}
                  placeholder="Tối thiểu 8 ký tự"
                  className={`input-gaming pl-9 pr-10 ${errors.password ? 'border-red-500/50' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  <FontAwesomeIcon icon={showPass ? faEyeSlash : faEye} />
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider font-display block mb-2">
                Xác Nhận Mật Khẩu *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
                  <FontAwesomeIcon icon={faLock} />
                </span>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => {
                    setForm(p => ({ ...p, confirmPassword: e.target.value }))
                    setErrors(p => ({ ...p, confirmPassword: '' }))
                  }}
                  placeholder="Nhập lại mật khẩu mới"
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
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                      i < strength ? ['bg-red-500','bg-yellow-500','bg-blue-500','bg-neon-green'][strength - 1] : 'bg-white/10'
                    }`} />
                  )
                })}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <><Spinner size="sm" color="white" />Đang cập nhật...</>
              ) : (
                <><FontAwesomeIcon icon={faKey} />Đặt Lại Mật Khẩu</>
              )}
            </button>
          </form>

          <div className="text-center mt-6 text-white/40 text-sm">
            Nhớ mật khẩu?{' '}
            <Link to="/login" className="text-neon-pink hover:text-neon-pink/80 font-medium">
              Đăng Nhập
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}