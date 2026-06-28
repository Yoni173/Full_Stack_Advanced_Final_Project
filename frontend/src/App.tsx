import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom'
import { Sun, Moon } from 'lucide-react' // 🪙 יבוא אייקונים מתאימים
import { useTheme } from './context/ThemeContext' // 🪙 יבוא ההוק של ה-Theme
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import Portfolio from './components/Portfolio'
import CoinDetails from './components/CoinDetails'
import Trade from './components/Trade'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const { isDarkMode, toggleTheme } = useTheme() // 🪙 שימוש במצב הכהה

  useEffect(() => {
    const token = localStorage.getItem('token')
    setIsAuthenticated(!!token)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    window.location.href = '/login'
  }

  if (isAuthenticated === null) return <div style={{ color: '#333', textAlign: 'center', marginTop: '50px' }}>Loading...</div>

  return (
    <Router>
      {/* עיצוב דינמי של קונטיינר האפליקציה הראשי */}
      <div style={{
        minHeight: '100vh',
        backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc',
        color: isDarkMode ? '#f8fafc' : '#1e293b',
        fontFamily: '"Inter", sans-serif',
        transition: 'background-color 0.3s ease'
      }}>

        {isAuthenticated && (
          <header style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 40px',
            background: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.4)',
            backdropFilter: 'blur(20px)',
            borderBottom: isDarkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)',
            position: 'sticky',
            top: 0,
            zIndex: 100
          }}>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#3861fb' }}>CryptoSimulator 🪙</div>
            <nav style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
              <Link to="/dashboard" style={{ color: isDarkMode ? '#94a3b8' : '#64748b', textDecoration: 'none', fontWeight: 500 }}>Markets</Link>
              <Link to="/portfolio" style={{ color: isDarkMode ? '#94a3b8' : '#64748b', textDecoration: 'none', fontWeight: 500 }}>Portfolio</Link>
              <Link to="/trade" style={{ color: isDarkMode ? '#94a3b8' : '#64748b', textDecoration: 'none', fontWeight: 500 }}>Trade</Link>

              {/* כפתור מחליף ה-Theme החכם */}
              <button
                onClick={toggleTheme}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: isDarkMode ? '#fbbf24' : '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px'
                }}
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              <button onClick={handleLogout} style={{ background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.15)', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Logout</button>
            </nav>
          </header>
        )}

        <Routes>
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/portfolio" element={isAuthenticated ? <Portfolio /> : <Navigate to="/login" />} />
          <Route path="/coin/:coinId" element={isAuthenticated ? <CoinDetails /> : <Navigate to="/login" />} />
          <Route path="/trade" element={isAuthenticated ? <Trade /> : <Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App