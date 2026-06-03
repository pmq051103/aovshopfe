import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { updateBalance } from '../store/slices/authSlice'
import api from '../api/axios'
import { formatCurrency, getRarityColor, getRarityLabel } from '../utils/helpers'
import { SectionHeader, RarityBadge, Spinner } from '../components/common/UIComponents'
import toast from 'react-hot-toast'
import {
  faBoxOpen,
  faRightToBracket,
  faGem,
  faMoneyBillWave,
  faGift,
  faClockRotateLeft,
  faCircleCheck,
  faWandMagicSparkles
} from '@fortawesome/free-solid-svg-icons'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

function BoxCard({ box, onOpen, opening }) {
  const [flipped, setFlipped] = useState(false)
  return (
    <motion.div whileHover={{ y: -8 }} className="gaming-card overflow-hidden group">
      {/* Box Image */}
      <div className="relative h-52 overflow-hidden bg-gradient-to-br from-dark-700 to-dark-800">
        <motion.div
          animate={flipped ? { rotateY: 360, scale: [1, 1.08, 1] } : {}}
          transition={{ duration: 0.8 }}
          className="relative w-full h-full"
        >
          <img
            src={box.imageUrl}
            alt={box.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={e => {
              e.target.style.display = 'none'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-transparent to-transparent group-hover:from-purple-500/10 transition-all duration-500 rounded-xl" />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900/70 to-transparent" />
        <div className="absolute bottom-2 right-2 text-xs font-mono bg-dark-900/80 border border-white/10 px-2 py-0.5 rounded text-white/50">
          {box.openCount} lần mở
        </div>
      </div>

      <div className="p-5">
        <h3 className="font-gaming text-xl font-bold text-white mb-1">{box.name}</h3>
        <p className="text-white/50 text-xs mb-4 line-clamp-2">{box.description}</p>

        {/* Reward Preview */}
        <div className="mb-4">
          <div className="text-xs text-white/30 uppercase tracking-wider font-display mb-2"><FontAwesomeIcon icon={faWandMagicSparkles} className="mr-2" />Có thể nhận được:</div>
          <div className="flex flex-wrap gap-1">
            {box.rewards?.sort((a, b) => parseFloat(b.probability) - parseFloat(a.probability)).slice(0, 4).map(r => (
              <span key={r.id} className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: getRarityColor(r.rarity), background: `${getRarityColor(r.rarity)}18`, border: `1px solid ${getRarityColor(r.rarity)}30` }}>
                {r.name}
              </span>
            ))}
          </div>
        </div>

        {/* Price & Button */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white/30 text-xs">Giá mở hộp</div>
            <div className="font-gaming text-xl font-bold text-neon-pink">{formatCurrency(box.price)}</div>
          </div>
          <motion.button
            onClick={() => { setFlipped(true); setTimeout(() => { setFlipped(false); onOpen(box) }, 400) }}
            disabled={opening}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-primary px-5 py-2.5 text-sm disabled:opacity-50"
          >
            {opening ? <Spinner size="sm" color="white" /> : <><FontAwesomeIcon icon={faBoxOpen} className="mr-2" /> Mở Hộp</>}
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

export default function MysteryBoxPage() {
  const { user } = useSelector(s => s.auth)
  const dispatch = useDispatch()
  const [boxes, setBoxes] = useState([])
  const [opening, setOpening] = useState(null)
  const [result, setResult] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [history, setHistory] = useState([])

  useEffect(() => {
    api.get('/mystery-box').then(r => setBoxes(r.data.data || [])).catch(() => { })
    if (user) api.get('/mystery-box/history?limit=10').then(r => setHistory(r.data.data || [])).catch(() => { })
  }, [user])

  const handleOpen = async (box) => {
    if (!user) { toast.error('Vui lòng đăng nhập'); return }
    if (parseFloat(user.balance) < parseFloat(box.price)) {
      toast.error('Số dư không đủ'); return
    }
    setOpening(box.id)
    try {
      const { data } = await api.post(`/mystery-box/${box.id}/open`)
      dispatch(updateBalance(data.data.newBalance))
      setResult({ ...data.data.reward, boxName: data.data.box.name })
      setShowResult(true)
      setHistory(prev => [{ id: Date.now(), rewardName: data.data.reward.name, rarity: data.data.reward.rarity, box: { name: box.name }, createdAt: new Date() }, ...prev.slice(0, 9)])
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi mở hộp')
    } finally {
      setOpening(null)
    }
  }

  return (
    <div className="pt-20 pb-20 min-h-screen">
      <div className="page-container">
        <SectionHeader
          title={
            <>
              <FontAwesomeIcon icon={faBoxOpen} className="mr-3" />
              Túi Mù
            </>
          } subtitle="Mở hộp — Nhận phần thưởng siêu hiếm không ngờ tới!" />

        {!user && (
          <div className="text-center mb-10">
            <div className="gaming-card inline-block p-6 border-neon-purple/30">
              <p className="text-white/60 mb-3">Đăng nhập để mở túi mù</p>
              <Link to="/login" className="btn-primary px-8 py-2.5 text-sm"><FontAwesomeIcon icon={faRightToBracket} className="mr-2" /> Đăng Nhập</Link>
            </div>
          </div>
        )}

        {user && (
          <div className="flex justify-center mb-8">
            <div className="gaming-card px-6 py-3 border-yellow-500/20 flex items-center gap-4">
              <FontAwesomeIcon icon={faGem} className="text-2xl text-yellow-400" />
              <div>
                <div className="text-white/40 text-xs">Số dư</div>
                <div className="font-gaming text-xl font-bold text-yellow-400">{formatCurrency(user.balance)}</div>
              </div>
              <Link to="/deposit" className="btn-neon border-yellow-500/30 text-yellow-400 text-xs px-4 py-1.5"><FontAwesomeIcon icon={faMoneyBillWave} className="mr-1" /> Nạp</Link>
            </div>
          </div>
        )}

        {/* Boxes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {boxes.map((box, i) => (
            <motion.div key={box.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <BoxCard box={box} onOpen={handleOpen} opening={opening === box.id} />
            </motion.div>
          ))}
        </div>

        {/* Rarity Guide */}
        <div className="gaming-card p-6 mb-8">
          <h3 className="font-gaming text-sm font-bold text-gradient mb-4 uppercase">Hướng Dẫn Độ Hiếm</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {['COMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC'].map(r => (
              <div key={r} className="text-center p-3 rounded-lg" style={{ background: `${getRarityColor(r)}10`, border: `1px solid ${getRarityColor(r)}30` }}>
                <div className="font-bold text-sm mb-1" style={{ color: getRarityColor(r) }}>{getRarityLabel(r)}</div>
                <div className="text-white/30 text-xs">
                  {r === 'COMMON' ? '40%' : r === 'RARE' ? '30%' : r === 'EPIC' ? '18%' : r === 'LEGENDARY' ? '10%' : '2%'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* History */}
        {user && history.length > 0 && (
          <div className="gaming-card p-6">
            <h3 className="font-gaming text-sm font-bold text-gradient mb-4 uppercase"><FontAwesomeIcon icon={faClockRotateLeft} className="mr-2" />Lịch Sử Mở Hộp</h3>
            <div className="space-y-2">
              {history.map((h, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <FontAwesomeIcon icon={faBoxOpen} className="text-xl" />
                    <div>
                      <div className="text-white text-sm font-medium">{h.rewardName}</div>
                      <div className="text-white/30 text-xs">{h.box?.name}</div>
                    </div>
                  </div>
                  <RarityBadge rarity={h.rarity} size="sm" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Result Modal */}
      <AnimatePresence>
        {showResult && result && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={() => setShowResult(false)} />
            <motion.div
              initial={{ scale: 0.3, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 250, damping: 18 }}
              className="relative gaming-card p-10 text-center max-w-sm w-full z-10"
              style={{ borderColor: `${getRarityColor(result.rarity)}60`, boxShadow: `0 0 80px ${getRarityColor(result.rarity)}40, 0 0 160px ${getRarityColor(result.rarity)}20` }}
            >
              {/* Particles */}
              {[...Array(8)].map((_, i) => (
                <motion.div key={i} className="absolute w-2 h-2 rounded-full" style={{ background: getRarityColor(result.rarity), left: `${10 + i * 11}%`, top: '20%' }}
                  animate={{ y: [-20, -60, -20], opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }} />
              ))}

              <motion.div animate={{ rotateY: [0, 360] }} transition={{ duration: 1, delay: 0.3 }} className="text-7xl mb-4">
                <FontAwesomeIcon icon={faBoxOpen} />
              </motion.div>
              <div className="font-gaming text-2xl font-black text-white mb-1">HỘP MỞ RỒI!</div>
              <div className="text-white/50 text-sm mb-2">Từ {result.boxName}</div>
              <div className="text-white/60 text-sm mb-4">Bạn nhận được</div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
                className="font-gaming text-3xl font-black mb-4"
                style={{ color: getRarityColor(result.rarity), textShadow: `0 0 30px ${getRarityColor(result.rarity)}` }}
              >
                {result.name}
              </motion.div>
              <RarityBadge rarity={result.rarity} size="md" />
              {result.description && <p className="text-white/40 text-xs mt-3">{result.description}</p>}
              <button onClick={() => setShowResult(false)} className="mt-8 btn-primary px-8 py-3 w-full">Tuyệt Vời! <FontAwesomeIcon icon={faCircleCheck} className="ml-2" /></button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}