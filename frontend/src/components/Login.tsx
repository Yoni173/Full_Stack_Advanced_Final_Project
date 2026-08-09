import { useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom' // 🪙 ייבוא לצורך מעבר נוח לעמוד ההרשמה

/**
 * הגדרת "תעודת הזהות" (TypeScript Interface) עבור ה-Props שהרכיב מקבל.
 * מבטיח שהפונקציה תופעל רק בצורה תקינה.
 */
interface LoginProps {
  onLoginSuccess?: () => void;
}

/**
 * קומפוננטת התחברות (Login)
 * אחראית על איסוף פרטי המשתמש, שליחתם לשרת וקבלת טוקן ה-JWT המאובטח.
 */
function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // פונקציה המטפלת בלחיצה על כפתור ההתחברות ושליחת הנתונים לשרת
  const handleSubmit = async () => {
    try {
      // ביצוע בקשת POST לשרת בנתיב ההתחברות המאובטח
      const response = await axios.post('http://localhost:5001/api/auth/login', {
        email,
        password
      });

      // שמירת ה-Token שהתקבל מהשרת בזיכרון המקומי של הדפדפן (localStorage)
      localStorage.setItem('token', response.data.token);

      console.log('Login successful! 🎉', response.data);

      // הפעלת פונקציית העדכון (אם קיימת) כדי לעדכן שהמשתמש מחובר
      if (onLoginSuccess) {
        onLoginSuccess();
      } else {
        // רענון או מעבר אוטומטי לדשבורד במידת הצורך
        window.location.href = '/dashboard';
      }

    } catch (error: any) {
      // טיפול בשגיאות התחברות והצגת הודעה מפורטת בקונסול ובמסך
      console.error('Login failed ❌', error.response?.data || error.message);
      alert(error.response?.data?.message || 'Login failed. Check the console for details.');
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px', margin: '40px auto', padding: '20px' }}>
      <h2>Login to Crypto Simulator 🔑</h2>

      {/* שדה הזנת אימייל */}
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
      />

      {/* שדה הזנת סיסמה */}
      <input
        type="password"
        placeholder="Enter your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
      />

      {/* כפתור שליחת הטופס */}
      <button style={{ padding: '10px', cursor: 'pointer', background: '#3861fb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold' }} onClick={handleSubmit}>
        Login
      </button>

      {/* קישור מעבר לעמוד ההרשמה עבור משתמשים חדשים */}
      <p style={{ textAlign: 'center', fontSize: '13px', marginTop: '10px' }}>
        Don't have an account? <Link to="/register" style={{ color: '#3861fb', fontWeight: 'bold' }}>Register here</Link>
      </p>
    </div>
  )
}

export default Login