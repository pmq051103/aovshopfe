import { motion } from 'framer-motion'

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-dark-900 flex flex-col items-center justify-center z-[9999]">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-6"
      >
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-neon-pink to-neon-purple animate-pulse" />
          <div className="absolute inset-1 rounded-xl bg-dark-800 flex items-center justify-center">
            <span className="font-gaming text-2xl font-black text-gradient">LQ</span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="font-gaming text-xl font-bold text-gradient">LQ SHOP</div>
          <div className="flex gap-1.5">
            {[0,1,2].map(i => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-neon-pink"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}