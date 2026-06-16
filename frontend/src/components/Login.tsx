import { useState } from 'react'
import axios from 'axios'

// 1. הגדרת "תעודת הזהות" עבור ה-Props שהרכיב מקבל 🏷️
interface LoginProps {
  onLoginSuccess: () => void;
}

// 2. אומרים לפונקציה שהיא מקבלת את ה-Props לפי המבנה שהגדרנו 🔌
function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async () => {
    try {
      const response = await axios.post('http://localhost:5001/api/auth/login', {
        email,
        password
      });

      localStorage.setItem('token', response.data.token);

      console.log('Login successful! 🎉', response.data);
      
      // 3. הפעלת הפונקציה שקיבלנו מהאבא כדי לעדכן את המצב ל-true! 🚀
      onLoginSuccess();
      
    } catch (error: any) {
      console.error('Login failed ❌', error.response?.data || error.message);
      alert('Login failed. Check the console for details.');
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px' }}>
      <h2>Login to Crypto Simulator 🔑</h2>
      
      <input 
        type="email" 
        placeholder="Enter your email" 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input 
        type="password" 
        placeholder="Enter your password" 
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      
      <button style={{ padding: '8px', cursor: 'pointer' }} onClick={handleSubmit}>
        Login
      </button>
    </div>
  )
}

export default Login