import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import apiClient from '../config/api'

// Redux Slice לניהול State גלובלי של המשתמש: פרופיל, תמונת פרופיל ויתרת מזומן.
// מקור אמת אחד ומשותף לכל הקומפוננטות שצריכות את זה (Header, Dashboard, Portfolio, Trade),
// כדי שעדכון יתרה במסך אחד (למשל אחרי קנייה) ישתקף מיד בכל שאר המסכים.

interface UserState {
  username: string | null
  email: string | null
  avatarUrl: string | null
  cashBalance: number | null
  profileStatus: 'idle' | 'loading' | 'succeeded' | 'failed'
  balanceStatus: 'idle' | 'loading' | 'succeeded' | 'failed'
  avatarUploading: boolean
}

const initialState: UserState = {
  username: null,
  email: null,
  avatarUrl: null,
  cashBalance: null,
  profileStatus: 'idle',
  balanceStatus: 'idle',
  avatarUploading: false
}

export const fetchUserProfile = createAsyncThunk('user/fetchProfile', async () => {
  const res = await apiClient.get('/api/auth/me')
  return res.data as { username: string; email: string; avatarUrl: string | null }
})

export const fetchCashBalance = createAsyncThunk('user/fetchBalance', async () => {
  const res = await apiClient.get('/api/crypto/balance')
  return res.data.cashBalance as number
})

export const depositCash = createAsyncThunk('user/deposit', async (amount: number) => {
  const res = await apiClient.post('/api/crypto/deposit', { amount })
  return res.data as { cashBalance: number; transaction: any }
})

export const deleteAccount = createAsyncThunk('user/deleteAccount', async () => {
  await apiClient.delete('/api/auth/me')
})

export const uploadAvatar = createAsyncThunk('user/uploadAvatar', async (file: File) => {
  const formData = new FormData()
  formData.append('avatar', file)
  const res = await apiClient.post('/api/upload/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return res.data.avatarUrl as string
})

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // איפוס מלא של המצב הגלובלי בהתנתקות, כדי שלא יישארו נתונים של המשתמש הקודם
    resetUser: () => initialState,
    // עדכון מיידי של היתרה מקומית (למשל מיד אחרי קנייה/מכירה, בלי לחכות ל-fetch נוסף)
    setCashBalance: (state, action) => {
      state.cashBalance = action.payload
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => { state.profileStatus = 'loading' })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.profileStatus = 'succeeded'
        state.username = action.payload.username
        state.email = action.payload.email
        state.avatarUrl = action.payload.avatarUrl
      })
      .addCase(fetchUserProfile.rejected, (state) => { state.profileStatus = 'failed' })

      .addCase(fetchCashBalance.pending, (state) => { state.balanceStatus = 'loading' })
      .addCase(fetchCashBalance.fulfilled, (state, action) => {
        state.balanceStatus = 'succeeded'
        state.cashBalance = action.payload
      })
      .addCase(fetchCashBalance.rejected, (state) => { state.balanceStatus = 'failed' })

      .addCase(depositCash.fulfilled, (state, action) => {
        state.cashBalance = action.payload.cashBalance
      })

      .addCase(uploadAvatar.pending, (state) => { state.avatarUploading = true })
      .addCase(uploadAvatar.fulfilled, (state, action) => {
        state.avatarUploading = false
        state.avatarUrl = action.payload
      })
      .addCase(uploadAvatar.rejected, (state) => { state.avatarUploading = false })
  }
})

export const { resetUser, setCashBalance } = userSlice.actions
export default userSlice.reducer
