import { useState, useEffect } from 'react'
import axios from 'axios'
import { Wallet, PieChart as PieIcon, TrendingUp, TrendingDown } from 'lucide-react'

// הגדרת טיפוס (Interface) למבנה הנכסים של המשתמש בתיק
interface Asset {
  _id: string
  coinId: string
  symbol: string
  name: string
  quantity: number
  avgPurchasePrice: number
}

// הגדרת טיפוס לנתוני השוק החיים שמתקבלים מ-CoinGecko
interface MarketPrice {
  id: string
  current_price: number
  image: string
}

/**
 * קומפוננטת Portfolio
 * אחראית על שליפת נתוני תיק ההשקעות של המשתמש, הצלבתם עם מחירי השוק בזמן אמת,
 * וחישוב השווי הכולל והרווח/הפסד (P&L).
 */
function Portfolio() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [prices, setPrices] = useState<MarketPrice[]>([])
  const [loading, setLoading] = useState(true)

  // שליפת נתוני התיק ומחירי השוק בעת טעינת הקומפוננטה
  useEffect(() => {
    const fetchPortfolioData = async () => {
      try {
        // שליפת טוקן האבטחה מהדפדפן והעברתו ב-Headers לצורך אימות מול השרת
        const token = localStorage.getItem('token')
        const portfolioRes = await axios.get('http://localhost:5001/api/crypto/portfolio', {
          headers: { Authorization: `Bearer ${token}` }
        })
        const userAssets = portfolioRes.data
        setAssets(userAssets)

        // אם יש נכסים בתיק, נשלוף את המחירים העדכניים שלהם מה-API החיצוני
        if (userAssets.length > 0) {
          const coinIds = userAssets.map((a: Asset) => a.coinId).join(',')
          const priceRes = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
            params: { vs_currency: 'usd', ids: coinIds }
          })
          setPrices(priceRes.data)
        }
        setLoading(false)
      } catch (error) {
        console.error('Error fetching portfolio:', error)
        setLoading(false)
      }
    }
    fetchPortfolioData()
  }, [])

  // חישוב שווי התיק הכולל בזמן אמת בהתבסס על מחירי השוק החיים
  const totalBalance = assets.reduce((total, asset) => {
    const liveCoin = prices.find(p => p.id === asset.coinId)
    const currentPrice = liveCoin ? liveCoin.current_price : asset.avgPurchasePrice
    return total + (asset.quantity * currentPrice)
  }, 0)

  // חישוב העלות המקורית של ההשקעות
  const totalCost = assets.reduce((total, asset) => total + (asset.quantity * asset.avgPurchasePrice), 0)
  const totalProfitLoss = totalBalance - totalCost
  const totalProfitLossPercentage = totalCost > 0 ? (totalProfitLoss / totalCost) * 100 : 0
  const isPositive = totalProfitLoss >= 0

  // פונקציית עזר להחזרת צבע מותאם אישית לכל מטבע
  const getCoinColor = (coinId: string) => {
    switch (coinId.toLowerCase()) {
      case 'bitcoin': return '#f7931a'
      case 'ethereum': return '#627eea'
      case 'tether': return '#26a17b'
      case 'solana': return '#14f195'
      default: return '#3861fb'
    }
  }

  // עיצוב סגנון זכוכית (Glassmorphism) מתקדם לממשק
  const glassStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.45)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.6)',
    borderRadius: '24px',
    padding: '32px',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.04)'
  }

  // הצגת מסך טעינה בזמן שהנתונים נשלפים מהשרת
  if (loading) return <div style={{ textAlign: 'center', marginTop: '80px', color: '#64748b' }}>Analyzing portfolio matrix...</div>

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', padding: '0 20px' }}>
      <div style={glassStyle}>

        {/* חלק עליון: שווי התיק הכללי וחישוב הרווח/הפסד */}
        <div style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.05)', paddingBottom: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '14px', marginBottom: '6px' }}>
            <Wallet size={16} />
            <span>Net Worth Valuation</span>
          </div>
          <h1 style={{ fontSize: '42px', fontWeight: 800, margin: '0 0 12px 0', color: '#0f172a' }}>
            ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isPositive ? '#10b981' : '#ef4444', fontWeight: 600, fontSize: '16px' }}>
            {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span>{isPositive ? '+' : ''}${totalProfitLoss.toLocaleString(undefined, { minimumFractionDigits: 2 })} ({totalProfitLossPercentage.toFixed(2)}%)</span>
            <span style={{ color: '#64748b', fontSize: '13px', fontWeight: 400 }}>All-time Allocation P&L</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
          <PieIcon size={16} />
          <span>Asset Holdings & Weight Distribution</span>
        </div>

        {/* רשימת הנכסים הדינמית בתיק */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {assets.map(asset => {
            const liveCoin = prices.find(p => p.id === asset.coinId)
            const currentPrice = liveCoin ? liveCoin.current_price : asset.avgPurchasePrice
            const currentValue = asset.quantity * currentPrice
            const allocation = totalBalance > 0 ? (currentValue / totalBalance) * 100 : 0
            const coinColor = getCoinColor(asset.coinId)

            return (
              <div key={asset._id} style={{ background: 'rgba(255, 255, 255, 0.5)', border: '1px solid rgba(0, 0, 0, 0.02)', padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {liveCoin?.image && <img src={liveCoin.image} alt={asset.name} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />}
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>{asset.name}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{asset.quantity} {asset.symbol.toUpperCase()}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>${currentValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    <div style={{ fontSize: '12px', color: '#3861fb', fontWeight: 600 }}>{allocation.toFixed(1)}%</div>
                  </div>
                </div>
                {/* בר אחוז ההקצאה של המטבע מתוך התיק */}
                <div style={{ width: '100%', height: '5px', background: 'rgba(0, 0, 0, 0.04)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${allocation}%`, height: '100%', background: coinColor, borderRadius: '3px' }}></div>
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}

export default Portfolio