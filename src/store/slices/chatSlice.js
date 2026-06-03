/**
 * chatSlice.js — Redux state cho AI Chat Assistant
 * Quản lý: danh sách session, session đang active, messages, loading states
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../api/axios'

/* ── Async Thunks ─────────────────────────────────────── */

export const fetchSessions = createAsyncThunk(
  'chat/fetchSessions',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/chat/sessions')
      return data.data
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Lỗi tải sessions')
    }
  }
)

export const createSession = createAsyncThunk(
  'chat/createSession',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/chat/session')
      return data.data
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Lỗi tạo session')
    }
  }
)

export const loadSession = createAsyncThunk(
  'chat/loadSession',
  async (sessionId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/chat/session/${sessionId}`)
      return data.data
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Lỗi tải session')
    }
  }
)

export const deleteSession = createAsyncThunk(
  'chat/deleteSession',
  async (sessionId, { rejectWithValue }) => {
    try {
      await api.delete(`/chat/session/${sessionId}`)
      return sessionId
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Lỗi xóa session')
    }
  }
)

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ sessionId, message }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/chat/message', { sessionId, message })
      return { sessionId, responseData: data.data }
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Lỗi gửi tin nhắn')
    }
  }
)

export const updateSessionTitle = createAsyncThunk(
  'chat/updateSessionTitle',
  async ({ sessionId, title }, { rejectWithValue }) => {
    try {
      await api.patch(`/chat/session/${sessionId}/title`, { title })
      return { sessionId, title }
    } catch (e) {
      return rejectWithValue(e.response?.data?.message)
    }
  }
)

/* ── Initial State ───────────────────────────────────── */
const initialState = {
  sessions       : [],        // Danh sách sessions (sidebar)
  activeSessionId: null,      // Session đang xem
  messages       : [],        // Messages của session đang active
  loading        : false,     // Loading sessions list
  sessionLoading : false,     // Loading khi switch session
  sending        : false,     // Đang gửi tin nhắn
  error          : null,
}

/* ── Helper: Chuyển DB message → UI message ─────────── */
function dbMsgToUiMsg(m) {
  let metadata = {}
  try { metadata = m.metadata ? JSON.parse(m.metadata) : {} } catch {}

  return {
    id       : m.id,
    role     : m.role,        // "user" | "assistant"
    content  : m.content,
    metadata,
    createdAt: m.createdAt,
    ts       : new Date(m.createdAt).getTime(),
    // Parsed tool result data (empty for DB-loaded messages)
    toolData : null,
  }
}

/* ── Slice ───────────────────────────────────────────── */
const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveSession(state, action) {
      state.activeSessionId = action.payload
    },
    clearMessages(state) {
      state.messages = []
    },
    // Optimistic: thêm user message ngay lập tức trước khi API trả về
    addOptimisticUserMessage(state, action) {
      state.messages.push({
        id       : `optimistic-${Date.now()}`,
        role     : 'user',
        content  : action.payload,
        createdAt: new Date().toISOString(),
        ts       : Date.now(),
        toolData : null,
      })
    },
    clearError(state) {
      state.error = null
    },
    resetChat(state) {
      return initialState
    },
  },
  extraReducers: (builder) => {

    /* fetchSessions */
    builder
      .addCase(fetchSessions.pending, (state) => { state.loading = true })
      .addCase(fetchSessions.fulfilled, (state, action) => {
        state.loading  = false
        state.sessions = action.payload
      })
      .addCase(fetchSessions.rejected, (state, action) => {
        state.loading = false
        state.error   = action.payload
      })

    /* createSession */
    builder.addCase(createSession.fulfilled, (state, action) => {
      const newSession = {
        ...action.payload,
        title      : 'Cuộc trò chuyện mới',
        lastMessage: null,
      }
      state.sessions        = [newSession, ...state.sessions]
      state.activeSessionId = action.payload.id
      state.messages        = []
    })

    /* loadSession */
    builder
      .addCase(loadSession.pending, (state) => {
        state.sessionLoading = true
        state.messages       = []
      })
      .addCase(loadSession.fulfilled, (state, action) => {
        state.sessionLoading  = false
        state.activeSessionId = action.payload.id
        state.messages        = (action.payload.messages || []).map(dbMsgToUiMsg)
      })
      .addCase(loadSession.rejected, (state) => {
        state.sessionLoading = false
      })

    /* deleteSession */
    builder.addCase(deleteSession.fulfilled, (state, action) => {
      state.sessions = state.sessions.filter(s => s.id !== action.payload)
      if (state.activeSessionId === action.payload) {
        state.activeSessionId = state.sessions[0]?.id || null
        state.messages        = []
      }
    })

    /* sendMessage */
    builder
      .addCase(sendMessage.pending, (state) => { state.sending = true })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const { sessionId, responseData } = action.payload
        state.sending = false

        // Thêm assistant message với full tool data
        const assistantMsg = {
          id       : `ai-${Date.now()}`,
          role     : 'assistant',
          content  : responseData.reply,
          createdAt: new Date().toISOString(),
          ts       : Date.now(),
          toolData : responseData,  // Chứa accounts, orders, v.v.
        }
        state.messages = [...state.messages, assistantMsg]

        // Update session title nếu được trả về
        if (responseData.sessionId) {
          const idx = state.sessions.findIndex(s => s.id === sessionId || s.id === responseData.sessionId)
          if (idx >= 0) {
            state.sessions[idx].updatedAt   = new Date().toISOString()
            state.sessions[idx].lastMessage = { role: 'assistant', content: responseData.reply }
          }
        }

        // Cập nhật activeSessionId nếu là session mới
        if (responseData.sessionId && responseData.sessionId !== state.activeSessionId) {
          state.activeSessionId = responseData.sessionId
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.sending = false
        state.error   = action.payload
        // Xóa optimistic message nếu lỗi
        state.messages = state.messages.filter(m => !m.id.startsWith('optimistic-'))
      })

    /* updateSessionTitle */
    builder.addCase(updateSessionTitle.fulfilled, (state, action) => {
      const { sessionId, title } = action.payload
      const idx = state.sessions.findIndex(s => s.id === sessionId)
      if (idx >= 0) state.sessions[idx].title = title
    })
  },
})

export const {
  setActiveSession, clearMessages, addOptimisticUserMessage, clearError, resetChat
} = chatSlice.actions

export default chatSlice.reducer
