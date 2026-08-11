import { useState, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom'
import { Sun, Moon, AlertTriangle } from 'lucide-react'
import { useTheme } from './context/ThemeContext'
import { useAppDispatch, useAppSelector } from './store/hooks'
import { fetchUserProfile, deleteAccount, resetUser } from './store/userSlice'
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
const AdminUsers = lazy(() => import('./components/AdminUsers'))

// המשתמש היחיד שרואה את קישור ה-Admin בתפריט - השרת אוכף את זה בכל מקרה בנפרד
const ADMIN_EMAIL = 'yonatan@test.com'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { isDarkMode, toggleTheme } = useTheme()
  const dispatch = useAppDispatch()
  const { username, email, profileStatus } = useAppSelector((state) => state.user)

  // בדיקה האם קיים טוקן שמור בדפדפן בעת טעינת האפליקציה
  useEffect(() => {
    const token = localStorage.getItem('token')
    setIsAuthenticated(!!token)
  }, [])

  useEffect(() => {
    if (isAuthenticated && profileStatus === 'idle') {
      dispatch(fetchUserProfile())
    }
  }, [isAuthenticated, profileStatus, dispatch])

  // פונקציית התנתקות - מחיקת הטוקן והחזרה למסך ההתחברות
  const handleLogout = () => {
    localStorage.removeItem('token')
    window.location.href = '/login'
  }

  // מחיקת חשבון לצמיתות - האישור עצמו קורה במודל המותאם אישית למטה, לא כאן
  const confirmDeleteAccount = async () => {
    setDeleting(true)
    try {
      await dispatch(deleteAccount()).unwrap()
      localStorage.removeItem('token')
      dispatch(resetUser())
      window.location.href = '/login'
    } catch {
      setDeleting(false)
      alert('Failed to delete account. Please try again.')
    }
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
                <span style={{ fontWeight: 900, color: isDarkMode ? '#fbbf24' : '#d97706' }}>Simulator</span>
              </span>
            </div>
            <nav style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
              <Link to="/dashboard" style={{ color: isDarkMode ? '#94a3b8' : '#64748b', textDecoration: 'none', fontWeight: 500 }}>Markets</Link>
              <Link to="/portfolio" style={{ color: isDarkMode ? '#94a3b8' : '#64748b', textDecoration: 'none', fontWeight: 500 }}>Portfolio</Link>
              <Link to="/trade" style={{ color: isDarkMode ? '#94a3b8' : '#64748b', textDecoration: 'none', fontWeight: 500 }}>Trade</Link>
              {email === ADMIN_EMAIL && (
                <Link to="/admin" style={{ color: '#3861fb', textDecoration: 'none', fontWeight: 700 }}>Admin</Link>
              )}

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

              {username && (
                <span style={{ color: isDarkMode ? '#94a3b8' : '#64748b', fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  Hi, {username}
                </span>
              )}

              <ProfileAvatar />

              <button onClick={handleLogout} style={{ background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.15)', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Logout</button>

              <button onClick={() => setShowDeleteModal(true)} title="Delete your account permanently" style={{ background: 'none', color: isDarkMode ? '#64748b' : '#94a3b8', border: 'none', padding: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 600, textDecoration: 'underline' }}>Delete Account</button>
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
            <Route path="/admin" element={isAuthenticated ? <AdminUsers /> : <Navigate to="/login" />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Suspense>

        {/* מודל אישור מחיקת חשבון - בנוי ידנית כדי שיהיה ניתן לעצב אותו (רקע אדום, טקסט מודגש),
            בניגוד ל-window.confirm() הרגיל של הדפדפן שאי אפשר לעצב בכלל */}
        {showDeleteModal && (
          <div
            onClick={() => !deleting && setShowDeleteModal(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 1000, padding: '20px'
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: isDarkMode ? '#111827' : '#ffffff',
                border: '1px solid #ef4444',
                borderRadius: '18px',
                maxWidth: '420px',
                width: '100%',
                padding: '28px',
                boxShadow: '0 25px 60px rgba(0,0,0,0.4)'
              }}
            >
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '52px', height: '52px', borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.12)', margin: '0 auto 16px'
              }}>
                <AlertTriangle size={26} color="#ef4444" />
              </div>

              <h2 style={{ margin: '0 0 12px', textAlign: 'center', fontSize: '19px', fontWeight: 900, color: isDarkMode ? '#f8fafc' : '#0f172a' }}>
                Delete your account?
              </h2>

              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px',
                padding: '14px 16px',
                marginBottom: '20px'
              }}>
                <p style={{ margin: 0, textAlign: 'center', fontSize: '14px', fontWeight: 700, color: '#ef4444', lineHeight: 1.5 }}>
                  This action is permanent and cannot be undone. Your portfolio and full transaction history will be deleted forever.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  style={{
                    flex: 1, padding: '12px', borderRadius: '10px',
                    border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0',
                    background: 'transparent', color: isDarkMode ? '#f8fafc' : '#0f172a',
                    fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteAccount}
                  disabled={deleting}
                  style={{
                    flex: 1, padding: '12px', borderRadius: '10px', border: 'none',
                    background: '#ef4444', color: '#ffffff', fontWeight: 800,
                    cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.7 : 1
                  }}
                >
                  {deleting ? 'Deleting...' : 'Delete Permanently'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Router>
  )
}

export default App
