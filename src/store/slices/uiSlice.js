import { createSlice } from '@reduxjs/toolkit'

const uiSlice = createSlice({
  name: 'ui',
  initialState: { sidebarOpen: false, unreadCount: 0 },
  reducers: {
    toggleSidebar: (s) => { s.sidebarOpen = !s.sidebarOpen },
    closeSidebar: (s) => { s.sidebarOpen = false },
    setUnreadCount: (s, a) => { s.unreadCount = a.payload },
    incrementUnread: (s) => { s.unreadCount++ }
  }
})
export const { toggleSidebar, closeSidebar, setUnreadCount, incrementUnread } = uiSlice.actions
export default uiSlice.reducer