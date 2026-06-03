
export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '0đ'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

export const formatNumber = (n) => new Intl.NumberFormat('vi-VN').format(n || 0)

export const formatDate = (date) => {
  if (!date) return ''
  return new Intl.DateTimeFormat('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(date))
}

export const formatRelativeTime = (date) => {
  if (!date) return ''
  const diff = Date.now() - new Date(date)
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Vừa xong'
  if (mins < 60) return `${mins} phút trước`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} giờ trước`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} ngày trước`
  return formatDate(date)
}

export const getRarityColor = (rarity) => ({
  COMMON: '#9ca3af',
  RARE: '#60a5fa',
  EPIC: '#a78bfa',
  LEGENDARY: '#fbbf24',
  MYTHIC: '#f87171'
}[rarity] || '#9ca3af')

export const getRarityLabel = (rarity) => ({
  COMMON: 'Thường', RARE: 'Hiếm', EPIC: 'Sử Thi', LEGENDARY: 'Huyền Thoại', MYTHIC: 'Thần Thoại'
}[rarity] || rarity)

export const getRankColor = (rank) => {
  const colors = { 'Đồng': '#cd7f32', 'Bạc': '#c0c0c0', 'Vàng': '#ffd700', 'Bạch Kim': '#e5e4e2', 'Kim Cương': '#b9f2ff', 'Tinh Anh': '#ff6b6b', 'Đại Tinh Anh': '#ff2d73', 'Chinh Phục': '#ff2d73' }
  for (const [key, val] of Object.entries(colors)) if (rank?.includes(key)) return val
  return '#9ca3af'
}

export const truncate = (str, n = 50) => str?.length > n ? str.slice(0, n) + '...' : str

export const getInitials = (name) => name?.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase() || '??'

export const classNames = (...classes) => classes.filter(Boolean).join(' ')

export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))