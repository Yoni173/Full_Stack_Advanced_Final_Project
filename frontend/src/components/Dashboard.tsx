import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../config/api'
import { Search, TrendingUp, TrendingDown, BarChart2 } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'
import { useTheme } from '../context/ThemeContext'
import FearGreedGauge from '../components/FearGreedGauge'
import CashBalanceBadge from './CashBalanceBadge'

// הגדרת מבנה נתוני המטבעות בשוק
interface MarketCoin {
  id: string
  symbol: string
  name: string
  image: string
  current_price: number
  price_change_percentage_24h: number
  price_change_percentage_7d_in_currency?: number
  market_cap: number
  total_volume: number
  circulating_supply: number
  sparkline_in_7d?: { price: number[] }
}

// מסך השוק הראשי - וידג'ט Fear & Greed, שדה חיפוש וטבלת המטבעות הנתמכים
function Dashboard() {
  const navigate = useNavigate()
  const { isDarkMode } = useTheme()
  const [marketCoins, setMarketCoins] = useState<MarketCoin[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  // שליפת נתוני השוק בעת טעינת העמוד
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const marketRes = await apiClient.get('/api/crypto/markets')
        setMarketCoins(marketRes.data)
        setLoading(false)
      } catch (error) {
        console.error("Failed to fetch market data:", error)
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // סינון המטבעות לפי שאילתת החיפוש שהקיש המשתמש
  const filteredCoins = marketCoins.filter(coin =>
    coin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    coin.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // הצגת מסך טעינה בזמן שליפת הנתונים מהשרת
  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '140px', color: '#3861fb', fontWeight: 700, fontSize: '18px' }}>
        Loading real-time market data... 🚀
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1350px', margin: '40px auto', padding: '0 24px', direction: 'ltr' }}>

      {/* חלק עליון: כותרת ראשית, וידג'ט Fear & Greed ושדה החיפוש */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 900, color: isDarkMode ? '#ffffff' : '#0f172a', letterSpacing: '-0.5px' }}>
            Crypto Market Overview
          </h1>
          <p style={{ margin: '8px 0 0 0', color: isDarkMode ? '#94a3b8' : '#64748b', fontSize: '15px' }}>
            Track live prices, volume, market capitalizations and 7-day trends.
          </p>
        </div>

        <CashBalanceBadge compact />

        <FearGreedGauge />

        {/* שדה חיפוש מהיר */}
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            placeholder="Search coin name or symbol..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 16px 14px 46px',
              background: isDarkMode ? '#1e293b' : '#ffffff',
              border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0',
              borderRadius: '16px',
              color: isDarkMode ? '#f8fafc' : '#0f172a',
              fontSize: '14px',
              fontWeight: 500,
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      {/* קופסת הטבלה המרכזית */}
      <div style={{
        background: isDarkMode ? '#111827' : '#ffffff',
        border: isDarkMode ? '1px solid #1f2937' : '1px solid #e2e8f0',
        borderRadius: '24px',
        padding: '28px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <BarChart2 size={20} style={{ color: '#3861fb' }} />
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: isDarkMode ? '#ffffff' : '#0f172a' }}>
            Supported Assets ({filteredCoins.length})
          </h3>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: isDarkMode ? '1px solid #1f2937' : '2px solid #f1f5f9', color: isDarkMode ? '#94a3b8' : '#475569', fontSize: '13px', fontWeight: 700 }}>
                <th style={{ padding: '16px' }}>Name</th>
                <th style={{ padding: '16px' }}>Price</th>
                <th style={{ padding: '16px' }}>24h %</th>
                <th style={{ padding: '16px' }}>7d %</th>
                <th style={{ padding: '16px' }}>Market Cap</th>
                <th style={{ padding: '16px' }}>Volume (24h)</th>
                <th style={{ padding: '16px' }}>Circulating Supply</th>
                <th style={{ padding: '16px', textAlign: 'center' }}>Last 7 Days</th>
              </tr>
            </thead>
            <tbody>
              {filteredCoins.map((coin) => {
                const is24Positive = coin.price_change_percentage_24h >= 0
                const change7d = coin.price_change_percentage_7d_in_currency ?? 0
                const is7dPositive = change7d >= 0
                const sparklineData = (coin.sparkline_in_7d?.price || []).map((p, i) => ({ id: i, val: p }))

                return (
                  <tr
                    key={coin.id}
                    onClick={() => navigate(`/coin/${coin.id}`)}
                    style={{ borderBottom: isDarkMode ? '1px solid #1f2937' : '1px solid #f8fafc', cursor: 'pointer', transition: 'background 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = isDarkMode ? '#1f2937' : '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '20px 16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <img src={coin.image} alt={coin.name} style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'block' }} />
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '15px', color: isDarkMode ? '#f8fafc' : '#0f172a' }}>{coin.name}</div>
                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>{coin.symbol.toUpperCase()}</div>
                      </div>
                    </td>

                    <td style={{ padding: '20px 16px', fontWeight: 800, fontSize: '15px', color: isDarkMode ? '#ffffff' : '#0f172a' }}>
                      ${coin.current_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    <td style={{ padding: '20px 16px', color: is24Positive ? '#10b981' : '#ef4444', fontWeight: 800, fontSize: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {is24Positive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        <span>{Math.abs(coin.price_change_percentage_24h).toFixed(2)}%</span>
                      </div>
                    </td>

                    <td style={{ padding: '20px 16px', color: is7dPositive ? '#10b981' : '#ef4444', fontWeight: 800, fontSize: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {is7dPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        <span>{Math.abs(change7d).toFixed(2)}%</span>
                      </div>
                    </td>

                    <td style={{ padding: '20px 16px', color: isDarkMode ? '#94a3b8' : '#475569', fontWeight: 700, fontSize: '13px' }}>
                      ${coin.market_cap.toLocaleString()}
                    </td>

                    <td style={{ padding: '20px 16px', color: isDarkMode ? '#94a3b8' : '#475569', fontWeight: 700, fontSize: '13px' }}>
                      ${coin.total_volume.toLocaleString()}
                    </td>

                    <td style={{ padding: '20px 16px', color: isDarkMode ? '#94a3b8' : '#475569', fontWeight: 700, fontSize: '13px' }}>
                      {coin.circulating_supply.toLocaleString()} {coin.symbol.toUpperCase()}
                    </td>

                    <td style={{ padding: '10px 16px', width: '130px', height: '45px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={sparklineData}>
                          <Line type="linear" dataKey="val" stroke={is7dPositive ? '#10b981' : '#ef4444'} strokeWidth={2.5} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
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
