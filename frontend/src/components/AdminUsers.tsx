import { useState, useEffect } from 'react'
import apiClient from '../config/api'
import { useTheme } from '../context/ThemeContext'
import { Users, ShieldAlert } from 'lucide-react'

interface AdminUser {
  _id: string
  username: string
  email: string
  cashBalance: number
  createdAt: string
  lastLoginAt: string | null
}

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'Never'

// מסך אדמין - רשימת כל המשתמשים הרשומים ומועד ההתחברות האחרון שלהם.
// השרת בעצמו בודק שרק המשתמש עם ADMIN_EMAIL רשאי לקבל את הנתונים; אם מישהו אחר יגיע לכאן
// (למשל דרך הקלדת הכתובת ידנית) הוא פשוט יקבל שגיאת 403 מהשרת ויראה הודעת "Access denied".
function AdminUsers() {
  const { isDarkMode } = useTheme()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await apiClient.get('/api/auth/users')
        setUsers(res.data)
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load users list.')
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  const textColor = isDarkMode ? '#f8fafc' : '#0f172a'
  const mutedColor = isDarkMode ? '#94a3b8' : '#64748b'
  const panelBg = isDarkMode ? '#111827' : '#ffffff'
  const borderColor = isDarkMode ? '#1f2937' : '#e2e8f0'

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '100px', color: mutedColor, fontWeight: 700 }}>Loading users...</div>
  }

  if (error) {
    return (
      <div style={{ maxWidth: '500px', margin: '100px auto', textAlign: 'center', color: '#ef4444' }}>
        <ShieldAlert size={32} style={{ marginBottom: '10px' }} />
        <p style={{ fontWeight: 700 }}>{error}</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '40px auto', padding: '0 24px', direction: 'ltr', color: textColor }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
        <Users size={26} color="#3861fb" />
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 900 }}>Registered Users ({users.length})</h1>
      </div>

      <div style={{ background: panelBg, border: `1px solid ${borderColor}`, borderRadius: '18px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: '640px', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${borderColor}`, color: mutedColor, fontSize: '12px', fontWeight: 900 }}>
                <th style={{ padding: '16px' }}>Username</th>
                <th style={{ padding: '16px' }}>Email</th>
                <th style={{ padding: '16px' }}>Cash Balance</th>
                <th style={{ padding: '16px' }}>Registered</th>
                <th style={{ padding: '16px' }}>Last Login</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id} style={{ borderBottom: `1px solid ${borderColor}`, fontSize: '13.5px' }}>
                  <td style={{ padding: '16px', fontWeight: 800 }}>{user.username}</td>
                  <td style={{ padding: '16px', color: mutedColor }}>{user.email}</td>
                  <td style={{ padding: '16px', fontWeight: 700 }}>${user.cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td style={{ padding: '16px', color: mutedColor }}>{formatDate(user.createdAt)}</td>
                  <td style={{ padding: '16px', color: mutedColor }}>{formatDate(user.lastLoginAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AdminUsers
