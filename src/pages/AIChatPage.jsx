import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faRobot, faPlus, faTrash, faBars, faXmark, faPaperPlane,
  faSpinner, faGamepad, faChevronRight, faMoneyBillWave,
  faBoxOpen, faDice, faTrophy, faCreditCard, faShoppingCart,
  faCircleCheck, faCircleXmark, faHourglassHalf, faEllipsisV,
  faPen, faArrowLeft, faMagnifyingGlass,
} from '@fortawesome/free-solid-svg-icons'
import {
  fetchSessions, createSession, loadSession, deleteSession,
  sendMessage, addOptimisticUserMessage, updateSessionTitle,
} from '../store/slices/chatSlice'
import toast from 'react-hot-toast'

const fmt = (n) => {
  const num = Number(n || 0)
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num)
}

const fmtDate = (d) => {
  if (!d) return ''
  return new Date(d).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function AccCard({ acc, onView }) {
  const fbColor = { LIVE: 'text-blue-400', RIP: 'text-red-400', NONE: 'text-white/30' }
  const fbLabel = { LIVE: 'FB Sống', RIP: 'FB RIP', NONE: 'Không FB' }
  const canView = acc?.canViewDetail !== false

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 bg-dark-700 border rounded-xl p-3 group transition-all ${
        canView
          ? 'cursor-pointer border-white/5 hover:border-neon-pink/30'
          : 'cursor-default border-yellow-500/20'
      }`}
      onClick={() => {
        if (canView && acc?.id) onView(acc.id)
      }}
    >
      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-dark-500">
        {acc.thumbnailUrl ? (
          <img src={acc.thumbnailUrl} alt={acc.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neon-pink text-xl">
            <FontAwesomeIcon icon={faGamepad} />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-white text-sm font-semibold truncate ${canView ? 'group-hover:text-neon-pink' : ''} transition-colors`}>
          {acc.title || acc.code || 'Tài khoản'}
        </p>

        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {acc.rank && <span className="text-xs text-neon-purple">{acc.rank}</span>}

          {Number.isFinite(Number(acc.skins)) && (
            <>
              <span className="text-white/20">·</span>
              <span className="text-xs text-white/50">{acc.skins} skin</span>
            </>
          )}

          {Number.isFinite(Number(acc.champions)) && (
            <>
              <span className="text-white/20">·</span>
              <span className="text-xs text-white/50">{acc.champions} tướng</span>
            </>
          )}

          {acc.gameBindFacebook && (
            <>
              <span className="text-white/20">·</span>
              <span className={`text-xs ${fbColor[acc.gameBindFacebook] || 'text-white/30'}`}>
                {fbLabel[acc.gameBindFacebook] || acc.gameBindFacebook}
              </span>
            </>
          )}

          {!canView && (
            <>
              <span className="text-white/20">·</span>
              <span className="text-xs text-yellow-400">Không còn bán trên shop</span>
            </>
          )}
        </div>

        <p className="text-neon-pink font-bold text-sm mt-1">{fmt(acc.price)}</p>
      </div>

      {canView && (
        <div className="flex-shrink-0 self-center text-white/20 group-hover:text-neon-pink transition-colors">
          <FontAwesomeIcon icon={faChevronRight} />
        </div>
      )}
    </motion.div>
  )
}

function AccountDetailCard({ account }) {
  if (!account) return null

  if (account.error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl p-3 text-sm">
        {account.error}
      </div>
    )
  }

  if (account.type === 'MYSTERY_BOX_ACCOUNT') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-dark-700 border border-neon-purple/20 rounded-xl p-4"
      >
        <div className="flex gap-3">
          {account.thumbnailUrl ? (
            <img src={account.thumbnailUrl} alt="" className="w-16 h-16 rounded-lg object-cover bg-dark-500" />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-dark-500 flex items-center justify-center text-2xl">🎁</div>
          )}

          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm truncate">
              {account.code || account.title || 'Acc túi mù'}
            </p>
            <p className="text-neon-purple text-xs mt-1">
              {account.categoryName || 'Túi mù'}
            </p>
            <p className="text-neon-pink text-sm font-bold mt-1">
              {fmt(account.price)}
            </p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-white/5 space-y-2 text-xs">
          {account.gameUsername || account.gamePassword || account.gameBindInfo ? (
            <div className="rounded-lg bg-dark-600 border border-white/5 p-3 space-y-1.5">
              <p className="text-white/50 font-semibold mb-1.5">Thông tin đăng nhập</p>
              {account.gameUsername && (
                <p className="text-white/60">
                  Tài khoản: <span className="text-white font-semibold ml-1">{account.gameUsername}</span>
                </p>
              )}
              {account.gamePassword && (
                <p className="text-white/60">
                  Mật khẩu: <span className="text-white font-semibold ml-1">{account.gamePassword}</span>
                </p>
              )}
              {account.gameBindInfo && (
                <p className="text-white/60">
                  Bind: <span className="text-white font-semibold ml-1">{account.gameBindInfo}</span>
                </p>
              )}
            </div>
          ) : (
            <p className="text-white/30 text-center py-2">
              Chỉ chủ sở hữu mới xem được thông tin đăng nhập
            </p>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <AccCard
      acc={account}
      onView={() => {}}
    />
  )
}

function MysteryBoxCard({ box, onView }) {
  const rarityColor = {
    COMMON: 'text-white/50',
    RARE: 'text-blue-400',
    EPIC: 'text-neon-purple',
    LEGENDARY: 'text-yellow-400',
    MYTHIC: 'text-pink-400',
  }

  const rarityLabel = {
    COMMON: 'Thường',
    RARE: 'Hiếm',
    EPIC: 'Sử Thi',
    LEGENDARY: 'Huyền Thoại',
    MYTHIC: 'Thần Thoại',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 bg-dark-700 border border-white/5 hover:border-neon-purple/40 rounded-xl p-3 cursor-pointer group transition-all"
      onClick={() => onView(box.slug)}
    >
      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-dark-500">
        {box.thumbnail ? (
          <img src={box.thumbnail} alt={box.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">🎁</div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold truncate group-hover:text-neon-purple transition-colors">
          {box.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-xs ${rarityColor[box.rarity] || 'text-white/40'}`}>
            {rarityLabel[box.rarity] || box.rarity}
          </span>
          <span className="text-white/20">·</span>
          <span className="text-xs text-white/50">{box.availableCount} còn</span>
        </div>
        <p className="text-neon-purple font-bold text-sm mt-1">{fmt(box.price)}</p>
      </div>
    </motion.div>
  )
}

function DepositList({ deposits }) {
  const statusCfg = {
    COMPLETED: { icon: faCircleCheck, color: 'text-green-400', label: 'Hoàn thành' },
    PENDING: { icon: faHourglassHalf, color: 'text-yellow-400', label: 'Đang chờ' },
    FAILED: { icon: faCircleXmark, color: 'text-red-400', label: 'Thất bại' },
    EXPIRED: { icon: faCircleXmark, color: 'text-white/30', label: 'Hết hạn' },
  }

  if (!deposits.length) {
    return (
      <div className="bg-dark-700 border border-white/5 rounded-xl p-4 text-center text-white/40 text-sm">
        Không có giao dịch nào
      </div>
    )
  }

  return (
    <div className="bg-dark-700 border border-white/5 rounded-xl overflow-hidden">
      <div className="px-3 py-2 border-b border-white/5 flex items-center gap-2">
        <FontAwesomeIcon icon={faMoneyBillWave} className="text-green-400 text-sm" />
        <span className="text-white/60 text-xs font-semibold">Lịch sử nạp tiền</span>
      </div>

      {deposits.map((d, i) => {
        const cfg = statusCfg[d.status] || statusCfg.FAILED

        return (
          <div key={d.id || i} className="flex items-center gap-3 px-3 py-2.5 border-b border-white/[0.04] last:border-0">
            <FontAwesomeIcon icon={cfg.icon} className={cfg.color} />
            <div className="flex-1">
              <p className="text-white text-xs font-semibold">{fmt(d.amount)}</p>
              <p className="text-white/30 text-[10px]">{fmtDate(d.createdAt)} · {d.method}</p>
            </div>
            <span className={`text-[10px] font-medium ${cfg.color}`}>{cfg.label}</span>
          </div>
        )
      })}
    </div>
  )
}

function OrderList({ orders }) {
  if (!orders.length) {
    return (
      <div className="bg-dark-700 border border-white/5 rounded-xl p-4 text-center text-white/40 text-sm">
        Chưa có đơn hàng nào
      </div>
    )
  }

  return (
    <div className="bg-dark-700 border border-white/5 rounded-xl overflow-hidden">
      <div className="px-3 py-2 border-b border-white/5 flex items-center gap-2">
        <FontAwesomeIcon icon={faShoppingCart} className="text-teal-400 text-sm" />
        <span className="text-white/60 text-xs font-semibold">Lịch sử mua acc</span>
      </div>

      {orders.map((o, i) => (
        <div key={o.id || i} className="px-3 py-2.5 border-b border-white/[0.04] last:border-0">
          <div className="flex items-center justify-between">
            <span className="text-white text-xs font-semibold">{o.orderCode}</span>
            <span className={`text-[10px] font-medium ${o.status === 'COMPLETED' ? 'text-green-400' : 'text-white/40'}`}>
              {o.status}
            </span>
          </div>

          {o.items?.[0] && (
            <p className="text-white/50 text-[10px] mt-0.5 truncate">
              {o.items[0].title} · {o.items[0].rank}
            </p>
          )}

          <p className="text-teal-400 text-xs font-semibold mt-0.5">{fmt(o.finalAmount)}</p>
        </div>
      ))}
    </div>
  )
}

function CardPurchaseList({ purchases }) {
  if (!purchases.length) {
    return (
      <div className="bg-dark-700 border border-white/5 rounded-xl p-4 text-center text-white/40 text-sm">
        Chưa mua thẻ nào
      </div>
    )
  }

  return (
    <div className="bg-dark-700 border border-white/5 rounded-xl overflow-hidden">
      <div className="px-3 py-2 border-b border-white/5 flex items-center gap-2">
        <FontAwesomeIcon icon={faCreditCard} className="text-neon-blue text-sm" />
        <span className="text-white/60 text-xs font-semibold">Lịch sử mua thẻ</span>
      </div>

      {purchases.map((p, i) => (
        <div key={p.id || i} className="flex items-center gap-3 px-3 py-2.5 border-b border-white/[0.04] last:border-0">
          <div className="flex-1">
            <p className="text-white text-xs font-semibold">
              {p.telco} · {fmt(p.denomination)} × {p.quantity}
            </p>
            <p className="text-white/30 text-[10px]">{p.type} · {fmtDate(p.createdAt)}</p>
          </div>
          <span className={`text-xs font-semibold ${p.status === 'SUCCESS' ? 'text-green-400' : 'text-red-400'}`}>
            {fmt(p.totalPrice)}
          </span>
        </div>
      ))}
    </div>
  )
}

function RankingList({ rankings }) {
  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="bg-dark-700 border border-white/5 rounded-xl overflow-hidden">
      <div className="px-3 py-2 border-b border-white/5 flex items-center gap-2">
        <FontAwesomeIcon icon={faTrophy} className="text-yellow-400 text-sm" />
        <span className="text-white/60 text-xs font-semibold">Bảng xếp hạng nạp tiền</span>
      </div>

      {rankings.map((r, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2.5 border-b border-white/[0.04] last:border-0">
          <span className="w-6 text-center text-sm">{medals[i] || `${r.rank}.`}</span>
          <p className="flex-1 text-white text-xs font-semibold truncate">{r.username}</p>
          <span className="text-yellow-400 text-xs font-bold">{fmt(r.totalDeposit)}</span>
        </div>
      ))}
    </div>
  )
}

function WheelCard({ wheel, onView }) {
  if (!wheel) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-dark-700 border border-yellow-400/20 hover:border-yellow-400/50 rounded-xl p-4 cursor-pointer transition-all"
      onClick={onView}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">🎡</span>
        <p className="text-yellow-400 font-bold text-sm">{wheel.name || 'Vòng Quay May Mắn'}</p>
      </div>

      <p className="text-white/50 text-xs mb-2">
        Chi phí: <span className="text-yellow-400 font-semibold">{fmt(wheel.spinCost)}</span>/lượt
      </p>

      {wheel.rewards?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {wheel.rewards.slice(0, 5).map(r => (
            <span key={r.id} className="text-xs px-2 py-0.5 rounded-full bg-dark-500 text-white/60">
              {r.name}
            </span>
          ))}

          {wheel.rewards.length > 5 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-dark-500 text-white/30">
              +{wheel.rewards.length - 5}
            </span>
          )}
        </div>
      )}
    </motion.div>
  )
}

function ToolResults({ toolData, navigate }) {
  if (!toolData) return null

  const {
    accounts,
    accountDetail,
    mysteryBoxes,
    wheel,
    deposits,
    orders,
    cardPurchases,
    rankings,
  } = toolData

  return (
    <div className="mt-3 space-y-2">
      {accounts?.length > 0 && accounts.map(acc => (
        <AccCard
          key={acc.id}
          acc={acc}
          onView={id => navigate(`/shop/acc/${id}`)}
        />
      ))}

      {accountDetail && (
        accountDetail.type === 'GAME_ACCOUNT' && accountDetail.canViewDetail ? (
          <AccCard
            acc={accountDetail}
            onView={id => navigate(`/shop/acc/${id}`)}
          />
        ) : (
          <AccountDetailCard account={accountDetail} />
        )
      )}

      {mysteryBoxes?.length > 0 && mysteryBoxes.map(box => (
        <MysteryBoxCard
          key={box.id}
          box={box}
          onView={slug => navigate(`/mystery-box/${slug}`)}
        />
      ))}

      {wheel && <WheelCard wheel={wheel} onView={() => navigate('/lucky-wheel')} />}
      {deposits?.length > 0 && <DepositList deposits={deposits} />}
      {orders?.length > 0 && <OrderList orders={orders} />}
      {cardPurchases?.length > 0 && <CardPurchaseList purchases={cardPurchases} />}
      {rankings?.length > 0 && <RankingList rankings={rankings} />}
    </div>
  )
}

function MessageBubble({ msg, navigate, isTyping, typingText }) {
  const isUser = msg.role === 'user'
  const displayContent = (!isUser && isTyping) ? typingText : msg.content

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full flex-shrink-0 bg-gradient-to-br from-neon-pink to-neon-purple flex items-center justify-center text-white text-sm mt-1">
          <FontAwesomeIcon icon={faRobot} />
        </div>
      )}

      <div className={`max-w-[82%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-gradient-to-br from-neon-pink/80 to-neon-purple/80 text-white rounded-tr-sm'
            : 'bg-dark-600 border border-white/5 text-white/90 rounded-tl-sm'
        }`}>
          {displayContent}
          {!isUser && isTyping && (
            <span className="inline-block w-1.5 h-4 ml-0.5 bg-neon-pink/80 animate-pulse align-middle rounded-sm" />
          )}
        </div>

        {!isUser && !isTyping && msg.toolData && (
          <ToolResults toolData={msg.toolData} navigate={navigate} />
        )}

        <span className="text-white/20 text-[10px] mt-1 px-1">
          {fmtDate(msg.createdAt)}
        </span>
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full flex-shrink-0 bg-dark-500 border border-white/10 flex items-center justify-center text-white/60 text-sm mt-1">
          U
        </div>
      )}
    </motion.div>
  )
}

function TypingDots() {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full flex-shrink-0 bg-gradient-to-br from-neon-pink to-neon-purple flex items-center justify-center text-white text-sm">
        <FontAwesomeIcon icon={faRobot} />
      </div>
      <div className="bg-dark-600 border border-white/5 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center">
        {[0, 0.18, 0.36].map((d, i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-neon-pink/70 animate-bounce"
            style={{ animationDelay: `${d}s` }}
          />
        ))}
      </div>
    </div>
  )
}

function SessionItem({ session, isActive, onSelect, onDelete, onRename, isNewlyRenamed }) {
  const [showMenu, setShowMenu] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [renameVal, setRenameVal] = useState(session.title || 'Cuộc trò chuyện mới')
  const [displayTitle, setDisplayTitle] = useState(() =>
    isNewlyRenamed ? '' : (session.title || 'Cuộc trò chuyện mới')
  )
  const typingRef = useRef(null)

  useEffect(() => {
    if (isNewlyRenamed && session.title) {
      const full = session.title
      let i = 0
      setDisplayTitle('')
      typingRef.current = setInterval(() => {
        i += 1
        setDisplayTitle(full.slice(0, i))
        if (i >= full.length) {
          clearInterval(typingRef.current)
          typingRef.current = null
        }
      }, 30)
      return () => clearInterval(typingRef.current)
    } else {
      setDisplayTitle(session.title || 'Cuộc trò chuyện mới')
    }
  }, [session.title, isNewlyRenamed])

  const handleRename = () => {
    if (renameVal.trim()) {
      onRename(session.id, renameVal.trim())
    }
    setRenaming(false)
    setShowMenu(false)
  }

  return (
    <div
      className={`group relative flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
        isActive
          ? 'bg-gradient-to-r from-neon-pink/10 to-neon-purple/10 border border-neon-pink/20'
          : 'hover:bg-white/4 border border-transparent'
      }`}
      onClick={() => !renaming && onSelect(session.id)}
    >
      <FontAwesomeIcon
        icon={faRobot}
        className={`text-xs flex-shrink-0 ${isActive ? 'text-neon-pink' : 'text-white/30'}`}
      />

      {renaming ? (
        <input
          autoFocus
          value={renameVal}
          onChange={e => setRenameVal(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleRename()
            if (e.key === 'Escape') setRenaming(false)
          }}
          onBlur={handleRename}
          onClick={e => e.stopPropagation()}
          className="flex-1 bg-transparent text-white text-sm focus:outline-none border-b border-neon-pink/50 pb-0.5"
        />
      ) : (
        <p className={`flex-1 text-sm truncate ${isActive ? 'text-white' : 'text-white/60'}`}>
          {displayTitle || 'Cuộc trò chuyện mới'}
          {isNewlyRenamed && displayTitle.length < (session.title || '').length && (
            <span className="inline-block w-1 h-3.5 ml-0.5 bg-neon-pink/80 animate-pulse align-middle rounded-sm" />
          )}
        </p>
      )}

      {!renaming && (
        <button
          onClick={e => {
            e.stopPropagation()
            setShowMenu(m => !m)
          }}
          className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center text-white/40 hover:text-white rounded transition-all"
        >
          <FontAwesomeIcon icon={faEllipsisV} className="text-xs" />
        </button>
      )}

      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute right-0 top-full mt-1 z-50 bg-dark-500 border border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[140px]"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setRenaming(true)
                setShowMenu(false)
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-white/70 hover:text-white hover:bg-white/5 text-sm transition-colors"
            >
              <FontAwesomeIcon icon={faPen} className="text-xs" /> Đổi tên
            </button>

            <button
              onClick={() => {
                onDelete(session.id)
                setShowMenu(false)
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-red-400 hover:bg-red-500/10 text-sm transition-colors"
            >
              <FontAwesomeIcon icon={faTrash} className="text-xs" /> Xóa
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SidebarContent({ onClose, onNew, sessions, loading, activeSessionId, onSelect, onDelete, onRename, newlyRenamedIds, navigate }) {
  return (
    <>
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/5 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-pink to-neon-purple flex items-center justify-center">
          <FontAwesomeIcon icon={faRobot} className="text-white text-sm" />
        </div>
        <div className="flex-1">
          <p className="text-white font-bold text-sm font-gaming">AI Assistant</p>
          <p className="text-white/30 text-[10px]">Quang · LQ Shop</p>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
        >
          <FontAwesomeIcon icon={faXmark} className="text-sm" />
        </button>
      </div>

      <div className="px-3 pt-3 pb-2 flex-shrink-0">
        <button
          onClick={onNew}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-neon-pink/15 to-neon-purple/10 border border-neon-pink/20 hover:border-neon-pink/40 text-white text-sm font-semibold transition-all"
        >
          <FontAwesomeIcon icon={faPlus} className="text-neon-pink" />
          Cuộc trò chuyện mới
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-1 space-y-0.5 min-h-0" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,45,115,0.2) transparent' }}>
        {loading ? (
          <div className="flex justify-center py-8">
            <FontAwesomeIcon icon={faSpinner} className="text-neon-pink text-xl animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-10 text-white/30">
            <FontAwesomeIcon icon={faRobot} className="text-3xl mb-2 opacity-30" />
            <p className="text-xs">Chưa có cuộc trò chuyện nào</p>
          </div>
        ) : (
          sessions.map(session => (
            <SessionItem
              key={session.id}
              session={session}
              isActive={session.id === activeSessionId}
              onSelect={onSelect}
              onDelete={onDelete}
              onRename={onRename}
              isNewlyRenamed={newlyRenamedIds.has(session.id)}
            />
          ))
        )}
      </div>

      <div className="px-4 py-3 border-t border-white/5 flex-shrink-0">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white/30 hover:text-white text-xs transition-colors"
        >
          <FontAwesomeIcon icon={faArrowLeft} /> Về trang chủ
        </button>
      </div>
    </>
  )
}

const SUGGESTIONS = [
  { icon: faGamepad, text: 'Tìm acc Kim Cương giá dưới 500k' },
  { icon: faMoneyBillWave, text: 'Xem lịch sử nạp tiền của mình' },
  { icon: faBoxOpen, text: 'Có túi mù gì đang hot không?' },
  { icon: faDice, text: 'Vòng quay may mắn có gì?' },
  { icon: faTrophy, text: 'Ai đang đứng đầu BXH nạp tiền?' },
  { icon: faMagnifyingGlass, text: 'Acc Thách Đấu nhiều skin nhất' },
]

export default function AIChatPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector(s => s.auth)

  const {
    sessions,
    activeSessionId,
    messages,
    loading,
    sessionLoading,
    sending,
  } = useSelector(s => s.chat)

  const [input, setInput] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768)
  const [typingMsgId, setTypingMsgId] = useState(null)
  const [typingText, setTypingText] = useState('')
  const [newlyRenamedIds, setNewlyRenamedIds] = useState(new Set())
  const typingTimerRef = useRef(null)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (user) dispatch(fetchSessions())
  }, [user, dispatch])

  // Typing effect for new bot messages
  const prevMsgCountRef = useRef(0)
  useEffect(() => {
    const botMsgs = messages.filter(m => m.role !== 'user')
    if (botMsgs.length > prevMsgCountRef.current) {
      const lastBot = botMsgs[botMsgs.length - 1]
      if (lastBot && lastBot.content) {
        const msgId = lastBot.id || `bot-${messages.length}`
        const fullText = lastBot.content
        let index = 0
        setTypingMsgId(msgId)
        setTypingText('')
        if (typingTimerRef.current) clearInterval(typingTimerRef.current)
        typingTimerRef.current = setInterval(() => {
          index += 2
          setTypingText(fullText.slice(0, index))
          if (index >= fullText.length) {
            clearInterval(typingTimerRef.current)
            typingTimerRef.current = null
            setTypingMsgId(null)
            setTypingText('')
          }
        }, 12)
      }
    }
    prevMsgCountRef.current = botMsgs.length
    return () => {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current)
    }
  }, [messages])

  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80)
  }, [messages, sending])

  useEffect(() => {
    if (!user) navigate('/login', { state: { from: '/ai-chat' } })
  }, [user, navigate])

  const handleNewSession = useCallback(async () => {
    await dispatch(createSession())
    if (window.innerWidth < 768) setSidebarOpen(false)
    inputRef.current?.focus()
  }, [dispatch])

  const handleSelectSession = useCallback(async (sessionId) => {
    if (sessionId === activeSessionId) return
    await dispatch(loadSession(sessionId))
    if (window.innerWidth < 768) setSidebarOpen(false)
  }, [dispatch, activeSessionId])

  const handleDeleteSession = useCallback(async (sessionId) => {
    await dispatch(deleteSession(sessionId))
    toast.success('Đã xóa cuộc trò chuyện')
  }, [dispatch])

  const handleRenameSession = useCallback((sessionId, title) => {
    dispatch(updateSessionTitle({ sessionId, title }))
    setNewlyRenamedIds(prev => new Set([...prev, sessionId]))
    setTimeout(() => setNewlyRenamedIds(prev => {
      const next = new Set(prev)
      next.delete(sessionId)
      return next
    }), 3000)
  }, [dispatch])

  const handleSend = useCallback(async (text) => {
    const msgText = text || input.trim()
    if (!msgText || sending) return

    setInput('')

    let sid = activeSessionId
    if (!sid) {
      const result = await dispatch(createSession())
      sid = result.payload?.id
      if (!sid) return
    }

    dispatch(addOptimisticUserMessage(msgText))
    await dispatch(sendMessage({ sessionId: sid, message: msgText }))
    dispatch(fetchSessions())
  }, [input, sending, activeSessionId, dispatch])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const isEmptyChat = messages.length === 0 && !sessionLoading

  return (
    <div className="flex h-[calc(100vh-72px)] bg-dark-900 overflow-hidden relative">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Desktop sidebar — animates width, zero layout gap */}
      <motion.aside
        animate={{ width: sidebarOpen ? 280 : 0 }}
        transition={{ type: 'tween', duration: 0.22, ease: 'easeInOut' }}
        className="hidden md:flex flex-shrink-0 h-full border-r border-white/5 flex-col overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #0a0a12, #0f0f1a)', minWidth: 0 }}
      >
        <div style={{ width: 280, minWidth: 280 }} className="flex flex-col h-full overflow-hidden">
          <SidebarContent
            onClose={() => setSidebarOpen(false)}
            onNew={handleNewSession}
            sessions={sessions}
            loading={loading}
            activeSessionId={activeSessionId}
            onSelect={handleSelectSession}
            onDelete={handleDeleteSession}
            onRename={handleRenameSession}
            newlyRenamedIds={newlyRenamedIds}
            navigate={navigate}
          />
        </div>
      </motion.aside>

      {/* Mobile sidebar — slides over content, no layout shift */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            key="mobile-sidebar"
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'tween', duration: 0.22, ease: 'easeInOut' }}
            className="md:hidden flex flex-col absolute left-0 top-0 h-full z-40 border-r border-white/5"
            style={{ background: 'linear-gradient(180deg, #0a0a12, #0f0f1a)', width: 280 }}
          >
            <SidebarContent
              onClose={() => setSidebarOpen(false)}
              onNew={handleNewSession}
              sessions={sessions}
              loading={loading}
              activeSessionId={activeSessionId}
              onSelect={handleSelectSession}
              onDelete={handleDeleteSession}
              onRename={handleRenameSession}
              newlyRenamedIds={newlyRenamedIds}
              navigate={navigate}
            />
          </motion.aside>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div
          className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-white/5"
          style={{ background: 'rgba(10,10,18,0.95)', backdropFilter: 'blur(12px)' }}
        >
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
            >
              <FontAwesomeIcon icon={faBars} />
            </button>
          )}

          <div className="flex items-center gap-2 flex-1">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-neon-pink to-neon-purple flex items-center justify-center">
              <FontAwesomeIcon icon={faRobot} className="text-white text-xs" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">
                {sessions.find(s => s.id === activeSessionId)?.title || 'Quang – AI Assistant'}
              </p>
              <p className="text-green-400 text-[10px]">● Online · Gemini 2.5 Flash + RAG</p>
            </div>
          </div>
        </div>

        <div
          className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,45,115,0.2) transparent' }}
        >
          {sessionLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="text-center">
                <FontAwesomeIcon icon={faSpinner} className="text-neon-pink text-3xl animate-spin mb-3" />
                <p className="text-white/40 text-sm">Đang tải cuộc trò chuyện...</p>
              </div>
            </div>
          ) : isEmptyChat ? (
            <div className="flex flex-col items-center justify-center h-full text-center pb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-neon-pink/20 to-neon-purple/20 border border-neon-pink/20 flex items-center justify-center mb-6"
              >
                <FontAwesomeIcon icon={faRobot} className="text-4xl text-neon-pink" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-white font-gaming text-2xl font-bold mb-2"
              >
                Xin chào! Mình là <span className="text-gradient">Quang</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-white/40 text-sm mb-8 max-w-sm"
              >
                AI Assistant của LQ Shop — tư vấn acc, hỗ trợ đơn hàng, nạp tiền và nhiều hơn nữa.
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-2 gap-2 w-full max-w-md"
              >
                {SUGGESTIONS.map((s, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.07 }}
                    onClick={() => handleSend(s.text)}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-dark-600 border border-white/5 hover:border-neon-pink/30 hover:bg-dark-500 text-white/60 hover:text-white text-sm text-left transition-all"
                  >
                    <FontAwesomeIcon icon={s.icon} className="text-neon-pink text-sm flex-shrink-0" />
                    <span className="truncate">{s.text}</span>
                  </motion.button>
                ))}
              </motion.div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => {
                const msgId = msg.id || `bot-${i}`
                const isBotTyping = msg.role !== 'user' && typingMsgId === msgId
                return (
                  <MessageBubble
                    key={msg.id || i}
                    msg={msg}
                    navigate={navigate}
                    isTyping={isBotTyping}
                    typingText={isBotTyping ? typingText : ''}
                  />
                )
              })}
              {sending && <TypingDots />}
            </>
          )}

          <div ref={bottomRef} />
        </div>

        <div
  className="flex-shrink-0 px-4 pb-4 pt-2 border-t border-white/5"
  style={{ background: 'rgba(10,10,18,0.95)' }}
>
  <div
    className="flex items-center gap-2 rounded-2xl border border-white/8 focus-within:border-neon-pink/30 px-4 py-2 transition-all"
    style={{ background: 'rgba(20,20,31,0.8)' }}
  >
    <textarea
      ref={inputRef}
      value={input}
      onChange={e => setInput(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder={
        activeSessionId
          ? 'Nhắn tin với Quang...'
          : 'Bắt đầu cuộc trò chuyện...'
      }
      rows={1}
      disabled={sending}
      className="flex-1 bg-transparent text-white text-sm placeholder-white/25 focus:outline-none resize-none leading-6 py-1"
      style={{
        minHeight: '24px',
        maxHeight: '120px',
      }}
      onInput={e => {
        e.target.style.height = 'auto'
        e.target.style.height =
          Math.min(e.target.scrollHeight, 120) + 'px'
      }}
    />

    <button
      onClick={() => handleSend()}
      disabled={sending || !input.trim()}
      className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-pink to-neon-purple flex items-center justify-center text-white transition-all hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
    >
      {sending ? (
        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        <FontAwesomeIcon
          icon={faPaperPlane}
          className="text-xs"
        />
      )}
    </button>
  </div>

  <p className="text-white/15 text-[10px] text-center mt-2 tracking-wide">
    Powered by Quang ChatBot · Enter để gửi
  </p>
</div>
      </div>
    </div>
  )
}