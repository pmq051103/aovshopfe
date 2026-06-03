import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import uiReducer from './slices/uiSlice'
import cartReducer from './slices/cartSlice'
import adminNotifReducer from './slices/adminNotifSlice'
import chatReducer       from './slices/chatSlice'
 
export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    cart: cartReducer,
    adminNotif: adminNotifReducer,
    chat      : chatReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false })
})