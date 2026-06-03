import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../../api/axios'
import { Spinner } from '../../components/common/UIComponents'
import toast from 'react-hot-toast'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faKey,
  faEnvelope,
  faPaperPlane,
  faArrowLeft,
  faCircleCheck,
} from '@fortawesome/free-solid-svg-icons'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)

    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
    } catch (e) {
      toast.error('Lỗi gửi email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-animated grid-bg flex items-center justify-center p-4">
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-neon-blue/5 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        <div className="gaming-card border-neon-blue p-8">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3 text-neon-blue">
              <FontAwesomeIcon icon={faKey} />
            </div>

            <h1 className="font-gaming text-2xl font-bold text-gradient mb-2">
              Quên Mật Khẩu
            </h1>

            <p className="text-white/40 text-sm">
              Nhập email để nhận link đặt lại mật khẩu
            </p>
          </div>

          {sent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="text-5xl mb-4 text-neon-green">
                <FontAwesomeIcon icon={faCircleCheck} />
              </div>

              <h3 className="font-bold text-neon-green text-lg mb-2">
                Đã Gửi Email!
              </h3>

              <p className="text-white/50 text-sm mb-6">
                Kiểm tra hộp thư của bạn và làm theo hướng dẫn.
              </p>

              <Link
                to="/login"
                className="btn-primary px-8 py-3 inline-flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faArrowLeft} />
                Về Đăng Nhập
              </Link>
            </motion.div>
          ) : (
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
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="input-gaming pl-9"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-4 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Spinner size="sm" color="white" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faPaperPlane} />
                    Gửi Link Đặt Lại
                  </>
                )}
              </button>

              <div className="text-center">
                <Link
                  to="/login"
                  className="text-white/40 hover:text-white text-sm transition-colors inline-flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faArrowLeft} />
                  Quay lại đăng nhập
                </Link>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  )
}