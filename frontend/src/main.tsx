import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './context/ThemeContext' // 🪙 יבוא הפרובאיידר של ה-Dark Mode
import { store } from './store/store' // ניהול State גלובלי (Redux) - פרופיל משתמש ויתרת מזומן

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </Provider>
  </StrictMode>,
)