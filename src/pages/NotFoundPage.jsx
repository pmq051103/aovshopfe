import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHouse, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-lg"
      >
        {/* Glowing 404 */}
        <div className="relative mb-6 select-none">
          <span
            className="text-[120px] font-black leading-none font-exo tracking-tight"
            style={{
              background: 'linear-gradient(135deg, #a855f7, #ec4899)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 30px rgba(168,85,247,0.5))',
            }}
          >
            404
          </span>
          <div
            className="absolute inset-0 blur-3xl opacity-20 rounded-full"
            style={{ background: 'radial-gradient(circle, #a855f7, #ec4899)' }}
          />
        </div>

        <div className="mb-3 text-yellow-400 text-3xl">
          <FontAwesomeIcon icon={faTriangleExclamation} />
        </div>

        <h1 className="text-2xl font-bold text-white mb-3 font-exo">
          Trang không tồn tại
        </h1>
        <p className="text-white/50 mb-8 text-sm leading-relaxed">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.<br />
          Có thể tính năng này đã bị tắt bởi quản trị viên.
        </p>

        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200"
          style={{
            background: 'linear-gradient(135deg, #a855f7, #ec4899)',
            color: '#fff',
            boxShadow: '0 0 20px rgba(168,85,247,0.4)',
          }}
        >
          <FontAwesomeIcon icon={faHouse} />
          Về trang chủ
        </Link>
      </motion.div>
    </div>
  )
}
