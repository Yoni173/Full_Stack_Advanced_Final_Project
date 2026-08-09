import axios from 'axios'

// כתובת ה-API מגיעה ממשתנה סביבה (VITE_API_URL) כדי שהאתר יעבוד גם אחרי דיפלוי,
// ונופלת חזרה ל-localhost רק לפיתוח מקומי
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

const apiClient = axios.create({
  baseURL: API_BASE_URL
})

// מצמיד אוטומטית את טוקן ה-JWT לכל בקשה, כדי שלא נצטרך לחזור על זה בכל קומפוננטה
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default apiClient
