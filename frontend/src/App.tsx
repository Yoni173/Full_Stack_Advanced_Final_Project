import { useState, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom'
import { Sun, Moon } from 'lucide-react' // 🪙 יבוא אייקונים מתאימים
import { useTheme } from './context/ThemeContext' // 🪙 יבוא ההוק של ה-Theme
import Logo from './components/Logo'
import ProfileAvatar from './components/ProfileAvatar'

// טעינה עצלה (Lazy Loading) של דפי האפליקציה - כל דף נטען רק כשבאמת נכנסים אליו,
// כדי לצמצם את חבילת ה-JS הראשונית שהדפדפן צריך להוריד
const Login = lazy(() => import('./components/Login'))
const Register = lazy(() => import('./components/Register'))
const Dashboard = lazy(() => import('./components/Dashboard'))
const Portfolio = lazy(() => import('./components/Portfolio'))
const CoinDetails = lazy(() => import('./components/CoinDetails'))
const Trade = lazy(() => import('./components/Trade'))

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const { isDarkMode, toggleTheme } = useTheme() // 🪙 שימוש במצב הכהה

  // בדיקה האם קיים טוקן שמור בדפדפן בעת טעינת האפליקציה
  useEffect(() => {
    const token = localStorage.getItem('token')
    setIsAuthenticated(!!token)
  }, [])

  // פונקציית התנתקות - מחיקת הטוקן והחזרה למסך ההתחברות
  const handleLogout = () => {
    localStorage.removeItem('token')
    window.location.href = '/login'
  }

  // הצגת מסך טעינה בזמן בדיקת הסטטוס הראשונית
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

        {/* תפריט ניווט עליון שמופיע רק למשתמשים מחוברים */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Logo size={38} />
              <span style={{ fontSize: '25px', letterSpacing: '-0.015em', whiteSpace: 'nowrap' }}>
                <span style={{ fontWeight: 700, color: isDarkMode ? '#f8fafc' : '#0f172a' }}>Crypto</span>
                <span style={{ fontWeight: 900, color: isDarkMode ? '#fbbf24' : '#d97706' }}>Vault</span>
              </span>
            </div>
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

              <ProfileAvatar />

              <button onClick={handleLogout} style={{ background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.15)', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Logout</button>
            </nav>
          </header>
        )}

        {/* ניהול נתיבים מאובטחים באפליקציה (Protected Routes) */}
        <Suspense fallback={<div style={{ textAlign: 'center', marginTop: '80px', color: isDarkMode ? '#94a3b8' : '#64748b' }}>Loading...</div>}>
          <Routes>
            <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
            <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
            <Route path="/balance" element={isAuthenticated ? <Navigate to="/portfolio" /> : <Navigate to="/login" />} />
            <Route path="/portfolio" element={isAuthenticated ? <Portfolio /> : <Navigate to="/login" />} />
            <Route path="/coin/:coinId" element={isAuthenticated ? <CoinDetails /> : <Navigate to="/login" />} />
            <Route path="/trade" element={isAuthenticated ? <Trade /> : <Navigate to="/login" />} />
            <Route path="/trade/:action/:coinId" element={isAuthenticated ? <Trade /> : <Navigate to="/login" />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  )
}

export default App
