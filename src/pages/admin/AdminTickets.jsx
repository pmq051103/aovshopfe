import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useSelector } from 'react-redux'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faComments,
  faCircle,
  faSpinner,
  faCheckCircle,
  faLock,
  faTriangleExclamation,
  faShieldHalved,
  faGear,
  faPaperPlane,
  faCircleXmark,
} from '@fortawesome/free-solid-svg-icons'

import api from '../../api/axios'
import { formatRelativeTime } from '../../utils/helpers'
import { Spinner, Pagination } from '../../components/common/UIComponents'
import toast from 'react-hot-toast'
import { io } from 'socket.io-client'

const PRIORITY_COLORS = {
  LOW: 'text-white/40',
  MEDIUM: 'text-yellow-400',
  HIGH: 'text-orange-400',
  URGENT: 'text-red-400 animate-pulse',
}

const STATUS_LABELS = {
  OPEN: {
    label: 'Mở',
    icon: faCircle,
    cls: 'text-green-400',
  },
  IN_PROGRESS: {
    label: 'Đang xử lý',
    icon: faSpinner,
    cls: 'text-blue-400',
  },
  RESOLVED: {
    label: 'Xong',
    icon: faCheckCircle,
    cls: 'text-neon-green',
  },
  CLOSED: {
    label: 'Đóng',
    icon: faLock,
    cls: 'text-white/40',
  },
}

export default function AdminTickets() {
  const { user } = useSelector((s) => s.auth)

  const [tickets, setTickets] = useState([])
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [newMsg, setNewMsg] = useState('')
  const [sending, setSending] = useState(false)

  const socketRef = useRef(null)
  const selectedRef = useRef(null)
  const chatBoxRef = useRef(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    selectedRef.current = selected
  }, [selected])

  useEffect(() => {
    const chatBox = chatBoxRef.current
    const bottom = messagesEndRef.current

    if (!chatBox || !bottom) return

    chatBox.scrollTo({
      top: chatBox.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages])

  useEffect(() => {
    fetchTickets()
  }, [page, statusFilter, priorityFilter])

  useEffect(() => {
    if (selected?.id) {
      fetchDetail(selected.id)
    }
  }, [selected?.id])

  useEffect(() => {
    const token = localStorage.getItem('accessToken')

    const socket = io(import.meta.env.VITE_SOCKET_URL || '', {
      auth: { token },
      transports: ['websocket', 'polling'],
    })

    socketRef.current = socket

    socket.on('connect', () => {
      if (selectedRef.current?.id) {
        socket.emit('ticket:join', selectedRef.current.id)
      }
    })

    socket.on('ticket:message', (msg) => {
      if (selectedRef.current?.id === msg.ticketId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev
          return [...prev, msg]
        })
      }

      fetchTickets()
    })

    socket.on('ticket:updated', () => {
      fetchTickets()
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [])

  useEffect(() => {
    const socket = socketRef.current
    if (!socket || !selected?.id) return

    socket.emit('ticket:join', selected.id)

    return () => {
      socket.emit('ticket:leave', selected.id)
    }
  }, [selected?.id])

  const fetchTickets = async () => {
    setLoading(true)

    try {
      const q = new URLSearchParams({
        page,
        limit: 10,
        ...(statusFilter && { status: statusFilter }),
        ...(priorityFilter && { priority: priorityFilter }),
      })

      const { data } = await api.get(`/tickets/admin?${q}`)

      setTickets(data.data || [])
      setTotal(data.pagination?.total || 0)
    } catch (e) {
      toast.error('Lỗi tải danh sách ticket')
    } finally {
      setLoading(false)
    }
  }

  const fetchDetail = async (id) => {
    try {
      const { data } = await api.get(`/tickets/${id}`)
      setMessages(data.data?.messages || [])
    } catch (e) {
      toast.error('Lỗi tải chi tiết ticket')
    }
  }

  const handleSend = async (e) => {
    e.preventDefault()

    if (!newMsg.trim() || !selected || sending) return

    const messageText = newMsg.trim()

    setNewMsg('')
    setSending(true)

    try {
      const { data } = await api.post(`/tickets/${selected.id}/message`, {
        message: messageText,
      })

      const createdMessage = data.data

      if (createdMessage?.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === createdMessage.id)) return prev
          return [...prev, createdMessage]
        })
      }

      fetchTickets()
    } catch (e) {
      toast.error('Lỗi gửi')
      setNewMsg(messageText)
    } finally {
      setSending(false)
    }
  }

  const handleClose = async (id) => {
    try {
      await api.put(`/tickets/${id}/close`)

      toast.success('Đã đóng')
      fetchTickets()

      if (selected?.id === id) {
        setSelected((p) => (p ? { ...p, status: 'CLOSED' } : p))
      }
    } catch (e) {
      toast.error('Lỗi')
    }
  }

  const handlePriority = async (id, priority) => {
    try {
      await api.put(`/tickets/admin/${id}/priority`, { priority })

      toast.success('Đã cập nhật priority')
      fetchTickets()

      if (selected?.id === id) {
        setSelected((p) => (p ? { ...p, priority } : p))
      }
    } catch (e) {
      toast.error('Lỗi')
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-gaming text-xl font-bold text-gradient flex items-center gap-2">
          <FontAwesomeIcon icon={faComments} />
          Quản Lý Ticket Hỗ Trợ
        </h1>

        <p className="text-white/40 text-sm">{total} tickets</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          ['', { label: 'Tất cả', icon: faComments }],
          ['OPEN', STATUS_LABELS.OPEN],
          ['IN_PROGRESS', STATUS_LABELS.IN_PROGRESS],
          ['RESOLVED', STATUS_LABELS.RESOLVED],
          ['CLOSED', STATUS_LABELS.CLOSED],
        ].map(([v, item]) => (
          <button
            key={v}
            onClick={() => {
              setStatusFilter(v)
              setPage(1)
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              statusFilter === v
                ? 'bg-neon-pink/20 border border-neon-pink/40 text-neon-pink'
                : 'bg-dark-600 border border-white/10 text-white/50 hover:text-white'
            }`}
          >
            <FontAwesomeIcon icon={item.icon} />
            {item.label}
          </button>
        ))}

        <span className="text-white/20 mx-1">|</span>

        {[
          ['', { label: 'Tất cả priority', icon: faComments }],
          ['URGENT', { label: 'Khẩn', icon: faTriangleExclamation }],
          ['HIGH', { label: 'Cao', icon: faTriangleExclamation }],
          ['MEDIUM', { label: 'Thường', icon: faCircle }],
          ['LOW', { label: 'Thấp', icon: faCircle }],
        ].map(([v, item]) => (
          <button
            key={v}
            onClick={() => {
              setPriorityFilter(v)
              setPage(1)
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              priorityFilter === v
                ? 'bg-neon-pink/20 border border-neon-pink/40 text-neon-pink'
                : 'bg-dark-600 border border-white/10 text-white/50 hover:text-white'
            }`}
          >
            <FontAwesomeIcon icon={item.icon} />
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex gap-5 h-[calc(100vh-280px)] min-h-[400px]">
        <div className="w-72 flex-shrink-0 gaming-card overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {tickets.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelected(t)}
                  className={`w-full text-left p-3 hover:bg-white/5 transition-colors ${
                    selected?.id === t.id
                      ? 'bg-neon-pink/10 border-r-2 border-neon-pink'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <span className="text-white text-xs font-medium line-clamp-1">
                      {t.subject}
                    </span>

                    <span
                      className={`text-[9px] font-bold flex-shrink-0 ${PRIORITY_COLORS[t.priority]}`}
                    >
                      {t.priority}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <img
                      src={
                        t.user?.avatar ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${t.user?.username}`
                      }
                      alt=""
                      className="w-4 h-4 rounded-full"
                    />

                    <span className="text-white/30 text-[10px]">
                      {t.user?.username}
                    </span>

                    <span className="ml-auto text-white/20 text-[10px]">
                      {formatRelativeTime(t.updatedAt)}
                    </span>
                  </div>

                  <div
                    className={`text-[10px] mt-1 flex items-center gap-1 ${
                      STATUS_LABELS[t.status]?.cls
                    }`}
                  >
                    <FontAwesomeIcon icon={STATUS_LABELS[t.status]?.icon} />
                    {STATUS_LABELS[t.status]?.label}
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="p-2">
            <Pagination
              page={page}
              pages={Math.ceil(total / 10)}
              onPageChange={setPage}
            />
          </div>
        </div>

        <div className="flex-1 gaming-card flex flex-col overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-white/20 flex-col gap-3">
              <FontAwesomeIcon icon={faComments} className="text-5xl" />
              <div>Chọn ticket để phản hồi</div>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <div>
                  <div className="font-display font-bold text-white">
                    {selected.subject}
                  </div>

                  <div className="flex items-center gap-3 mt-0.5">
                    <div className="flex items-center gap-1.5">
                      <img
                        src={
                          selected.user?.avatar ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${selected.user?.username}`
                        }
                        alt=""
                        className="w-4 h-4 rounded-full"
                      />

                      <span className="text-white/40 text-xs">
                        @{selected.user?.username}
                      </span>
                    </div>

                    <span
                      className={`text-xs flex items-center gap-1 ${STATUS_LABELS[selected.status]?.cls}`}
                    >
                      <FontAwesomeIcon
                        icon={STATUS_LABELS[selected.status]?.icon}
                      />
                      {STATUS_LABELS[selected.status]?.label}
                    </span>

                    <span
                      className={`text-xs font-bold ${PRIORITY_COLORS[selected.priority]}`}
                    >
                      {selected.priority}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <select
                    onChange={(e) =>
                      handlePriority(selected.id, e.target.value)
                    }
                    value={selected.priority}
                    className="input-gaming text-xs py-1.5 px-2"
                  >
                    {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>

                  {selected.status !== 'CLOSED' && (
                    <button
                      onClick={() => handleClose(selected.id)}
                      className="text-xs border border-white/10 px-3 py-1.5 rounded-lg text-white/40 hover:text-white transition-colors flex items-center gap-1.5"
                    >
                      <FontAwesomeIcon icon={faCircleXmark} />
                      Đóng
                    </button>
                  )}
                </div>
              </div>

              <div
                ref={chatBoxRef}
                className="flex-1 overflow-y-auto p-4 space-y-3"
              >
                {messages.map((msg) => {
                  const isAdmin = msg.senderRole === 'ADMIN'

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-2.5 ${
                        isAdmin ? 'flex-row-reverse' : ''
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold border ${
                          isAdmin
                            ? 'bg-neon-pink/20 border-neon-pink/30 text-neon-pink'
                            : 'bg-dark-600 border-white/10 text-white'
                        }`}
                      >
                        {isAdmin ? (
                          <FontAwesomeIcon icon={faGear} />
                        ) : (
                          msg.senderId?.[0]?.toUpperCase() || '?'
                        )}
                      </div>

                      <div
                        className={`max-w-[70%] flex flex-col gap-1 ${
                          isAdmin ? 'items-end' : 'items-start'
                        }`}
                      >
                        <div className="text-[10px] text-white/30 flex items-center gap-1">
                          {isAdmin && (
                            <FontAwesomeIcon icon={faShieldHalved} />
                          )}

                          {isAdmin
                            ? 'Support'
                            : selected.user?.username}

                          {' · '}
                          {formatRelativeTime(msg.createdAt)}
                        </div>

                        <div
                          className={`rounded-2xl px-3 py-2 text-sm ${
                            isAdmin
                              ? 'bg-neon-pink/20 border border-neon-pink/20 text-white rounded-tr-none'
                              : 'bg-dark-600 border border-white/5 text-white/80 rounded-tl-none'
                          }`}
                        >
                          {msg.message}
                        </div>

                        {msg.imageUrl && (
                          <img
                            src={msg.imageUrl}
                            alt=""
                            className="max-w-[200px] rounded-xl border border-white/10"
                          />
                        )}
                      </div>
                    </div>
                  )
                })}

                <div ref={messagesEndRef} />
              </div>

              {selected.status !== 'CLOSED' ? (
                <form
                  onSubmit={handleSend}
                  className="p-4 border-t border-white/5 flex gap-3"
                >
                  <input
                    value={newMsg}
                    onChange={(e) => setNewMsg(e.target.value)}
                    placeholder="Phản hồi cho khách hàng..."
                    disabled={sending}
                    className="input-gaming flex-1 text-sm py-2"
                  />

                  <button
                    type="submit"
                    disabled={sending || !newMsg.trim()}
                    className="btn-primary px-4 py-2 text-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    {sending ? (
                      <Spinner size="sm" color="white" />
                    ) : (
                      <FontAwesomeIcon icon={faPaperPlane} />
                    )}
                  </button>
                </form>
              ) : (
                <div className="p-3 border-t border-white/5 text-center text-white/30 text-xs flex items-center justify-center gap-2">
                  <FontAwesomeIcon icon={faLock} />
                  Ticket đã đóng
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}