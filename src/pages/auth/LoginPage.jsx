// LoginPage.jsx (UPDATED - logo lấy từ siteSettings)
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useDispatch, useSelector } from 'react-redux'
import { login, clearError } from '../../store/slices/authSlice'
import { Spinner } from '../../components/common/UIComponents'
import GoogleLoginButton from '../../components/common/GoogleLoginButton'
import { useSiteSettings } from '../../context/SiteSettingsContext'
import toast from 'react-hot-toast'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faEnvelope,
  faLock,
  faEye,
  faEyeSlash,
  faTriangleExclamation,
  faRocket,
} from '@fortawesome/free-solid-svg-icons'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error } = useSelector(s => s.auth)
  const { settings: siteSettings } = useSiteSettings()

  const siteName = siteSettings.site_name || 'LQ SHOP'
  const siteLogo = siteSettings.site_logo

  const handleSubmit = async e => {
    e.preventDefault()
    dispatch(clearError())
    const result = await dispatch(login(form))
    if (login.fulfilled.match(result)) {
      toast.success('Đăng nhập thành công!')
      navigate('/')
    }
  }

  return (
  <div className="min-h-screen bg-animated grid-bg flex items-center justify-center p-4">
    <div className="absolute inset-0">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-pink/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple/5 rounded-full blur-[120px]" />
    </div>

    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="relative w-full max-w-md"
    >
      <div className="gaming-card border-neon p-8">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center gap-2">
            {siteLogo ? (
              <img src={siteLogo} alt={siteName} className="h-14 w-auto object-contain" />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-pink to-neon-purple flex items-center justify-center shadow-neon-pink">
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
            Chào mừng trở lại! Đăng nhập để tiếp tục
          </p>
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

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs text-white/40 uppercase tracking-wider font-display block mb-2">
              Email
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
                <FontAwesomeIcon icon={faEnvelope} />
              </span>
              <input
                type="email"
                value={form.email}
                onChange={e =>
                  setForm(p => ({ ...p, email: e.target.value }))
                }
                placeholder="your@email.com"
                required
                className="input-gaming pl-9"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-white/40 uppercase tracking-wider font-display block mb-2">
              Mật Khẩu
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
                <FontAwesomeIcon icon={faLock} />
              </span>
              <input
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={e =>
                  setForm(p => ({ ...p, password: e.target.value }))
                }
                placeholder="••••••••"
                required
                className="input-gaming pl-9 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 text-sm transition-colors"
              >
                <FontAwesomeIcon
                  icon={showPass ? faEyeSlash : faEye}
                />
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-xs text-neon-pink hover:text-neon-pink/80 transition-colors"
            >
              Quên mật khẩu?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Spinner size="sm" color="white" />
                Đang đăng nhập...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faRocket} />
                Đăng Nhập
              </>
            )}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-white/30 whitespace-nowrap">
            Hoặc tiếp tục với
          </span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <GoogleLoginButton label="Đăng nhập với Google" />

        <div className="text-center mt-6 text-white/40 text-sm">
          Chưa có tài khoản?{' '}
          <Link
            to="/register"
            className="text-neon-pink hover:text-neon-pink/80 font-medium"
          >
            Đăng Ký Ngay
          </Link>
        </div>
      </div>
    </motion.div>
  </div>
)
}