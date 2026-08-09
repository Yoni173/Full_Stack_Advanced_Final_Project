import { useState } from 'react'
import axios from 'axios'
import { useNavigate, Link } from 'react-router-dom' // ייבוא לניתוב ומעבר עמודים

/**
 * קומפוננטת הרשמה (Register)
 * אחראית על קבלת נתוני המשתמש החדש, שליחתם לשרת וניתוב חזרה להתחברות.
 */
function Register() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const navigate = useNavigate()

  // פונקציה לטיפול בשליחת טופס ההרשמה לשרת
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    try {
      // שליחת בקשת POST לנתיב ההרשמה ב-Backend
      const response = await axios.post('http://localhost:5001/api/auth/register', {
        username,
        email,
        password
      })

      console.log('Registration successful! 🚀', response.data)
      alert('ההרשמה בוצעה בהצלחה! כעת תוכל להתחבר למערכת.')

      // מעבר אוטומטי לעמוד ההתחברות לאחר רישום מוצלח
      navigate('/login')

    } catch (error: any) {
      console.error('Registration failed ❌', error.response?.data || error.message)
      setErrorMsg(error.response?.data?.message || 'שגיאה בהרשמה. בדוק את הנתונים ונסה שוב.')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px', margin: '40px auto', padding: '20px' }}>
      <h2>Register to Crypto Simulator 📝</h2>

      {/* הצגת הודעת שגיאה במידה והשרת דחה את הנתונים */}
      {errorMsg && <div style={{ color: '#ef4444', fontSize: '13px', textAlign: 'center' }}>{errorMsg}</div>}

      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input
          type="text"
          placeholder="Choose a username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
        />
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
        />
        <input
          type="password"
          placeholder="Enter your password (min 6 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
        />

        <button type="submit" style={{ padding: '10px', cursor: 'pointer', background: '#3861fb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>
          Sign Up
        </button>
      </form>

      {/* קישור חזרה לעמוד ההתחברות */}
      <p style={{ textAlign: 'center', fontSize: '13px', marginTop: '10px' }}>
        Already have an account? <Link to="/login" style={{ color: '#3861fb', fontWeight: 'bold' }}>Login here</Link>
      </p>
    </div>
  )
}

export default Register