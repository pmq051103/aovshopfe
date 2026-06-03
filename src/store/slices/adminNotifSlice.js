import { createSlice } from '@reduxjs/toolkit'

const STORAGE_KEY = 'adminNotifCounts'

// Load từ localStorage khi khởi động
const loadFromStorage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  return null
}

const saveToStorage = (counts) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(counts))
  } catch {}
}

const defaultCounts = {
  '/admin/orders': 0,
  '/admin/deposits': 0,
  '/admin/tickets': 0,
  '/admin/topup': 0,
  '/admin/card-config': 0,
}

const initialState = {
  counts: loadFromStorage() || defaultCounts
}

const adminNotifSlice = createSlice({
  name: 'adminNotif',
  initialState,
  reducers: {
    incrementMenu: (state, action) => {
      const key = action.payload
      if (state.counts[key] !== undefined) {
        state.counts[key]++
        saveToStorage(state.counts)
      }
    },
    clearMenu: (state, action) => {
      const key = action.payload
      if (state.counts[key] !== undefined) {
        state.counts[key] = 0
        saveToStorage(state.counts)
      }
    },
    clearAll: (state) => {
      Object.keys(state.counts).forEach(k => { state.counts[k] = 0 })
      saveToStorage(state.counts)
    },
    // Sync từ DB khi admin load trang (số thực từ server)
    syncFromServer: (state, action) => {
      const serverCounts = action.payload // { '/admin/tickets': 3, ... }
      Object.entries(serverCounts).forEach(([key, val]) => {
        if (state.counts[key] !== undefined) {
          state.counts[key] = val
        }
      })
      saveToStorage(state.counts)
    }
  }
})

export const { incrementMenu, clearMenu, clearAll, syncFromServer } = adminNotifSlice.actions

// Selector: tổng badge cho 1 nhóm menu (dựa vào danh sách route con)
export const selectGroupTotal = (routes) => (state) =>
  routes.reduce((sum, r) => sum + (state.adminNotif.counts[r] || 0), 0)

export const selectMenuCount = (route) => (state) =>
  state.adminNotif.counts[route] || 0

export default adminNotifSlice.reducer