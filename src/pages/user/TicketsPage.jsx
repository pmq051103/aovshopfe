import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSelector } from 'react-redux'
import { io } from 'socket.io-client'
import api from '../../api/axios'
import { formatRelativeTime } from '../../utils/helpers'
import { Spinner, EmptyState } from '../../components/common/UIComponents'
import toast from 'react-hot-toast'

const PRIORITY_COLORS = { LOW: 'text-white/40', MEDIUM: 'text-yellow-400', HIGH: 'text-orange-400', URGENT: 'text-red-400' }
const STATUS_LABELS = { OPEN: '🟢 Đang mở', IN_PROGRESS: '🔵 Đang xử lý', RESOLVED: '✅ Đã giải quyết', CLOSED: '⚫ Đã đóng' }

export default function TicketsPage() {
  const { user } = useSelector(s => s.auth)
  const [tickets, setTickets] = useState([])
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [msgLoading, setMsgLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newMsg, setNewMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)       // admin đang gõ
  const [createForm, setCreateForm] = useState({ subject: '', message: '', category: 'general', priority: 'MEDIUM' })
  const [creating, setCreating] = useState(false)
  const socketRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const selectedRef = useRef(null)
  const chatBoxRef = useRef(null)
  const messagesEndRef = useRef(null)

  // Giữ selectedRef sync để dùng trong socket callback
  useEffect(() => { selectedRef.current = selected }, [selected])

  // Khởi tạo socket 1 lần
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    const socket = io(import.meta.env.VITE_SOCKET_URL || '', {
      auth: { token },
      transports: ['websocket', 'polling']
    })
    socketRef.current = socket

    socket.on('ticket:message', (msg) => {
      // Chỉ append nếu đang mở đúng ticket đó
      if (selectedRef.current?.id === msg.ticketId) {
        setMessages(prev => [...prev, msg])
      }
      // Cập nhật preview tin nhắn cuối trong danh sách
      setTickets(prev => prev.map(t =>
        t.id === msg.ticketId
          ? { ...t, updatedAt: msg.createdAt, messages: [msg] }
          : t
      ))
    })

    socket.on('ticket:typing', ({ isTyping }) => {
      setIsTyping(isTyping)
      // Tự tắt sau 3s phòng trường hợp mất event
      if (isTyping) {
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000)
      }
    })

    return () => {
      socket.disconnect()
      clearTimeout(typingTimeoutRef.current)
    }
  }, [])

  // Join/leave room khi đổi ticket
  useEffect(() => {
    const socket = socketRef.current
    if (!socket) return
    if (selected) {
      socket.emit('ticket:join', selected.id)
      fetchMessages(selected.id)
    }
    return () => {
      if (selected) socket.emit('ticket:leave', selected.id)
      setIsTyping(false)
    }
  }, [selected?.id])

  useEffect(() => { fetchTickets() }, [])
  useEffect(() => {
  const chatBox = chatBoxRef.current

  if (!chatBox) return

  chatBox.scrollTo({
    top: chatBox.scrollHeight,
    behavior: 'smooth'
  })
}, [messages, isTyping])

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/tickets/my?limit=50')
      setTickets(data.data || [])
    } catch (e) {}
    finally { setLoading(false) }
  }

  const fetchMessages = async (id) => {
    setMsgLoading(true)
    try {
      const { data } = await api.get(`/tickets/${id}`)
      setMessages(data.data?.messages || [])
      // Sau khi xem tin → cập nhật lại danh sách để loại bỏ unread indicator
      setTickets(prev => prev.map(t =>
        t.id === id ? { ...t, _read: true } : t
      ))
    } catch (e) {}
    finally { setMsgLoading(false) }
  }

  // Emit typing indicator khi user gõ
  const handleTyping = (e) => {
    setNewMsg(e.target.value)
    if (!selected || !socketRef.current) return
    socketRef.current.emit('ticket:typing', { ticketId: selected.id, isTyping: true })
    clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('ticket:typing', { ticketId: selected.id, isTyping: false })
    }, 1500)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setCreating(true)
    try {
      const { data } = await api.post('/tickets', createForm)
      toast.success('Tạo ticket thành công!')
      setShowCreate(false)
      setCreateForm({ subject: '', message: '', category: 'general', priority: 'MEDIUM' })
      await fetchTickets()
      setSelected(data.data)
    } catch (e) { toast.error(e.response?.data?.message || 'Lỗi tạo ticket') }
    finally { setCreating(false) }
  }

  const handleSend = async (e) => {
  e.preventDefault()
  if (!newMsg.trim() || !selected) return

  const messageText = newMsg
  setNewMsg('')
  setSending(true)

  socketRef.current?.emit('ticket:typing', {
    ticketId: selected.id,
    isTyping: false
  })

  try {
    await api.post(`/tickets/${selected.id}/message`, {
      message: messageText
    })
  } catch (e) {
    toast.error('Lỗi gửi tin nhắn')
    setNewMsg(messageText)
  } finally {
    setSending(false)
  }
}

  return (
    <div className="pt-20 pb-6 min-h-screen">
      <div className="page-container">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-gaming text-2xl font-bold text-gradient">💬 Hỗ Trợ</h1>
            <p className="text-white/40 text-sm">Tạo ticket để nhận hỗ trợ từ đội ngũ</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary px-5 py-2.5 text-sm">+ Tạo Ticket</button>
        </div>

        <div className="flex gap-5 h-[calc(100vh-200px)] min-h-[500px]">
          {/* Ticket list */}
          <div className="w-72 flex-shrink-0 gaming-card overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-10"><Spinner /></div>
            ) : tickets.length === 0 ? (
              <div className="p-6 text-center">
                <div className="text-4xl mb-3">💬</div>
                <div className="text-white/30 text-sm">Chưa có ticket nào</div>
                <button onClick={() => setShowCreate(true)} className="btn-primary text-xs px-4 py-2 mt-4">Tạo Ticket</button>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {tickets.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelected(t)}
                    className={`w-full text-left p-4 hover:bg-white/5 transition-colors ${selected?.id === t.id ? 'bg-neon-pink/10 border-r-2 border-neon-pink' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-white font-medium text-sm line-clamp-1">{t.subject}</span>
                      <span className={`text-[10px] font-bold flex-shrink-0 ${PRIORITY_COLORS[t.priority]}`}>{t.priority}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/30 text-[11px]">{STATUS_LABELS[t.status]}</span>
                      <span className="text-white/20 text-[10px]">{formatRelativeTime(t.updatedAt)}</span>
                    </div>
                    {t.messages?.[0] && (
                      <div className="text-white/30 text-xs mt-1 line-clamp-1">{t.messages[0].message}</div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Chat area */}
          <div className="flex-1 gaming-card flex flex-col overflow-hidden">
            {!selected ? (
              <div className="flex-1 flex items-center justify-center text-white/20 flex-col gap-3">
                <div className="text-5xl">💬</div>
                <div>Chọn ticket để xem tin nhắn</div>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                  <div>
                    <div className="font-display font-bold text-white">{selected.subject}</div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-white/40">{STATUS_LABELS[selected.status]}</span>
                      <span className={`text-xs font-bold ${PRIORITY_COLORS[selected.priority]}`}>{selected.priority}</span>
                      <span className="text-xs text-white/30 font-mono">{selected.ticketCode}</span>
                    </div>
                  </div>
                  {selected.status !== 'CLOSED' && (
                    <button onClick={() => handleClose(selected.id)} className="text-xs text-white/40 hover:text-white transition-colors border border-white/10 px-3 py-1.5 rounded-lg hover:border-white/30">
                      Đóng ticket
                    </button>
                  )}
                </div>

                {/* Messages */}
                <div ref={chatBoxRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                  {msgLoading ? (
                    <div className="flex justify-center py-10"><Spinner /></div>
                  ) : (
                    messages.map(msg => {
                      const isMe = msg.senderId === user?.id
                      const isAdmin = msg.senderRole === 'ADMIN'
                      return (
                        <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                          <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold border ${isAdmin ? 'bg-neon-pink/20 border-neon-pink/30 text-neon-pink' : 'bg-dark-600 border-white/10 text-white'}`}>
                            {isAdmin ? '⚙️' : user?.username?.[0]?.toUpperCase()}
                          </div>
                          <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                            <div className={`text-[10px] text-white/30 ${isMe ? 'text-right' : ''}`}>
                              {isAdmin ? '🛡️ Support' : 'Bạn'} · {formatRelativeTime(msg.createdAt)}
                            </div>
                            <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                              isMe ? 'bg-neon-pink/20 border border-neon-pink/20 text-white rounded-tr-none' : isAdmin ? 'bg-blue-500/10 border border-blue-500/20 text-white rounded-tl-none' : 'bg-dark-600 border border-white/5 text-white/80 rounded-tl-none'
                            }`}>
                              {msg.message}
                            </div>
                            {msg.imageUrl && <img src={msg.imageUrl} alt="" className="max-w-xs rounded-xl mt-1 border border-white/10" />}
                          </div>
                        </div>
                      )
                    })
                  )}

                  {/* Typing indicator */}
                  <AnimatePresence>
                    {isTyping && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        className="flex gap-3 items-end"
                      >
                        <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm border bg-neon-pink/20 border-neon-pink/30 text-neon-pink">⚙️</div>
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl rounded-tl-none px-4 py-3 flex gap-1 items-center">
                          {[0, 1, 2].map(i => (
                            <motion.span
                              key={i}
                              className="w-1.5 h-1.5 rounded-full bg-blue-400 block"
                              animate={{ y: [0, -4, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                {selected.status !== 'CLOSED' && selected.status !== 'RESOLVED' ? (
                  <form onSubmit={handleSend} className="p-4 border-t border-white/5 flex gap-3">
                    <input
                      value={newMsg}
                      onChange={handleTyping}
                      placeholder="Nhập tin nhắn..."
                      disabled={sending}
                      className="input-gaming flex-1 text-sm py-2.5"
                    />
                    <button type="submit" disabled={sending || !newMsg.trim()} className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2 disabled:opacity-50">
                      {sending ? <Spinner size="sm" color="white" /> : '📤 Gửi'}
                    </button>
                  </form>
                ) : (
                  <div className="p-4 border-t border-white/5 text-center text-white/30 text-sm">⚫ Ticket đã đóng</div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !creating && setShowCreate(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative gaming-card border border-white/10 p-6 max-w-md w-full z-10">
              <h3 className="font-gaming text-lg font-bold text-gradient mb-5">💬 Tạo Ticket Hỗ Trợ</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="text-xs text-white/40 uppercase font-display block mb-2">Tiêu đề *</label>
                  <input value={createForm.subject} onChange={e => setCreateForm(p => ({...p, subject: e.target.value}))} required placeholder="Mô tả ngắn vấn đề..." className="input-gaming" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-white/40 uppercase font-display block mb-2">Danh mục</label>
                    <select value={createForm.category} onChange={e => setCreateForm(p => ({...p, category: e.target.value}))} className="input-gaming text-sm py-2">
                      <option value="general">Chung</option>
                      <option value="payment">Thanh toán</option>
                      <option value="account">Tài khoản</option>
                      <option value="technical">Kỹ thuật</option>
                      <option value="refund">Hoàn tiền</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-white/40 uppercase font-display block mb-2">Mức độ</label>
                    <select value={createForm.priority} onChange={e => setCreateForm(p => ({...p, priority: e.target.value}))} className="input-gaming text-sm py-2">
                      <option value="LOW">🟢 Thấp</option>
                      <option value="MEDIUM">🟡 Trung bình</option>
                      <option value="HIGH">🟠 Cao</option>
                      <option value="URGENT">🔴 Khẩn cấp</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-white/40 uppercase font-display block mb-2">Nội dung *</label>
                  <textarea value={createForm.message} onChange={e => setCreateForm(p => ({...p, message: e.target.value}))} required rows={4} placeholder="Mô tả chi tiết vấn đề của bạn..." className="input-gaming resize-none" />
                </div>
                <div className="flex gap-3 justify-end">
                  <button type="button" onClick={() => setShowCreate(false)} disabled={creating} className="btn-neon px-5 py-2 text-sm">Hủy</button>
                  <button type="submit" disabled={creating} className="btn-primary px-5 py-2 text-sm flex items-center gap-2">
                    {creating ? <><Spinner size="sm" color="white" />Đang tạo...</> : '📨 Gửi Ticket'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}