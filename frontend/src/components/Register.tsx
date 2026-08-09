import { useForm } from 'react-hook-form'
import { useNavigate, Link } from 'react-router-dom'
import apiClient from '../config/api'

interface RegisterFormData {
  username: string
  email: string
  password: string
}

const inputStyle = { padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }

// קומפוננטת הרשמה - אוספת פרטי משתמש חדש, שולחת לשרת ומנתבת חזרה למסך ההתחברות
function Register() {
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<RegisterFormData>()
  const navigate = useNavigate()

  // פונקציה לטיפול בשליחת טופס ההרשמה לשרת, לאחר שעבר ולידציה בצד הלקוח
  const onSubmit = async (data: RegisterFormData) => {
    try {
      await apiClient.post('/api/auth/register', data)

      alert('ההרשמה בוצעה בהצלחה! כעת תוכל להתחבר למערכת.')
      navigate('/login')
    } catch (error: any) {
      setError('root', { message: error.response?.data?.message || 'שגיאה בהרשמה. בדוק את הנתונים ונסה שוב.' })
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px', margin: '40px auto', padding: '20px' }}>
      <h2>Register to CryptoSimulator 📝</h2>

      {errors.root && <div style={{ color: '#ef4444', fontSize: '13px', textAlign: 'center' }}>{errors.root.message}</div>}

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }} noValidate>
        <input
          type="text"
          placeholder="Choose a username"
          style={inputStyle}
          {...register('username', {
            required: 'Username is required',
            minLength: { value: 2, message: 'Username must be at least 2 characters' },
            maxLength: { value: 30, message: 'Username must be at most 30 characters' }
          })}
        />
        {errors.username && <span style={{ color: '#ef4444', fontSize: '12px' }}>{errors.username.message}</span>}

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

        <input
          type="password"
          placeholder="Enter your password (min 6 chars)"
          style={inputStyle}
          {...register('password', {
            required: 'Password is required',
            minLength: { value: 6, message: 'Password must be at least 6 characters' }
          })}
        />
        {errors.password && <span style={{ color: '#ef4444', fontSize: '12px' }}>{errors.password.message}</span>}

        <button
          type="submit"
          disabled={isSubmitting}
          style={{ padding: '10px', cursor: isSubmitting ? 'not-allowed' : 'pointer', background: '#3861fb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', opacity: isSubmitting ? 0.7 : 1 }}
        >
          {isSubmitting ? 'Signing up...' : 'Sign Up'}
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
