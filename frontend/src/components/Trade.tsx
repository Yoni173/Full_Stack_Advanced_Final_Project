import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { ArrowUpDown, ShieldCheck } from 'lucide-react'

// רשימת המטבעות הנתמכים בסימולטור שלנו
const AVAILABLE_COINS = [
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', defaultPrice: 64016.63 },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', defaultPrice: 1720.45 },
  { id: 'tether', name: 'Tether', symbol: 'USDT', defaultPrice: 0.999 },
  { id: 'solana', name: 'Solana', symbol: 'SOL', defaultPrice: 73.04 }
]

function Trade() {
  const navigate = useNavigate()

  // ניהול מצבי הטופס
  const [action, setAction] = useState<'buy' | 'sell'>('buy')
  const [selectedCoinId, setSelectedCoinId] = useState('bitcoin')
  const [currentPrice, setCurrentPrice] = useState<number>(64016.63)
  const [usdAmount, setUsdAmount] = useState<number>(0)
  const [cryptoAmount, setCryptoAmount] = useState<number>(0)
  const [statusMessage, setStatusMessage] = useState('')

  // שליפת המחיר העדכני של המטבע שנבחר מתוך ה-API או מהגיבוי המקומי
  useEffect(() => {
    const fetchSelectedCoinPrice = async () => {
      try {
        const res = await axios.get(`https://api.coingecko.com/api/v3/coins/${selectedCoinId}`, {
          params: { localization: false, tickers: false, community_data: false, developer_data: false, sparkline: false }
        })
        setCurrentPrice(res.data.market_data.current_price.usd)
      } catch (error) {
        // אם יש חסימה של ה-API, נשלוף את מחיר הגיבוי המוגדר ברשימה שלנו למניעת תקיעות במסך
        const fallback = AVAILABLE_COINS.find(c => c.id === selectedCoinId)
        if (fallback) {
          setCurrentPrice(fallback.defaultPrice)
        }
      }
    }
    fetchSelectedCoinPrice()
  }, [selectedCoinId])

  // חישוב כמות הקריפטו מוגבלת ל-3 ספרות עשרוניות בכל פעם שסכום הדולר משתנה
  useEffect(() => {
    if (currentPrice > 0 && usdAmount > 0) {
      const calculated = usdAmount / currentPrice
      setCryptoAmount(Number(calculated.toFixed(3)))
    } else {
      setCryptoAmount(0)
    }
  }, [usdAmount, currentPrice])

  const handleExecuteOrder = async () => {
    if (usdAmount <= 0) {
      setStatusMessage('אנא הזן סכום דולרי תקין הגדולה מ-0')
      return
    }

    const activeCoin = AVAILABLE_COINS.find(c => c.id === selectedCoinId)
    if (!activeCoin) return

    try {
      setStatusMessage('משדר פקודת מסחר מאובטחת...')
      const token = localStorage.getItem('token')

      await axios.post('http://localhost:5001/api/crypto/trade', {
        coinId: selectedCoinId,
        symbol: activeCoin.symbol.toLowerCase(),
        name: activeCoin.name,
        type: action,
        quantity: cryptoAmount,
        price: currentPrice
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setStatusMessage('הפקודה בוצעה בהצלחה! התיק עודכן. 🚀')
      setTimeout(() => navigate('/portfolio'), 1500)
    } catch (error: any) {
      setStatusMessage(error.response?.data?.message || 'הפעולה נכשלה. ודא שיש לך מספיק יתרה בחשבון.')
    }
  }

  const activeCoinInfo = AVAILABLE_COINS.find(c => c.id === selectedCoinId)

  return (
    <div style={{ maxWidth: '500px', margin: '60px auto', padding: '0 20px', color: '#0f172a' }}>
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '32px', boxShadow: '0 10px 30px rgba(0,0,0,0.01)' }}>

        <h2 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: 800, textAlign: 'center' }}>מסוף מסחר עצמאי</h2>

        {/* 1. בחירת סוג הפעולה: קנייה או מכירה */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
          <button
            type="button"
            onClick={() => setAction('buy')}
            style={{ flex: 1, padding: '12px', borderRadius: '12px', fontWeight: 700, border: 'none', cursor: 'pointer', background: action === 'buy' ? '#10b981' : '#f1f5f9', color: action === 'buy' ? '#fff' : '#475569', transition: 'all 0.2s' }}
          >
            קנייה (Buy)
          </button>
          <button
            type="button"
            onClick={() => setAction('sell')}
            style={{ flex: 1, padding: '12px', borderRadius: '12px', fontWeight: 700, border: 'none', cursor: 'pointer', background: action === 'sell' ? '#ef4444' : '#f1f5f9', color: action === 'sell' ? '#fff' : '#475569', transition: 'all 0.2s' }}
          >
            מכירה (Sell)
          </button>
        </div>

        {/* 2. תפריט בחירת מטבע קריפטו מתוך הרשימה */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>בחר נכס דיגיטלי למסחר</label>
          <select
            value={selectedCoinId}
            onChange={(e) => { setSelectedCoinId(e.target.value); setUsdAmount(0); }}
            style={{ width: '100%', padding: '14px', border: '1px solid #e2e8f0', borderRadius: '14px', fontSize: '15px', fontWeight: 600, color: '#0f172a', outline: 'none', background: '#fff' }}
          >
            {AVAILABLE_COINS.map(coin => (
              <option key={coin.id} value={coin.id}>{coin.name} ({coin.symbol})</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '20px', background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>שער חליפין נוכחי בשוק:</span>
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>

        {/* 3. שדה הזנת סכום דולרי */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>סכום מבוקש בדולר ($)</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#94a3b8' }}>$</span>
            <input
              type="number"
              placeholder="0.00"
              value={usdAmount === 0 ? '' : usdAmount}
              onChange={(e) => handleUsdChange(Number(e.target.value))}
              style={{ width: '100%', padding: '14px 14px 14px 32px', border: '1px solid #e2e8f0', borderRadius: '14px', fontSize: '16px', fontWeight: 700, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0' }}>
          <div style={{ background: '#f1f5f9', padding: '8px', borderRadius: '50%', color: '#3861fb' }}><ArrowUpDown size={16} /></div>
        </div>

        {/* 4. תצוגת כמות הקריפטו המחושבת (עד 3 ספרות עשרוניות) */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>כמות מוערכת שתתקבל</label>
          <input
            type="text"
            readOnly
            value={cryptoAmount > 0 ? `${cryptoAmount} ${activeCoinInfo?.symbol}` : `0.00 ${activeCoinInfo?.symbol}`}
            style={{ width: '100%', padding: '14px', border: '1px solid #e2e8f0', borderRadius: '14px', fontSize: '16px', fontWeight: 700, background: '#f8fafc', color: '#334155', boxSizing: 'border-box' }}
          />
        </div>

        {statusMessage && (
          <p style={{ fontSize: '13px', fontWeight: 600, textAlign: 'center', margin: '0 0 16px 0', color: statusMessage.includes('نجاح') || statusMessage.includes('בהצלחה') ? '#10b981' : '#ef4444' }}>
            {statusMessage}
          </p>
        )}

        <button
          onClick={handleExecuteOrder}
          style={{ width: '100%', padding: '14px', border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: 700, color: '#fff', background: action === 'buy' ? '#10b981' : '#ef4444', cursor: 'pointer', boxShadow: action === 'buy' ? '0 4px 12px rgba(16,185,129,0.15)' : '0 4px 12px rgba(239,68,68,0.15)' }}
        >
          אישור וביצוע הפקודה
        </button>
      </div>
    </div>
  )
}

export default Trade