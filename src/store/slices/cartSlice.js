import { createSlice } from '@reduxjs/toolkit'

const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: [] },
  reducers: {
    addToCart: (s, a) => { if (!s.items.find(i => i.id === a.payload.id)) s.items.push(a.payload) },
    removeFromCart: (s, a) => { s.items = s.items.filter(i => i.id !== a.payload) },
    clearCart: (s) => { s.items = [] }
  }
})
export const { addToCart, removeFromCart, clearCart } = cartSlice.actions
export default cartSlice.reducer