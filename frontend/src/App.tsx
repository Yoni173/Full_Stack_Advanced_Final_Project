import { useState, useEffect } from 'react'
import Login from './components/Login'
import Dashboard from './components/Dashboard' // 1. ייבוא הרכיב החדש

function App() {
  // משתנה המצב שקובע האם המשתמש מחובר
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // בדיקה האם קיים טוקן בזיכרון של הדפדפן
    const token = localStorage.getItem('token')
    if (token) {
      setIsAuthenticated(true)
    }
  }, []) // מערך ריק אומר שהקוד ירוץ רק פעם אחת - כשהאפליקציה עולה

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Crypto Simulator 🪙</h1>
      
      {/* 2. התנאי שמציג את ה-Dashboard במידה והמשתמש מחובר */}
      {isAuthenticated ? (
        <Dashboard /> 
      ) : (
        <Login onLoginSuccess={() => setIsAuthenticated(true)} />
      )}
    </div>
  )
}

export default App