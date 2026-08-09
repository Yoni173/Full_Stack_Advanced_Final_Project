import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom' // 🪙 ייבוא לצורך מעבר נוח לעמוד ההרשמה
import apiClient from '../config/api'

/**
 * הגדרת "תעודת הזהות" (TypeScript Interface) עבור ה-Props שהרכיב מקבל.
 * מבטיח שהפונקציה תופעל רק בצורה תקינה.
 */
interface LoginProps {
  onLoginSuccess?: () => void;
}

interface LoginFormData {
  email: string
  password: string
}

const inputStyle = { padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }

/**
 * קומפוננטת התחברות (Login)
 * אחראית על איסוף פרטי המשתמש, שליחתם לשרת וקבלת טוקן ה-JWT המאובטח.
 */
function Login({ onLoginSuccess }: LoginProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<LoginFormData>()

  // פונקציה המטפלת בשליחת הטופס לאחר שעבר ולידציה בצד הלקוח
  const onSubmit = async (data: LoginFormData) => {
    try {
      // ביצוע בקשת POST לשרת בנתיב ההתחברות המאובטח
      const response = await apiClient.post('/api/auth/login', data)

      // שמירת ה-Token שהתקבל מהשרת בזיכרון המקומי של הדפדפן (localStorage)
      localStorage.setItem('token', response.data.token)

      // הפעלת פונקציית העדכון (אם קיימת) כדי לעדכן שהמשתמש מחובר
      if (onLoginSuccess) {
        onLoginSuccess()
      } else {
        // רענון או מעבר אוטומטי לדשבורד במידת הצורך
        window.location.href = '/dashboard'
      }
    } catch (error: any) {
      // טיפול בשגיאות התחברות - מוצג ישירות מתחת לטופס במקום alert
      setError('root', { message: error.response?.data?.message || 'Login failed. Please try again.' })
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px', margin: '40px auto', padding: '20px' }}>
      <h2>Login to CryptoVault 🔑</h2>

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }} noValidate>
        {/* שדה הזנת אימייל */}
        <input
          type="email"
          placeholder="Enter your email"
          style={inputStyle}
          {...register('email', {
            required: 'Email is required',
            pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address' }
          })}
        />
        {errors.email && <span style={{ color: '#ef4444', fontSize: '12px' }}>{errors.email.message}</span>}

        {/* שדה הזנת סיסמה */}
        <input
          type="password"
          placeholder="Enter your password"
          style={inputStyle}
          {...register('password', { required: 'Password is required' })}
        />
        {errors.password && <span style={{ color: '#ef4444', fontSize: '12px' }}>{errors.password.message}</span>}

        {errors.root && <div style={{ color: '#ef4444', fontSize: '13px', textAlign: 'center' }}>{errors.root.message}</div>}

        {/* כפתור שליחת הטופס */}
        <button
          type="submit"
          disabled={isSubmitting}
          style={{ padding: '10px', cursor: isSubmitting ? 'not-allowed' : 'pointer', background: '#3861fb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', opacity: isSubmitting ? 0.7 : 1 }}
        >
          {isSubmitting ? 'Logging in...' : 'Login'}
        </button>
      </form>

      {/* קישור מעבר לעמוד ההרשמה עבור משתמשים חדשים */}
      <p style={{ textAlign: 'center', fontSize: '13px', marginTop: '10px' }}>
        Don't have an account? <Link to="/register" style={{ color: '#3861fb', fontWeight: 'bold' }}>Register here</Link>
      </p>
    </div>
  )
}

export default Login
