import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { updateBalance, updateQuanHuy } from '../store/slices/authSlice'
import api from '../api/axios'
import { formatCurrency, getRarityColor } from '../utils/helpers'
import { RarityBadge, Spinner } from '../components/common/UIComponents'
import toast from 'react-hot-toast'
import {
  faRightToBracket,
  faMoneyBillWave,
  faRotate,
  faTrophy,
  faClockRotateLeft,
  faGift,
  faCircleCheck,
  faGem,
  faBolt,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

// ── Bảng màu gaming đậm cho từng ô ──────────────────────────────────
const SEGMENT_PALETTES = [
  { bg: ['#1a0533', '#3d0f6e'], border: '#c026d3', glow: '#e879f9' },  // violet
  { bg: ['#0d1f3c', '#1e3a6e'], border: '#2563eb', glow: '#60a5fa' },  // blue
  { bg: ['#1a0a00', '#4a1500'], border: '#ea580c', glow: '#fb923c' },  // orange
  { bg: ['#001a0d', '#003d1f'], border: '#16a34a', glow: '#4ade80' },  // green
  { bg: ['#1a0018', '#4a0042'], border: '#db2777', glow: '#f472b6' },  // pink
  { bg: ['#0a0a00', '#2a2800'], border: '#ca8a04', glow: '#fbbf24' },  // gold
  { bg: ['#001a1a', '#003d3d'], border: '#0891b2', glow: '#22d3ee' },  // cyan
  { bg: ['#0d0010', '#2a0035'], border: '#7c3aed', glow: '#a78bfa' },  // purple
  { bg: ['#1a0000', '#4a0000'], border: '#dc2626', glow: '#f87171' },  // red
  { bg: ['#001005', '#002512'], border: '#059669', glow: '#34d399' },  // emerald
]

const imgCache = {}
function loadImage(url) {
  if (imgCache[url]) return imgCache[url]
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.src = url
  imgCache[url] = img
  return img
}

export default function LuckyWheelPage() {
  const { user } = useSelector(s => s.auth)
  const dispatch = useDispatch()
  const canvasRef = useRef(null)
  const [wheel, setWheel] = useState(null)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [history, setHistory] = useState([])
  const [winners, setWinners] = useState([])
  const currentRotation = useRef(0)
  const animFrameRef = useRef(null)
  const drawWheelRef = useRef(null)

  useEffect(() => {
    api.get('/wheel').then(r => setWheel(r.data.data)).catch(() => {})
    api.get('/wheel/winners').then(r => setWinners(r.data.data || [])).catch(() => {})
    if (user) api.get('/wheel/history?limit=10').then(r => setHistory(r.data.data || [])).catch(() => {})
  }, [user])

  useEffect(() => {
    if (!wheel?.rewards) return
    const urls = wheel.rewards.map(r => r.imageUrl).filter(Boolean)
    if (urls.length === 0) { drawWheel(currentRotation.current); return }
    let loaded = 0
    const done = () => { loaded++; if (loaded === urls.length) drawWheel(currentRotation.current) }
    urls.forEach(url => {
      const img = loadImage(url)
      if (img.complete) done()
      else { img.onload = done; img.onerror = done }
    })
  }, [wheel])

  const drawWheel = (rot = 0) => {
    const canvas = canvasRef.current
    if (!canvas || !wheel?.rewards?.length) return
    const ctx = canvas.getContext('2d')
    const rewards = wheel.rewards
    const W = canvas.width, H = canvas.height
    const cx = W / 2, cy = H / 2
    const radius = Math.min(cx, cy) - 8
    const arc = (2 * Math.PI) / rewards.length
    const centerR = 54  // bán kính vùng center (cho nút quay)

    ctx.clearRect(0, 0, W, H)

    // ── Vẽ từng ô ───────────────────────────────────────────────────
    rewards.forEach((reward, i) => {
      const startAngle = rot + i * arc
      const endAngle = startAngle + arc
      const midAngle = startAngle + arc / 2
      const palette = SEGMENT_PALETTES[i % SEGMENT_PALETTES.length]

      // Gradient nền ô — đậm từ tâm ra mép
      const grad = ctx.createRadialGradient(cx, cy, centerR, cx, cy, radius)
      grad.addColorStop(0, palette.bg[0])
      grad.addColorStop(1, palette.bg[1])

      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, radius, startAngle, endAngle)
      ctx.closePath()
      ctx.fillStyle = grad
      ctx.fill()

      // Đường viền ô — màu neon của palette đó
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, radius, startAngle, endAngle)
      ctx.closePath()
      ctx.strokeStyle = palette.border + 'aa'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Dải sáng viền ngoài mỗi ô
      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, radius - 1, startAngle, endAngle)
      ctx.strokeStyle = palette.glow + '55'
      ctx.lineWidth = 4
      ctx.shadowColor = palette.glow
      ctx.shadowBlur = 12
      ctx.stroke()
      ctx.restore()

      // ── Nội dung (icon + text) ──────────────────────────────────
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(midAngle)

      const hasIcon = !!reward.imageUrl
      // FIX: tăng kích thước icon và chữ
      const iconSize = radius > 180 ? 46 : 38
      const textSize = radius > 160 ? 13 : 11
      const innerEdge = centerR + 8
      const outerEdge = radius - 12
      const span = outerEdge - innerEdge

      if (hasIcon) {
        const iconX = innerEdge + span * 0.65
        const textX = innerEdge + span * 0.28

        // FIX: vẽ ảnh thẳng không có viền tròn / clip
        const img = loadImage(reward.imageUrl)
        if (img.complete && img.naturalWidth > 0) {
          ctx.save()
          ctx.shadowColor = palette.glow
          ctx.shadowBlur = 16
          ctx.drawImage(img, iconX - iconSize / 2, -iconSize / 2, iconSize, iconSize)
          ctx.restore()
        }

        // Text
        ctx.save()
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.font = `bold ${textSize}px "Exo 2", sans-serif`
        ctx.fillStyle = '#ffffff'
        ctx.shadowColor = palette.glow
        ctx.shadowBlur = 10
        const name = reward.name.length > 10 ? reward.name.slice(0, 10) + '…' : reward.name
        ctx.fillText(name, textX, 0)
        ctx.restore()
      } else {
        const textX = innerEdge + span * 0.5
        ctx.save()
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.font = `bold ${textSize}px "Exo 2", sans-serif`
        ctx.fillStyle = '#ffffff'
        ctx.shadowColor = palette.glow
        ctx.shadowBlur = 10
        const name = reward.name.length > 12 ? reward.name.slice(0, 12) + '…' : reward.name
        ctx.fillText(name, textX, 0)
        ctx.restore()
      }

      ctx.restore()
    })

    // ── Vòng viền ngoài cùng — neon ──────────────────────────────────
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    const rimGrad = ctx.createLinearGradient(0, 0, W, H)
    rimGrad.addColorStop(0,   '#ff2d73')
    rimGrad.addColorStop(0.33,'#f59e0b')
    rimGrad.addColorStop(0.66,'#8b5cf6')
    rimGrad.addColorStop(1,   '#00d4ff')
    ctx.strokeStyle = rimGrad
    ctx.lineWidth = 4
    ctx.shadowColor = '#ff2d73'
    ctx.shadowBlur = 20
    ctx.stroke()
    ctx.restore()

    // ── Nút center (vẽ trên canvas, không phải HTML) ─────────────────
    // Outer ring nút
    ctx.save()
    const btnGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, centerR)
    btnGrad.addColorStop(0, '#1a0533')
    btnGrad.addColorStop(0.6, '#0d1020')
    btnGrad.addColorStop(1, '#050510')
    ctx.beginPath()
    ctx.arc(cx, cy, centerR, 0, Math.PI * 2)
    ctx.fillStyle = btnGrad
    ctx.shadowColor = '#7c3aed'
    ctx.shadowBlur = 30
    ctx.fill()

    // Vòng border nút
    const borderGrad = ctx.createLinearGradient(cx - centerR, cy, cx + centerR, cy)
    borderGrad.addColorStop(0, '#c026d3')
    borderGrad.addColorStop(0.5, '#7c3aed')
    borderGrad.addColorStop(1, '#2563eb')
    ctx.beginPath()
    ctx.arc(cx, cy, centerR, 0, Math.PI * 2)
    ctx.strokeStyle = borderGrad
    ctx.lineWidth = 3
    ctx.shadowColor = '#a855f7'
    ctx.shadowBlur = 25
    ctx.stroke()
    ctx.restore()
  }

  drawWheelRef.current = drawWheel

  const handleSpin = async () => {
    if (!user) { toast.error('Vui lòng đăng nhập'); return }
    if (spinning) return
    if (parseFloat(user.balance) < parseFloat(wheel.spinCost)) {
      toast.error('Số dư không đủ'); return
    }

    setSpinning(true)
    try {
      const { data } = await api.post('/wheel/spin')
      const { reward } = data.data
      const rewardIndex = data.data.rewardIndex ?? wheel.rewards.findIndex(r => r.id === reward.id)
      dispatch(updateBalance(data.data.newBalance))
      if (data.data.newQuanHuyBalance !== undefined) dispatch(updateQuanHuy(data.data.newQuanHuyBalance))

      const rewards = wheel.rewards
      const sectorAngle = (2 * Math.PI) / rewards.length
      const targetRot = -Math.PI / 2 - rewardIndex * sectorAngle - sectorAngle / 2
      const current = currentRotation.current
      const currentMod = ((current % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
      const targetMod = ((targetRot % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
      let delta = targetMod - currentMod
      if (delta <= 0) delta += 2 * Math.PI
      const finalRotation = current + (5 + Math.floor(Math.random() * 5)) * 2 * Math.PI + delta
      const duration = 5000
      const startTime = Date.now()
      const startRot = currentRotation.current
      const easeOut = t => 1 - Math.pow(1 - t, 4)

      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        const cur = startRot + (finalRotation - startRot) * easeOut(progress)
        currentRotation.current = cur
        drawWheelRef.current(cur)
        if (progress < 1) {
          animFrameRef.current = requestAnimationFrame(animate)
        } else {
          currentRotation.current = finalRotation
          setResult(reward)
          setShowResult(true)
          toast.success(`Chúc mừng! Bạn nhận được: ${reward.name}`)
          setHistory(prev => [{ id: Date.now(), rewardName: reward.name, rarity: reward.rarity, createdAt: new Date() }, ...prev.slice(0, 9)])
          setSpinning(false)
        }
      }
      animFrameRef.current = requestAnimationFrame(animate)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi quay')
      setSpinning(false)
    }
  }

  if (!wheel) return (
    <div className="pt-20 min-h-screen flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  )

  const canSpin = user && !spinning && parseFloat(user.balance) >= parseFloat(wheel.spinCost)

  return (
    <div className="pt-24 pb-20 min-h-screen overflow-hidden relative">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(124,58,237,0.15),transparent_40%),radial-gradient(circle_at_75%_60%,rgba(220,38,38,0.12),transparent_40%),linear-gradient(180deg,#050510,#080818)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
      {/* Scanline effect */}
      <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.15)_2px,rgba(0,0,0,0.15)_4px)] pointer-events-none" />

      <div className="page-container relative z-10">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-[2rem] border border-purple-500/20 bg-[#07071a]/80 shadow-[0_0_100px_rgba(124,58,237,0.2)] mb-10">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-950/50 via-[#07071a] to-red-950/30" />
          <div className="absolute -left-32 top-0 w-80 h-80 bg-purple-600/15 blur-[120px] rounded-full" />
          <div className="absolute -right-32 bottom-0 w-96 h-96 bg-red-600/10 blur-[120px] rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/5 blur-[160px] rounded-full pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1fr_500px] gap-8 items-center p-6 lg:p-10">
            {/* Left */}
            <div>
              <div className="text-purple-400 text-xs font-mono font-bold uppercase tracking-[0.4em] mb-5 flex items-center gap-3">
                <span className="w-8 h-px bg-purple-400" />
                LQ SHOP EXCLUSIVE
                <span className="w-8 h-px bg-purple-400" />
              </div>

              <h1 className="font-gaming leading-none mb-5">
                <span className="block text-5xl md:text-6xl lg:text-7xl font-black text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                  VÒNG QUAY
                </span>
                <span className="block text-5xl md:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 drop-shadow-[0_0_40px_rgba(168,85,247,0.6)]">
                  QUÂN HUY
                </span>
              </h1>

              {/* Tag line */}
              <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-yellow-500/30 bg-yellow-500/10 mb-7">
                <FontAwesomeIcon icon={faBolt} className="text-yellow-400 text-sm" />
                <span className="text-white font-bold text-sm tracking-wide">
                  QUAY LÀ TRÚNG — NHẬN <span className="text-yellow-400">QUÂN HUY</span> CỰC HOT
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 max-w-md mb-8">
                {[
                  { icon: faGem, title: 'Quân huy', desc: 'Giá trị cao', color: 'text-purple-400', glow: 'rgba(168,85,247,0.8)' },
                  { icon: faCircleCheck, title: '100%', desc: 'Có quà', color: 'text-green-400', glow: 'rgba(74,222,128,0.8)' },
                  { icon: faGift, title: 'Nhiều', desc: 'Phần thưởng', color: 'text-pink-400', glow: 'rgba(244,114,182,0.8)' },
                ].map((item, i) => (
                  <div key={i} className="rounded-xl border border-white/8 bg-white/[0.03] p-4 text-center">
                    <FontAwesomeIcon
                      icon={item.icon}
                      className={`text-2xl ${item.color} mb-2`}
                      style={{ filter: `drop-shadow(0 0 10px ${item.glow})` }}
                    />
                    <div className="font-gaming text-white text-sm font-bold uppercase">{item.title}</div>
                    <div className="text-white/40 text-xs mt-0.5">{item.desc}</div>
                  </div>
                ))}
              </div>

              {/* CTA đơn giản nếu chưa login / hết tiền */}
              {!user ? (
                <Link to="/login" className="btn-primary px-10 py-4 text-base inline-flex items-center gap-3">
                  <FontAwesomeIcon icon={faRightToBracket} />
                  Đăng Nhập Để Quay
                </Link>
              ) : parseFloat(user.balance) < parseFloat(wheel.spinCost) ? (
                <div className="flex items-center gap-4">
                  <div className="text-red-400 text-sm font-bold">Số dư không đủ để quay</div>
                  <Link to="/deposit" className="btn-primary px-6 py-2.5 text-sm inline-flex items-center gap-2">
                    <FontAwesomeIcon icon={faMoneyBillWave} />
                    Nạp tiền
                  </Link>
                </div>
              ) : null}

              {/* Chi phí quay */}
              {user && (
                <div className="mt-5 text-white/30 text-xs font-mono">
                  CHI PHÍ MỖI LƯỢT:{' '}
                  <span className="text-yellow-400 font-bold">{formatCurrency(wheel.spinCost)}</span>
                  {' '}· SỐ DƯ:{' '}
                  <span className="text-green-400 font-bold">{formatCurrency(user.balance)}</span>
                </div>
              )}
            </div>

            {/* Wheel */}
            <div className="relative flex items-center justify-center">
              {/* Glow nền */}
              <div className="absolute w-[480px] h-[480px] rounded-full bg-purple-600/10 blur-[80px] pointer-events-none" />
              <div className="absolute w-[360px] h-[360px] rounded-full bg-indigo-500/10 blur-[60px] pointer-events-none" />

              <div className="relative">
                {/* Pointer */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-5 z-30">
                  <div className="relative">
                    <div className="w-0 h-0 border-l-[16px] border-r-[16px] border-t-[30px] border-l-transparent border-r-transparent border-t-yellow-400 drop-shadow-[0_0_16px_rgba(250,204,21,1)]" />
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-yellow-400 rounded-full -translate-y-2 shadow-[0_0_12px_rgba(250,204,21,0.9)]" />
                  </div>
                </div>

                {/* Canvas */}
                {/* FIX: transition thay đổi theo spinning — khi dừng không còn repeat Infinity */}
                <motion.div
                  animate={spinning ? {
                    filter: [
                      'drop-shadow(0 0 20px #7c3aed)',
                      'drop-shadow(0 0 50px #c026d3)',
                      'drop-shadow(0 0 20px #7c3aed)',
                    ],
                  } : { filter: 'drop-shadow(0 0 8px #7c3aed66)' }}
                  transition={spinning
                    ? { duration: 0.8, repeat: Infinity }
                    : { duration: 0.6 }
                  }
                  className="relative z-10"
                >
                  <canvas
                    ref={canvasRef}
                    width={460}
                    height={460}
                    className="w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] lg:w-[460px] lg:h-[460px]"
                  />
                </motion.div>

                {/* Nút QUAY NGAY overlay lên center canvas */}
                <div className="absolute inset-0 flex items-center justify-center z-20">
                  {!user ? (
                    <Link
                      to="/login"
                      className="w-[108px] h-[108px] rounded-full flex flex-col items-center justify-center text-center cursor-pointer select-none"
                      style={{
                        background: 'radial-gradient(circle, #2d0060 0%, #0d0020 100%)',
                        border: '3px solid',
                        borderImage: 'linear-gradient(135deg, #c026d3, #7c3aed, #2563eb) 1',
                        borderRadius: '50%',
                        boxShadow: '0 0 30px rgba(124,58,237,0.6), inset 0 0 20px rgba(124,58,237,0.15)',
                      }}
                    >
                      <FontAwesomeIcon icon={faRightToBracket} className="text-purple-300 text-lg mb-0.5" />
                      <span className="font-gaming text-purple-300 font-black text-[9px] uppercase leading-tight">Đăng<br/>nhập</span>
                    </Link>
                  ) : (
                    <motion.button
                      onClick={handleSpin}
                      disabled={spinning || parseFloat(user.balance) < parseFloat(wheel.spinCost)}
                      whileHover={canSpin ? { scale: 1.08 } : {}}
                      whileTap={canSpin ? { scale: 0.92 } : {}}
                      className="w-[108px] h-[108px] rounded-full flex flex-col items-center justify-center text-center cursor-pointer select-none disabled:cursor-not-allowed"
                      style={{
                        background: spinning
                          ? 'radial-gradient(circle, #1a0030 0%, #080010 100%)'
                          : canSpin
                          ? 'radial-gradient(circle, #3d0080 0%, #1a0040 60%, #080018 100%)'
                          : 'radial-gradient(circle, #1a1a2e 0%, #0d0d1a 100%)',
                        border: '3px solid transparent',
                        backgroundClip: 'padding-box',
                        boxShadow: canSpin
                          ? '0 0 35px rgba(168,85,247,0.7), 0 0 60px rgba(168,85,247,0.3), inset 0 0 25px rgba(168,85,247,0.15)'
                          : '0 0 15px rgba(100,100,120,0.3)',
                        outline: canSpin ? '3px solid' : '3px solid #333',
                        outlineColor: canSpin ? 'transparent' : '#333',
                        position: 'relative',
                      }}
                    >
                      {/* Gradient border trick */}
                      {canSpin && (
                        <div
                          className="absolute inset-0 rounded-full pointer-events-none"
                          style={{
                            padding: '3px',
                            background: 'linear-gradient(135deg, #c026d3, #7c3aed, #2563eb, #c026d3)',
                            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                            WebkitMaskComposite: 'xor',
                            maskComposite: 'exclude',
                          }}
                        />
                      )}
                      {spinning ? (
                        <>
                          <Spinner size="sm" color="white" />
                          <span className="font-gaming text-purple-300 font-black text-[9px] uppercase mt-1 leading-tight">Đang<br/>quay...</span>
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon
                            icon={faRotate}
                            className="text-xl mb-0.5"
                            style={{ color: canSpin ? '#e879f9' : '#555', filter: canSpin ? 'drop-shadow(0 0 8px #c026d3)' : 'none' }}
                          />
                          <span
                            className="font-gaming font-black text-[10px] uppercase leading-tight"
                            style={{ color: canSpin ? '#f0abfc' : '#555' }}
                          >
                            QUAY<br/>NGAY
                          </span>
                        </>
                      )}
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lower panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bảng phần thưởng */}
          <div className="gaming-card p-5 lg:col-span-2">
            <h3 className="font-gaming text-sm font-bold text-gradient mb-4 uppercase">
              <FontAwesomeIcon icon={faGift} className="mr-2" />
              Bảng Phần Thưởng
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[...wheel.rewards]
                .sort((a, b) => parseFloat(b.value) - parseFloat(a.value))
                .map(r => (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.035] border border-white/[0.06] hover:bg-white/[0.06] transition-colors">
                    <div className="flex items-center gap-2">
                      {r.imageUrl ? (
                        <img src={r.imageUrl} alt={r.name} className="w-6 h-6 rounded-full object-cover flex-shrink-0 ring-1 ring-white/20" />
                      ) : (
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ background: r.color || getRarityColor(r.rarity), boxShadow: `0 0 8px ${r.color || getRarityColor(r.rarity)}` }}
                        />
                      )}
                      <span className="text-white/80 text-xs">{r.name}</span>
                    </div>
                    <RarityBadge rarity={r.rarity} size="xs" />
                  </div>
                ))}
            </div>
          </div>

          <div className="space-y-5">
            {/* Winners */}
            <div className="gaming-card p-5">
              <h3 className="font-gaming text-sm font-bold text-gradient mb-4 uppercase">
                <FontAwesomeIcon icon={faTrophy} className="mr-2" />
                Người Thắng Gần Đây
              </h3>
              {winners.length === 0 ? (
                <p className="text-white/30 text-xs text-center py-4">Chưa có người thắng</p>
              ) : (
                <div className="space-y-2">
                  {winners.slice(0, 5).map((w) => (
                    <div key={w.id} className="flex items-center gap-2">
                      <img
                        src={w.user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${w.user?.username}`}
                        alt="" className="w-7 h-7 rounded-full border border-purple-500/30"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-xs font-medium truncate">{w.user?.displayName || w.user?.username}</div>
                        <div className="text-white/40 text-[10px] truncate">{w.rewardName}</div>
                      </div>
                      <RarityBadge rarity={w.rarity} size="xs" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* History */}
            {user && history.length > 0 && (
              <div className="gaming-card p-5">
                <h3 className="font-gaming text-sm font-bold text-gradient mb-4 uppercase">
                  <FontAwesomeIcon icon={faClockRotateLeft} className="mr-2" />
                  Lịch Sử Của Bạn
                </h3>
                <div className="space-y-2">
                  {history.slice(0, 5).map((h, i) => (
                    <div key={i} className="flex items-center justify-between py-1 border-b border-white/5">
                      <span className="text-white/60 text-xs truncate flex-1">{h.rewardName}</span>
                      <RarityBadge rarity={h.rarity} size="xs" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Result Modal — MYTHIC */}
      <AnimatePresence>
        {showResult && result && result.rarity === 'MYTHIC' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
            {/* Backdrop cực kỳ hoành tráng */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
              style={{ background: 'radial-gradient(ellipse at center, rgba(255,60,0,0.35) 0%, rgba(255,165,0,0.2) 30%, rgba(0,0,0,0.96) 70%)' }}
              onClick={() => setShowResult(false)}
            />

            {/* Tia sáng nổ toả ra */}
            {[...Array(16)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute top-1/2 left-1/2 origin-left pointer-events-none"
                style={{ rotate: `${i * 22.5}deg`, translateX: '-50%', translateY: '-50%' }}
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: [0, 1, 1.5, 0], opacity: [0, 0.9, 0.7, 0] }}
                transition={{ duration: 1.2, delay: 0.1 + i * 0.03, ease: 'easeOut' }}
              >
                <div
                  className="h-[3px] rounded-full"
                  style={{
                    width: `${180 + (i % 3) * 60}px`,
                    background: `linear-gradient(to right, rgba(255,${100 + i * 10},0,1), transparent)`,
                    boxShadow: `0 0 12px rgba(255,150,0,0.8)`,
                  }}
                />
              </motion.div>
            ))}

            {/* Particles bùng nổ */}
            {[...Array(24)].map((_, i) => {
              const angle = (i / 24) * 2 * Math.PI
              const dist = 120 + Math.random() * 180
              return (
                <motion.div
                  key={`p${i}`}
                  className="absolute top-1/2 left-1/2 pointer-events-none rounded-full"
                  style={{ width: 6 + Math.random() * 10, height: 6 + Math.random() * 10, background: ['#ff6600','#ffaa00','#ff0066','#ffdd00','#ff3300'][i % 5] }}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, opacity: 0, scale: 0.2 }}
                  transition={{ duration: 1.4, delay: 0.15 + Math.random() * 0.3, ease: 'easeOut' }}
                />
              )
            })}

            {/* Card nội dung */}
            <motion.div
              initial={{ scale: 0.2, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.15 }}
              className="relative z-10 text-center max-w-sm w-full overflow-hidden"
              style={{
                background: 'linear-gradient(145deg, #1a0000 0%, #2d0500 40%, #1a0800 100%)',
                border: '2px solid',
                borderColor: '#ff6600',
                borderRadius: '1.5rem',
                boxShadow: '0 0 60px rgba(255,100,0,0.7), 0 0 120px rgba(255,60,0,0.4), 0 0 200px rgba(255,30,0,0.2)',
                padding: '2.5rem',
              }}
            >
              {/* Lớp nền glow bên trong */}
              <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(255,80,0,0.25), transparent 70%)' }} />

              {/* Chữ NỔ HŨ */}
              <motion.div
                initial={{ y: -60, opacity: 0, scale: 0.5 }}
                animate={{ y: 0, opacity: 1, scale: [0.5, 1.3, 1] }}
                transition={{ duration: 0.7, delay: 0.3, type: 'spring', stiffness: 300 }}
                className="relative mb-3"
              >
                <div
                  className="inline-block font-black text-5xl tracking-widest"
                  style={{
                    background: 'linear-gradient(135deg, #ff6600, #ffdd00, #ff3300, #ffaa00)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 0 20px rgba(255,150,0,1)) drop-shadow(0 0 40px rgba(255,80,0,0.8))',
                    textShadow: 'none',
                    fontFamily: '"Exo 2", sans-serif',
                  }}
                >
                  💥 NỔ HŨ 💥
                </div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  className="text-base font-bold tracking-[0.4em] uppercase mt-1"
                  style={{ color: '#ffdd00', textShadow: '0 0 15px rgba(255,220,0,0.9)' }}
                >
                  ✦ BÙNG LÊN ✦
                </motion.div>
              </motion.div>

              {/* Avatar */}
              <motion.div
                animate={{ scale: [1, 1.1, 1], rotate: [0, 3, -3, 0] }}
                transition={{ duration: 1.2, repeat: 2 }}
                className="mb-4 relative inline-block"
              >
                <div className="absolute inset-0 rounded-full animate-ping" style={{ background: 'rgba(255,100,0,0.3)', animationDuration: '1s' }} />
                {result.imageUrl ? (
                  <img src={result.imageUrl} alt={result.name} className="w-32 h-32 rounded-full object-cover mx-auto relative z-10" style={{ border: '4px solid #ff6600', boxShadow: '0 0 40px rgba(255,100,0,0.9), 0 0 80px rgba(255,60,0,0.5)' }} />
                ) : (
                  <div className="text-7xl relative z-10" style={{ filter: 'drop-shadow(0 0 25px #ff6600)' }}>
                    <FontAwesomeIcon icon={faGift} style={{ color: '#ff6600' }} />
                  </div>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="font-gaming text-3xl font-black text-white mb-1" style={{ textShadow: '0 0 20px rgba(255,255,255,0.5)' }}>CHÚC MỪNG!</div>
                <div className="text-white/50 text-sm mb-3">Bạn vừa trúng phần thưởng</div>
                <div
                  className="font-gaming text-2xl font-black mb-4"
                  style={{ background: 'linear-gradient(135deg, #ff6600, #ffdd00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 0 15px rgba(255,150,0,0.9))' }}
                >
                  {result.name}
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-6"
                  style={{ background: 'linear-gradient(135deg, rgba(255,60,0,0.4), rgba(255,150,0,0.3))', border: '1px solid rgba(255,120,0,0.6)', color: '#ffaa00' }}>
                  ⚡ THẦN THOẠI ⚡
                </div>
                <button onClick={() => setShowResult(false)} className="w-full py-3.5 rounded-xl font-gaming font-black text-base tracking-wider transition-all hover:brightness-110 active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #ff4400, #ff8800, #ff4400)', boxShadow: '0 0 30px rgba(255,80,0,0.6)', color: '#fff' }}>
                  <FontAwesomeIcon icon={faCircleCheck} className="mr-2" />
                  XÁC NHẬN!
                </button>
              </motion.div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Result Modal — LEGENDARY */}
      <AnimatePresence>
        {showResult && result && result.rarity === 'LEGENDARY' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
              style={{ background: 'radial-gradient(ellipse at center, rgba(200,160,0,0.3) 0%, rgba(120,80,0,0.2) 40%, rgba(0,0,0,0.95) 70%)' }}
              onClick={() => setShowResult(false)}
            />

            {/* Tia sáng vàng */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute top-1/2 left-1/2 origin-left pointer-events-none"
                style={{ rotate: `${i * 30}deg`, translateX: '-50%', translateY: '-50%' }}
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: [0, 1, 1.3, 0], opacity: [0, 1, 0.6, 0] }}
                transition={{ duration: 1.0, delay: 0.1 + i * 0.04, ease: 'easeOut' }}
              >
                <div
                  className="h-[2px] rounded-full"
                  style={{
                    width: `${140 + (i % 3) * 50}px`,
                    background: `linear-gradient(to right, rgba(255,215,0,1), transparent)`,
                    boxShadow: `0 0 10px rgba(255,200,0,0.8)`,
                  }}
                />
              </motion.div>
            ))}

            {/* Particles vàng */}
            {[...Array(18)].map((_, i) => {
              const angle = (i / 18) * 2 * Math.PI
              const dist = 100 + Math.random() * 140
              return (
                <motion.div
                  key={`lp${i}`}
                  className="absolute top-1/2 left-1/2 pointer-events-none rounded-full"
                  style={{ width: 5 + Math.random() * 8, height: 5 + Math.random() * 8, background: ['#ffd700','#ffb700','#fff176','#ffa500','#ffe066'][i % 5] }}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, opacity: 0, scale: 0.2 }}
                  transition={{ duration: 1.2, delay: 0.1 + Math.random() * 0.3, ease: 'easeOut' }}
                />
              )
            })}

            {/* Card */}
            <motion.div
              initial={{ scale: 0.3, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 20, delay: 0.1 }}
              className="relative z-10 text-center max-w-sm w-full overflow-hidden"
              style={{
                background: 'linear-gradient(145deg, #0d0800 0%, #1f1200 40%, #120900 100%)',
                border: '2px solid #ffd700',
                borderRadius: '1.5rem',
                boxShadow: '0 0 50px rgba(255,200,0,0.6), 0 0 100px rgba(255,160,0,0.3)',
                padding: '2.5rem',
              }}
            >
              <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 20%, rgba(255,180,0,0.2), transparent 65%)' }} />

              {/* Header huyền thoại */}
              <motion.div
                initial={{ y: -40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.25, type: 'spring', stiffness: 300 }}
                className="mb-4"
              >
                <motion.div
                  animate={{ textShadow: ['0 0 20px rgba(255,200,0,0.8)', '0 0 40px rgba(255,200,0,1)', '0 0 20px rgba(255,200,0,0.8)'] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="text-4xl font-black tracking-widest font-gaming"
                  style={{
                    background: 'linear-gradient(135deg, #ffe066, #ffd700, #ffb700, #ffe066)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  ✨ HUYỀN THOẠI ✨
                </motion.div>
              </motion.div>

              {/* Avatar */}
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 1.5, repeat: 2 }}
                className="mb-4 relative inline-block"
              >
                <div className="absolute -inset-2 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,200,0,0.4), transparent 70%)', filter: 'blur(8px)' }} />
                {result.imageUrl ? (
                  <img src={result.imageUrl} alt={result.name} className="w-28 h-28 rounded-full object-cover mx-auto relative z-10" style={{ border: '4px solid #ffd700', boxShadow: '0 0 30px rgba(255,200,0,0.8), 0 0 60px rgba(255,160,0,0.4)' }} />
                ) : (
                  <div className="text-6xl relative z-10" style={{ filter: 'drop-shadow(0 0 20px #ffd700)' }}>
                    <FontAwesomeIcon icon={faGift} style={{ color: '#ffd700' }} />
                  </div>
                )}
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
                <div className="font-gaming text-2xl font-black text-white mb-1" style={{ textShadow: '0 0 15px rgba(255,255,255,0.4)' }}>CHÚC MỪNG!</div>
                <div className="text-white/50 text-sm mb-3">Bạn đã nhận được</div>
                <div
                  className="font-gaming text-2xl font-black mb-5"
                  style={{ background: 'linear-gradient(135deg, #ffe066, #ffd700)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 0 12px rgba(255,200,0,0.9))' }}
                >
                  {result.name}
                </div>
                <button onClick={() => setShowResult(false)} className="w-full py-3.5 rounded-xl font-gaming font-black text-base tracking-wider transition-all hover:brightness-110 active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #c8920a, #ffd700, #c8920a)', boxShadow: '0 0 25px rgba(255,200,0,0.5)', color: '#1a0800' }}>
                  <FontAwesomeIcon icon={faCircleCheck} className="mr-2" />
                  TUYỆT VỜI!
                </button>
              </motion.div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Result Modal — Bình thường (COMMON / RARE / EPIC) */}
      <AnimatePresence>
        {showResult && result && result.rarity !== 'LEGENDARY' && result.rarity !== 'MYTHIC' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
              onClick={() => setShowResult(false)}
            />
            <motion.div
              initial={{ scale: 0.4, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              className="relative gaming-card p-10 text-center max-w-sm w-full z-10 overflow-hidden"
              style={{
                borderColor: getRarityColor(result.rarity) + '70',
                boxShadow: `0 0 80px ${getRarityColor(result.rarity)}50, 0 0 140px ${getRarityColor(result.rarity)}20`,
              }}
            >
              <div className="absolute inset-0 opacity-15" style={{ background: `radial-gradient(circle at center, ${getRarityColor(result.rarity)}, transparent 70%)` }} />
              <motion.div
                animate={{ scale: [1, 1.15, 1], rotate: [0, 8, -8, 0] }}
                transition={{ duration: 0.7 }}
                className="mb-5"
              >
                {result.imageUrl ? (
                  <img src={result.imageUrl} alt={result.name} className="w-28 h-28 rounded-full object-cover mx-auto border-4 shadow-2xl" style={{ borderColor: getRarityColor(result.rarity) }} />
                ) : (
                  <div className="text-7xl" style={{ color: getRarityColor(result.rarity), filter: `drop-shadow(0 0 20px ${getRarityColor(result.rarity)})` }}>
                    <FontAwesomeIcon icon={faGift} />
                  </div>
                )}
              </motion.div>
              <div className="font-gaming text-2xl font-black text-white mb-1">CHÚC MỪNG!</div>
              <div className="text-white/50 text-sm mb-4">Bạn nhận được</div>
              <div className="font-gaming text-2xl font-black mb-4" style={{ color: getRarityColor(result.rarity), textShadow: `0 0 25px ${getRarityColor(result.rarity)}` }}>
                {result.name}
              </div>
              <RarityBadge rarity={result.rarity} size="md" />
              <button onClick={() => setShowResult(false)} className="mt-8 btn-primary px-8 py-3 w-full font-gaming font-black tracking-wider">
                <FontAwesomeIcon icon={faCircleCheck} className="mr-2" />
                TUYỆT VỜI!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}