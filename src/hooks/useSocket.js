import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { useDispatch, useSelector } from 'react-redux'
import { fetchMe } from '../store/slices/authSlice'
import { incrementUnread } from '../store/slices/uiSlice'
import { incrementMenu } from '../store/slices/adminNotifSlice'
import toast from 'react-hot-toast'

let socketInstance = null

export const useSocket = () => {
  // ✅ Fix: chỉ dùng user.id thay vì toàn bộ user object
  // Trước đây dùng [user, dispatch] → mỗi khi user object re-render (dù cùng người)
  // hook chạy lại → socket destroy/tạo mới → ECONNABORTED hàng loạt
  const userId = useSelector(s => s.auth.user?.id)
  const dispatch = useDispatch()
  const socketRef = useRef(null)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')

    if (!socketInstance || socketInstance.disconnected) {
      if (socketInstance) {
        socketInstance.removeAllListeners()
        socketInstance.disconnect()
        socketInstance = null
      }

      socketInstance = io(import.meta.env.VITE_SOCKET_URL || '', {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000,
        timeout: 20000,
      })
    }

    socketRef.current = socketInstance

    socketInstance.on('connect', () => console.log('✅ Socket connected'))
    socketInstance.on('disconnect', (reason) => {
      console.warn('⚠️ Socket disconnected:', reason)
      if (reason === 'io server disconnect') {
        socketInstance.connect()
      }
    })
    socketInstance.on('connect_error', (err) => {
      console.warn('Socket connect error (sẽ tự retry):', err.message)
    })

    socketInstance.on('notification', (data) => {
      dispatch(incrementUnread())
      toast(data.message || data.title, {
        icon: data.type === 'PURCHASE' ? '🛒' : data.type === 'DEPOSIT' ? '💰' : '🔔',
        style: { background: '#14141f', color: '#fff', border: '1px solid rgba(255,45,115,0.3)' }
      })
    })

    socketInstance.on('deposit:success', (data) => {
      toast.success(`Nạp tiền thành công: +${parseInt(data.amount).toLocaleString('vi-VN')}đ`, {
        style: { background: '#14141f', color: '#fff', border: '1px solid rgba(0,255,136,0.5)' }
      })
    })

    socketInstance.on('balance:update', () => {
      dispatch(fetchMe())
    })

    socketInstance.on('wheel:winner', (data) => {
      if (['LEGENDARY', 'MYTHIC'].includes(data.rarity)) {
        toast(`🎰 ${data.username} vừa nhận ${data.reward}!`, {
          style: { background: 'linear-gradient(135deg,#14141f,#1a1a2e)', color: '#ffd700', border: '1px solid rgba(255,215,0,0.5)' },
          duration: 5000
        })
      }
    })

    socketInstance.on('mysterybox:winner', (data) => {
      if (['LEGENDARY', 'MYTHIC'].includes(data.rarity)) {
        toast(`🎁 ${data.username} vừa mở ${data.categoryName} nhận acc ${data.rank}!`, {
          style: { background: 'linear-gradient(135deg,#14141f,#1a1a2e)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.6)' },
          duration: 6000,
          icon: '🏆'
        })
      }
    })

    socketInstance.on('box:winner', (data) => {
      if (['LEGENDARY', 'MYTHIC'].includes(data.rarity)) {
        toast(`📦 ${data.username} mở ${data.boxName} nhận ${data.reward}!`, {
          style: { background: 'linear-gradient(135deg,#14141f,#1a1a2e)', color: '#ffd700', border: '1px solid rgba(255,215,0,0.5)' },
          duration: 5000
        })
      }
    })

    socketInstance.on('admin:new_order',        () => { dispatch(incrementMenu('/admin/orders')) })
    socketInstance.on('admin:new_deposit',       () => { dispatch(incrementMenu('/admin/deposits')) })
    socketInstance.on('ticket:new',              () => { dispatch(incrementMenu('/admin/tickets')) })
    socketInstance.on('ticket:reply',            () => { dispatch(incrementMenu('/admin/tickets')) })
    socketInstance.on('topup:new_order',         () => { dispatch(incrementMenu('/admin/topup')) })
    socketInstance.on('admin:new_card_deposit',  () => { dispatch(incrementMenu('/admin/card-config')) })

    socketInstance.on('admin:deposit_update', (data) => {
      const icon  = data.status === 'COMPLETED' ? '✅' : data.status === 'FAILED' ? '❌' : '⏰'
      const label = data.status === 'COMPLETED' ? 'Thanh toán thành công' : data.status === 'FAILED' ? 'Thanh toán thất bại' : 'Lệnh nạp hết hạn'
      const amount = data.amount ? ` — ${parseInt(data.amount).toLocaleString('vi-VN')}đ` : ''
      toast(`${icon} [Nạp tiền] ${label}${amount}`, {
        style: { background: '#14141f', color: '#fff', border: '1px solid rgba(255,45,115,0.3)' },
        duration: 5000
      })
    })

    socketInstance.on('admin:card_deposit_update', (data) => {
      const icon  = data.status === 'SUCCESS' ? '✅' : data.status === 'WRONG_VALUE' ? '⚠️' : '❌'
      const label = data.status === 'SUCCESS' ? 'Thẻ hợp lệ' : data.status === 'WRONG_VALUE' ? 'Sai mệnh giá' : 'Thẻ lỗi'
      toast(`${icon} [Thẻ ${data.telco || ''}] ${label}`, {
        style: { background: '#14141f', color: '#fff', border: '1px solid rgba(255,45,115,0.3)' },
        duration: 5000
      })
    })

    return () => {
      socketInstance?.off('connect')
      socketInstance?.off('disconnect')
      socketInstance?.off('connect_error')
      socketInstance?.off('notification')
      socketInstance?.off('deposit:success')
      socketInstance?.off('balance:update')
      socketInstance?.off('wheel:winner')
      socketInstance?.off('box:winner')
      socketInstance?.off('mysterybox:winner')
      socketInstance?.off('admin:new_order')
      socketInstance?.off('admin:new_deposit')
      socketInstance?.off('ticket:new')
      socketInstance?.off('ticket:reply')
      socketInstance?.off('topup:new_order')
      socketInstance?.off('admin:new_card_deposit')
      socketInstance?.off('admin:deposit_update')
      socketInstance?.off('admin:card_deposit_update')
    }
  }, [userId, dispatch])

  return socketRef.current
}