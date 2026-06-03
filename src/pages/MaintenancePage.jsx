import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function MaintenancePage({ message }) {
  return (
    <div className="fixed inset-0 bg-dark-900 flex flex-col items-center justify-center z-[9999] px-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-8 text-center max-w-md"
      >
        {/* Logo */}
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-neon-pink to-neon-purple animate-pulse" />
          <div className="absolute inset-1 rounded-xl bg-dark-800 flex items-center justify-center">
            <span className="font-gaming text-3xl font-black text-gradient">LQ</span>
          </div>
        </div>

        {/* Icon bảo trì */}
        <div className="text-6xl">🔧</div>

        {/* Tiêu đề */}
        <div className="flex flex-col gap-3">
          <h1 className="font-gaming text-3xl font-black text-gradient">
            BẢO TRÌ HỆ THỐNG
          </h1>
          <p className="text-gray-400 text-base leading-relaxed">
            {message || 'Website đang được bảo trì, vui lòng quay lại sau.'}
          </p>
        </div>

        {/* Animated dots */}
        <div className="flex gap-2">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-3 h-3 rounded-full bg-neon-pink"
              animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.25 }}
            />
          ))}
        </div>

        {/* Link đăng nhập admin */}
        <Link
          to="/login"
          className="text-xs text-gray-600 hover:text-gray-400 transition-colors mt-4"
        >
          Đăng nhập quản trị
        </Link>
      </motion.div>
    </div>
  )
}
