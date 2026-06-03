import { motion } from 'framer-motion'
import { getRarityColor, getRarityLabel } from '../../utils/helpers'

// Section Header
export function SectionHeader({ title, subtitle, gradient = true }) {
  return (
    <div className="text-center mb-10">
      <h2 className={`font-gaming text-3xl md:text-4xl font-bold mb-3 ${gradient ? 'text-gradient' : 'text-white'}`}>
        {title}
      </h2>
      {subtitle && <p className="text-white/50 text-sm md:text-base max-w-xl mx-auto">{subtitle}</p>}
      <div className="flex justify-center mt-4">
        <div className="h-0.5 w-20 bg-gradient-to-r from-transparent via-neon-pink to-transparent" />
      </div>
    </div>
  )
}

// Rarity Badge
export function RarityBadge({ rarity, size = 'sm' }) {
  const color = getRarityColor(rarity)
  const label = getRarityLabel(rarity)
  const sizes = { xs: 'px-1.5 py-0.5 text-[10px]', sm: 'px-2 py-0.5 text-xs', md: 'px-3 py-1 text-sm' }
  return (
    <span
      className={`inline-flex items-center font-bold rounded uppercase tracking-wider ${sizes[size]}`}
      style={{ color, background: `${color}20`, border: `1px solid ${color}40` }}
    >
      {rarity === 'MYTHIC' && '✦ '}{label}
    </span>
  )
}

// Stat Card
export function StatCard({ icon, label, value, subValue, color = 'pink', gradient }) {
  const colorMap = {
    pink: 'from-neon-pink/20 to-transparent border-neon-pink/20',
    blue: 'from-neon-blue/20 to-transparent border-neon-blue/20',
    purple: 'from-neon-purple/20 to-transparent border-neon-purple/20',
    green: 'from-neon-green/20 to-transparent border-neon-green/20',
    yellow: 'from-yellow-500/20 to-transparent border-yellow-500/20',
  }
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`gaming-card p-5 bg-gradient-to-br ${colorMap[color]}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="text-3xl">{icon}</div>
        {subValue && <span className="text-xs text-neon-green bg-neon-green/10 px-2 py-0.5 rounded-full">{subValue}</span>}
      </div>
      <div className="font-gaming text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-white/50 text-sm">{label}</div>
    </motion.div>
  )
}

// Empty State
export function EmptyState({ icon = '📭', title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-6xl mb-4 opacity-30">{icon}</div>
      <div className="font-display font-bold text-white/50 text-lg mb-2">{title}</div>
      {description && <p className="text-white/30 text-sm mb-6 max-w-xs">{description}</p>}
      {action}
    </div>
  )
}

// Loading Spinner
export function Spinner({ size = 'md', color = 'pink' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  const colors = { pink: 'border-neon-pink', blue: 'border-neon-blue', white: 'border-white' }
  return (
    <div className={`${sizes[size]} border-2 ${colors[color]} border-t-transparent rounded-full animate-spin`} />
  )
}

// Skeleton Loader
export function SkeletonCard() {
  return (
    <div className="gaming-card overflow-hidden">
      <div className="skeleton h-48 w-full" />
      <div className="p-4 space-y-3">
        <div className="skeleton h-4 rounded w-3/4" />
        <div className="skeleton h-3 rounded w-1/2" />
        <div className="flex gap-2">
          <div className="skeleton h-5 rounded w-16" />
          <div className="skeleton h-5 rounded w-16" />
        </div>
        <div className="skeleton h-8 rounded w-full" />
      </div>
    </div>
  )
}

// Modal
export function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className={`relative w-full ${sizes[size]} gaming-card border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto`}
      >
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <h3 className="font-gaming text-lg font-bold text-gradient">{title}</h3>
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors text-xl leading-none">×</button>
          </div>
        )}
        <div className={title ? 'p-6' : 'p-6'}>{children}</div>
      </motion.div>
    </div>
  )
}

// Pagination
export function Pagination({ page, pages, onPageChange }) {
  if (pages <= 1) return null
  const getPages = () => {
    const arr = []
    const delta = 2
    for (let i = Math.max(1, page - delta); i <= Math.min(pages, page + delta); i++) arr.push(i)
    return arr
  }
  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button onClick={() => onPageChange(page - 1)} disabled={page === 1} className="px-3 py-2 rounded-lg bg-dark-600 border border-white/10 text-white/60 hover:text-white hover:border-neon-pink/30 disabled:opacity-30 disabled:cursor-not-allowed text-sm transition-all">←</button>
      {page > 3 && <><button onClick={() => onPageChange(1)} className="px-3 py-2 rounded-lg bg-dark-600 border border-white/10 text-white/60 hover:text-white text-sm transition-all">1</button><span className="text-white/30">…</span></>}
      {getPages().map(p => (
        <button key={p} onClick={() => onPageChange(p)} className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${p === page ? 'bg-neon-pink/20 border-neon-pink/50 text-neon-pink' : 'bg-dark-600 border-white/10 text-white/60 hover:text-white'}`}>{p}</button>
      ))}
      {page < pages - 2 && <><span className="text-white/30">…</span><button onClick={() => onPageChange(pages)} className="px-3 py-2 rounded-lg bg-dark-600 border border-white/10 text-white/60 hover:text-white text-sm transition-all">{pages}</button></>}
      <button onClick={() => onPageChange(page + 1)} disabled={page === pages} className="px-3 py-2 rounded-lg bg-dark-600 border border-white/10 text-white/60 hover:text-white hover:border-neon-pink/30 disabled:opacity-30 disabled:cursor-not-allowed text-sm transition-all">→</button>
    </div>
  )
}