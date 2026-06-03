// authSlice.js (UPDATED - thêm googleLogin)
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../api/axios'

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', credentials)
    localStorage.setItem('accessToken', data.data.accessToken)
    localStorage.setItem('refreshToken', data.data.refreshToken)
    return data.data
  } catch (e) { return rejectWithValue(e.response?.data?.message || 'Lỗi đăng nhập') }
})

// ✅ Google OAuth login
export const googleLogin = createAsyncThunk('auth/googleLogin', async (credential, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/google', { credential })
    localStorage.setItem('accessToken', data.data.accessToken)
    localStorage.setItem('refreshToken', data.data.refreshToken)
    return data.data
  } catch (e) { return rejectWithValue(e.response?.data?.message || 'Đăng nhập Google thất bại') }
})

export const register = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/register', userData)
    localStorage.setItem('accessToken', data.data.accessToken)
    localStorage.setItem('refreshToken', data.data.refreshToken)
    return data.data
  } catch (e) { return rejectWithValue(e.response?.data?.message || 'Lỗi đăng ký') }
})

export const fetchMe = createAsyncThunk('auth/fetchMe', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/auth/me')
    return data.data
  } catch (e) { return rejectWithValue(null) }
})

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  try { await api.post('/auth/logout') } catch(e) {}
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
})

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, loading: false, error: null, initialized: false },
  reducers: {
    updateBalance: (state, action) => { if (state.user) state.user.balance = action.payload },
    updateQuanHuy: (state, action) => { if (state.user) state.user.quanHuyBalance = action.payload },
    clearError: (state) => { state.error = null },
    updateUser: (state, action) => { if (state.user) state.user = { ...state.user, ...action.payload } }
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (s) => { s.loading = true; s.error = null })
      .addCase(login.fulfilled, (s, a) => { s.loading = false; s.user = a.payload.user })
      .addCase(login.rejected, (s, a) => { s.loading = false; s.error = a.payload })

      // ✅ Google Login cases
      .addCase(googleLogin.pending, (s) => { s.loading = true; s.error = null })
      .addCase(googleLogin.fulfilled, (s, a) => { s.loading = false; s.user = a.payload.user })
      .addCase(googleLogin.rejected, (s, a) => { s.loading = false; s.error = a.payload })

      .addCase(register.pending, (s) => { s.loading = true; s.error = null })
      .addCase(register.fulfilled, (s, a) => { s.loading = false; s.user = a.payload.user })
      .addCase(register.rejected, (s, a) => { s.loading = false; s.error = a.payload })
      .addCase(fetchMe.fulfilled, (s, a) => { s.user = a.payload; s.initialized = true })
      .addCase(fetchMe.rejected, (s) => { s.initialized = true })
      .addCase(logoutUser.fulfilled, (s) => { s.user = null })
  }
})

export const { updateBalance, updateQuanHuy, clearError, updateUser } = authSlice.actions
export default authSlice.reducer