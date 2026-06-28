import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { TrendingUp, TrendingDown, Search } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'
import { useTheme } from '../context/ThemeContext'

interface MarketCoin {
  id: string
  symbol: string
  name: string
  image: string
  current_price: number
  price_change_percentage_24h: number
  market_cap: number
  sparkline_in_7d?: { price: number[] }
}

function Dashboard() {
  const navigate = useNavigate()
  const { isDarkMode } = useTheme()
  const [marketCoins, setMarketCoins] = useState<MarketCoin[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [timeFrame, setTimeFrame] = useState<'24h' | '7d'>('7d')

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        setLoading(true)
        // פנייה לראוט החדש והחסין בשרת המקומי שלך
        const marketRes = await axios.get('http://localhost:5001/api/crypto/markets')
        setMarketCoins(marketRes.data)
        setLoading(false)
      } catch (error) {
        console.error("Frontend failed to fetch data from local backend server:", error)
        setLoading(false)
      }
    }
    fetchMarketData()
  }, [])

  const filteredCoins = marketCoins.filter(coin =>
    coin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    coin.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div style={{
        textAlign: 'center',
        marginTop: '120px',
        color: isDarkMode ? '#3861fb' : '#475569',
        fontWeight: 600,
        fontSize: '18px',
        letterSpacing: '0.5px'
      }}>
        טוען נתוני שוק...
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 24px', direction: 'rtl' }}>

      {/* אזור כותרת העמוד ושדה החיפוש */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
        flexWrap: 'wrap',
        gap: '24px'
      }}>
        <div>
          <h2 style={{
            margin: 0,
            fontSize: '28px',
            fontWeight: 800,
            color: isDarkMode ? '#ffffff' : '#0f172a',
            letterSpacing: '-0.5px'
          }}>
            מדד הנכסים הדיגיטליים
          </h2>
          <p style={{
            margin: '6px 0 0 0',
            color: isDarkMode ? '#94a3b8' : '#64748b',
            fontSize: '14px',
            fontWeight: 500
          }}>
            נתוני מסחר חיים ואינדיקטורים טכניים בזמן אמת מהשרת המאובטח.
          </p>
        </div>

        {/* שדה החיפוש המודרני */}
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={18} style={{
            position: 'absolute',
            right: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: isDarkMode ? '#64748b' : '#94a3b8'
          }} />
          <input
            type="text"
            placeholder="חיפוש מטבע לפי שם או סימול..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 44px 14px 14px',
              background: isDarkMode ? '#1e293b' : '#ffffff',
              border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0',
              borderRadius: '14px',
              color: isDarkMode ? '#f8fafc' : '#0f172a',
              fontSize: '14px',
              outline: 'none',
              boxShadow: isDarkMode ? '0 4px 12px rgba(0,0,0,0.1)' : '0 4px 12px rgba(0,0,0,0.02)',
              transition: 'all 0.2s ease'
            }}
          />
        </div>
      </div>

      {/* קופסת המטריצה המרכזית - משתנה לפי ה-Theme */}
      <div style={{
        background: isDarkMode ? '#111827' : '#ffffff',
        border: isDarkMode ? '1px solid #1f2937' : '1px solid #e2e8f0',
        borderRadius: '24px',
        padding: '28px',
        boxShadow: isDarkMode ? '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)' : '0 10px 25px -5px rgba(0, 0, 0, 0.02)'
      }}>

        {/* כפתורי בחירת טווח זמנים */}
        <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '8px', marginBottom: '24px' }}>
          <button onClick={() => setTimeFrame('24h')} style={{ padding: '8px 16px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, transition: 'all 0.2s', background: timeFrame === '24h' ? '#3861fb' : (isDarkMode ? '#1f2937' : '#f1f5f9'), color: timeFrame === '24h' ? '#fff' : (isDarkMode ? '#94a3b8' : '#475569') }}>24h טרנד</button>
          <button onClick={() => setTimeFrame('7d')} style={{ padding: '8px 16px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, transition: 'all 0.2s', background: timeFrame === '7d' ? '#3861fb' : (isDarkMode ? '#1f2937' : '#f1f5f9'), color: timeFrame === '7d' ? '#fff' : (isDarkMode ? '#94a3b8' : '#475569') }}>7d טרנד</button>
        </div>

        {/* טבלה */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{
                borderBottom: isDarkMode ? '1px solid #1f2937' : '2px solid #f1f5f9',
                color: isDarkMode ? '#94a3b8' : '#475569',
                fontSize: '14px',
                fontWeight: 600
              }}>
                <th style={{ padding: '16px 12px', textAlign: 'right' }}>נכס</th>
                <th style={{ padding: '16px 12px', textAlign: 'right' }}>מחיר נוכחי</th>
                <th style={{ padding: '16px 12px', textAlign: 'right' }}>שינוי 24h</th>
                <th style={{ padding: '16px 12px', textAlign: 'center', width: '160px' }}>מגמה טכנית</th>
                <th style={{ padding: '16px 12px', textAlign: 'left' }}>שווי שוק</th>
              </tr>
            </thead>
            <tbody>
              {filteredCoins.map((coin) => {
                const isPositive = coin.price_change_percentage_24h >= 0
                let rawPrices = coin.sparkline_in_7d?.price || []
                if (timeFrame === '24h') rawPrices = rawPrices.slice(-24)
                const sparklineData = rawPrices.map((p, i) => ({ id: i, val: p }))

                return (
                  <tr
                    key={coin.id}
                    onClick={() => navigate(`/coin/${coin.id}`)}
                    style={{
                      borderBottom: isDarkMode ? '1px solid #1f2937' : '1px solid #f1f5f9',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = isDarkMode ? '#1f2937' : '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* נכס */}
                    <td style={{ padding: '20px 12px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <img src={coin.image} alt={coin.name} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <div style={{ fontWeight: 700, fontSize: '15px', color: isDarkMode ? '#f8fafc' : '#0f172a' }}>{coin.name}</div>
                        <div style={{ fontSize: '12px', color: isDarkMode ? '#64748b' : '#94a3b8', fontWeight: 600, marginTop: '2px' }}>{coin.symbol.toUpperCase()}</div>
                      </div>
                    </td>

                    {/* מחיר נוכחי */}
                    <td style={{ padding: '20px 12px', fontWeight: 700, fontSize: '15px', color: isDarkMode ? '#ffffff' : '#0f172a' }}>
                      ${coin.current_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    {/* שינוי 24 שעות */}
                    <td style={{ padding: '20px 12px', color: isPositive ? '#10b981' : '#ef4444', fontWeight: 700, fontSize: '15px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-start' }}>
                        {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        <span>{Math.abs(coin.price_change_percentage_24h).toFixed(2)}%</span>
                      </div>
                    </td>

                    {/* גרף ספארקליין */}
                    <td style={{ padding: '8px 12px', height: '50px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={sparklineData}>
                          <Line
                            type="monotone"
                            dataKey="val"
                            stroke={isPositive ? '#10b981' : '#ef4444'}
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </td>

                    {/* שווי שוק */}
                    <td style={{ padding: '20px 12px', textAlign: 'left', color: isDarkMode ? '#94a3b8' : '#334155', fontWeight: 600, fontSize: '14px' }}>
                      ${coin.market_cap.toLocaleString()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Dashboard