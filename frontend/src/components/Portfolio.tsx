import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import apiClient from '../config/api'
import type { CSSProperties } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { ArrowDownRight, ArrowUpRight, Clock, DollarSign, PieChart as PieIcon, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { fetchCashBalance, depositCash } from '../store/userSlice'

interface DepositFormData {
  amount: number
}

interface Asset {
  _id: string
  coinId: string
  symbol: string
  name: string
  quantity: number
  avgPurchasePrice: number
}

interface MarketPrice {
  id: string
  current_price: number
  image: string
  price_change_percentage_24h_in_currency?: number
  price_change_percentage_7d_in_currency?: number
  price_change_percentage_1y_in_currency?: number
}

type PnlPeriod = 'day' | 'week' | 'year'

const PNL_PERIOD_FIELD: Record<PnlPeriod, keyof MarketPrice> = {
  day: 'price_change_percentage_24h_in_currency',
  week: 'price_change_percentage_7d_in_currency',
  year: 'price_change_percentage_1y_in_currency'
}

const PNL_PERIOD_LABEL: Record<PnlPeriod, string> = {
  day: '24H',
  week: '7D',
  year: '1Y'
}

interface Transaction {
  _id: string
  coinId: string
  symbol: string
  name: string
  type: 'buy' | 'sell' | 'deposit'
  quantity: number
  price: number
  totalUsd: number
  cashBalanceAfter: number
  profitOrLoss?: number | null
  exchange?: string | null
  createdAt: string
}

const formatUsd = (value: number) =>
  value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// אחוזים קטנים/גדולים מאוד היו מתעגלים ל-0.0%/100.0% ונראים כאילו נכס נעלם - נותנים דיוק נוסף בקצוות
const formatAllocation = (value: number) => {
  if (value <= 0) return '0%'
  if (value < 0.1) return '<0.1%'
  if (value > 99.9) return '>99.9%'
  if (value < 1 || value > 99) return `${value.toFixed(2)}%`
  return `${value.toFixed(1)}%`
}

const formatCrypto = (value: number) =>
  value.toLocaleString(undefined, { maximumFractionDigits: 8 })

function Portfolio() {
  const { isDarkMode } = useTheme()
  const dispatch = useAppDispatch()
  const { cashBalance: reduxCashBalance } = useAppSelector((state) => state.user)
  const cashBalance = reduxCashBalance ?? 0
  const [assets, setAssets] = useState<Asset[]>([])
  const [prices, setPrices] = useState<MarketPrice[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [depositMessage, setDepositMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [pnlPeriod, setPnlPeriod] = useState<PnlPeriod>('day')
  const [coinFilter, setCoinFilter] = useState('all')
  const { register: registerDeposit, handleSubmit: handleDepositSubmit, reset: resetDepositForm, formState: { errors: depositErrors, isSubmitting: depositLoading } } = useForm<DepositFormData>()

  useEffect(() => {
    const fetchPortfolioData = async () => {
      try {
        const [portfolioRes, transactionsRes] = await Promise.all([
          apiClient.get('/api/crypto/portfolio'),
          apiClient.get('/api/crypto/transactions')
        ])
        dispatch(fetchCashBalance())

        const userAssets = portfolioRes.data
        setAssets(userAssets)
        setTransactions(transactionsRes.data)

        if (userAssets.length > 0) {
          // עובר דרך השרת (עם מטמון והגנה מפני rate limit) במקום לקרוא ל-CoinGecko ישירות מהדפדפן
          const marketsRes = await apiClient.get('/api/crypto/markets')
          const heldCoinIds = new Set(userAssets.map((a: Asset) => a.coinId))
          setPrices(marketsRes.data.filter((coin: MarketPrice) => heldCoinIds.has(coin.id)))
        }
      } catch (error) {
        console.error('Error fetching portfolio:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPortfolioData()
  }, [])

  const onDeposit = async (data: DepositFormData) => {
    try {
      setDepositMessage('')
      // דרך Redux - כדי שהיתרה תתעדכן בו-זמנית בכל מקום באתר (Header, Trade וכו')
      const result = await dispatch(depositCash(Number(data.amount))).unwrap()

      if (result.transaction) {
        setTransactions(current => [result.transaction, ...current])
      }
      resetDepositForm()
      setDepositMessage('Deposit completed successfully.')
    } catch (error: any) {
      setDepositMessage(error?.message || 'Deposit failed.')
    }
  }

  const totalCryptoBalance = assets.reduce((total, asset) => {
    const liveCoin = prices.find(p => p.id === asset.coinId)
    const currentPrice = liveCoin ? liveCoin.current_price : asset.avgPurchasePrice
    return total + (asset.quantity * currentPrice)
  }, 0)

  const netWorth = cashBalance + totalCryptoBalance
  const totalCost = assets.reduce((total, asset) => total + (asset.quantity * asset.avgPurchasePrice), 0)
  const totalProfitLoss = totalCryptoBalance - totalCost
  const totalProfitLossPercentage = totalCost > 0 ? (totalProfitLoss / totalCost) * 100 : 0
  const isPositive = totalProfitLoss >= 0

  // רווח/הפסד לפי תקופה (יומי/שבועי/שנתי) - מבוסס על תנועת מחיר השוק בפועל, לא על מחיר הקנייה שלך.
  // לכל נכס: אם הערך הנוכחי הוא V והשינוי באחוזים לתקופה הוא p, אז הערך בתחילת התקופה היה V / (1 + p/100)
  const periodField = PNL_PERIOD_FIELD[pnlPeriod]
  const { periodDollarChange, periodPercentChange } = (() => {
    let currentSum = 0
    let periodStartSum = 0

    assets.forEach(asset => {
      const liveCoin = prices.find(p => p.id === asset.coinId)
      const currentPrice = liveCoin ? liveCoin.current_price : asset.avgPurchasePrice
      const currentValue = asset.quantity * currentPrice
      const percent = liveCoin?.[periodField] as number | undefined

      currentSum += currentValue
      periodStartSum += typeof percent === 'number' ? currentValue / (1 + percent / 100) : currentValue
    })

    const dollarChange = currentSum - periodStartSum
    const percentChange = periodStartSum > 0 ? (dollarChange / periodStartSum) * 100 : 0
    return { periodDollarChange: dollarChange, periodPercentChange: percentChange }
  })()
  const isPeriodPositive = periodDollarChange >= 0

  const tradedCoins = Array.from(
    new Map(
      transactions
        .filter(tx => tx.type !== 'deposit')
        .map(tx => [tx.coinId, tx.name])
    ).entries()
  )

  const filteredTransactions = coinFilter === 'all'
    ? transactions
    : transactions.filter(tx => tx.coinId === coinFilter)

  const getCoinColor = (coinId: string) => {
    switch (coinId.toLowerCase()) {
      case 'bitcoin': return '#f7931a'
      case 'ethereum': return '#627eea'
      case 'tether': return '#26a17b'
      case 'binancecoin': return '#f0b90b'
      case 'usd-coin': return '#2775ca'
      case 'ripple': return '#0ea5e9'
      case 'solana': return '#14f195'
      case 'tron': return '#eb0029'
      case 'dogecoin': return '#c3a634'
      case 'usds': return '#64748b'
      default: return '#3861fb'
    }
  }

  const pieData = assets
    .map(asset => {
      const liveCoin = prices.find(p => p.id === asset.coinId)
      const currentPrice = liveCoin ? liveCoin.current_price : asset.avgPurchasePrice
      return {
        coinId: asset.coinId,
        name: asset.name,
        value: asset.quantity * currentPrice,
        color: getCoinColor(asset.coinId)
      }
    })
    .filter(entry => entry.value > 0)

  const panelStyle: CSSProperties = {
    background: isDarkMode ? '#111827' : '#ffffff',
    border: isDarkMode ? '1px solid #1f2937' : '1px solid #e2e8f0',
    borderRadius: '20px',
    padding: '24px',
    boxShadow: '0 18px 45px rgba(0, 0, 0, 0.04)'
  }

  const mutedColor = isDarkMode ? '#94a3b8' : '#64748b'
  const textColor = isDarkMode ? '#f8fafc' : '#0f172a'

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '80px', color: mutedColor }}>Analyzing portfolio matrix...</div>
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '40px auto', padding: '0 24px', direction: 'ltr', color: textColor }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '20px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 900, color: textColor }}>Portfolio</h1>
          <p style={{ margin: '8px 0 0 0', color: mutedColor, fontSize: '14px' }}>
            Cash, holdings and every simulated buy/sell movement in one place.
          </p>
        </div>
      </div>

      <div style={{ ...panelStyle, marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: textColor, fontWeight: 900, fontSize: '16px', marginBottom: '4px' }}>
              <DollarSign size={17} /> Deposit USD
            </div>
            <div style={{ color: mutedColor, fontSize: '13px', fontWeight: 700 }}>
              Add virtual broker cash for future buy orders.
            </div>
          </div>

          <form onSubmit={handleDepositSubmit(onDeposit)} noValidate style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: mutedColor, fontWeight: 900 }}>$</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...registerDeposit('amount', {
                    required: 'Enter a USD amount',
                    valueAsNumber: true,
                    min: { value: 0.01, message: 'Amount must be positive' },
                    max: { value: 1000000, message: 'Max deposit is $1,000,000' }
                  })}
                  style={{
                    width: '180px',
                    padding: '12px 12px 12px 30px',
                    borderRadius: '12px',
                    border: depositErrors.amount ? '1px solid #ef4444' : (isDarkMode ? '1px solid #1f2937' : '1px solid #e2e8f0'),
                    background: isDarkMode ? '#0f172a' : '#f8fafc',
                    color: textColor,
                    outline: 'none',
                    fontWeight: 900
                  }}
                />
              </div>
              {depositErrors.amount && (
                <div style={{ marginTop: '6px', fontSize: '12px', color: '#ef4444', fontWeight: 700 }}>{depositErrors.amount.message}</div>
              )}
            </div>
            <button
              type="submit"
              disabled={depositLoading}
              style={{
                padding: '12px 16px',
                borderRadius: '12px',
                border: 'none',
                background: depositLoading ? '#94a3b8' : '#10b981',
                color: '#ffffff',
                fontWeight: 900,
                cursor: depositLoading ? 'not-allowed' : 'pointer'
              }}
            >
              {depositLoading ? 'Depositing...' : 'Deposit'}
            </button>
          </form>
        </div>
        {depositMessage && (
          <div style={{ marginTop: '12px', color: depositMessage.includes('successfully') ? '#10b981' : '#ef4444', fontSize: '13px', fontWeight: 800 }}>
            {depositMessage}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={panelStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: mutedColor, fontSize: '13px', fontWeight: 800, marginBottom: '10px' }}>
            <Wallet size={16} /> Net Worth
          </div>
          <div style={{ fontSize: '30px', fontWeight: 900, color: textColor }}>${formatUsd(netWorth)}</div>
        </div>

        <div style={panelStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: mutedColor, fontSize: '13px', fontWeight: 800, marginBottom: '10px' }}>
            <DollarSign size={16} /> Available USD
          </div>
          <div style={{ fontSize: '30px', fontWeight: 900, color: '#10b981' }}>${formatUsd(cashBalance)}</div>
        </div>

        <div style={panelStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: mutedColor, fontSize: '13px', fontWeight: 800 }}>
              <PieIcon size={16} /> Crypto Value
            </div>
            <div style={{ display: 'flex', gap: '4px', background: isDarkMode ? '#0f172a' : '#f1f5f9', borderRadius: '8px', padding: '3px' }}>
              {(Object.keys(PNL_PERIOD_LABEL) as PnlPeriod[]).map(period => (
                <button
                  key={period}
                  type="button"
                  onClick={() => setPnlPeriod(period)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '10px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    background: pnlPeriod === period ? (isDarkMode ? '#1f2937' : '#ffffff') : 'transparent',
                    color: pnlPeriod === period ? textColor : mutedColor,
                    boxShadow: pnlPeriod === period ? '0 1px 4px rgba(0,0,0,0.08)' : 'none'
                  }}
                >
                  {PNL_PERIOD_LABEL[period]}
                </button>
              ))}
            </div>
          </div>
          <div style={{ fontSize: '30px', fontWeight: 900, color: textColor }}>${formatUsd(totalCryptoBalance)}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isPeriodPositive ? '#10b981' : '#ef4444', fontWeight: 700, fontSize: '13px', marginTop: '8px' }}>
            {isPeriodPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>{isPeriodPositive ? '+' : ''}${formatUsd(periodDollarChange)} ({periodPercentChange.toFixed(2)}%)</span>
          </div>
          <div style={{ color: mutedColor, fontSize: '11px', fontWeight: 700, marginTop: '4px' }}>
            <span style={{ color: isPositive ? '#10b981' : '#ef4444' }}>
              {isPositive ? '+' : ''}${formatUsd(totalProfitLoss)} ({totalProfitLossPercentage.toFixed(2)}%)
            </span> since purchase
          </div>
        </div>
      </div>

      <div style={{ ...panelStyle, marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: mutedColor, fontSize: '14px', fontWeight: 800, marginBottom: '18px' }}>
          <PieIcon size={16} />
          <span>Asset Holdings</span>
        </div>

        <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {assets.length === 0 && (
            <div style={{ color: mutedColor, fontSize: '14px', padding: '12px 0' }}>No crypto holdings yet.</div>
          )}

          {pieData.length > 0 && (
            <div style={{ width: '200px', height: '200px', position: 'relative', flexShrink: 0, margin: '0 auto' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92} paddingAngle={2} strokeWidth={0} minAngle={6}>
                    {pieData.map(entry => <Cell key={entry.coinId} fill={entry.color} />)}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [`$${formatUsd(value)}`, name]}
                    contentStyle={{
                      background: isDarkMode ? '#111827' : '#ffffff',
                      border: isDarkMode ? '1px solid #1f2937' : '1px solid #e2e8f0',
                      borderRadius: '10px',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <div style={{ fontSize: '10px', color: mutedColor, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Crypto</div>
                <div style={{ fontSize: '16px', fontWeight: 900, color: textColor }}>${formatUsd(totalCryptoBalance)}</div>
              </div>
            </div>
          )}

          <div style={{ flex: 1, minWidth: '260px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {assets.map(asset => {
            const liveCoin = prices.find(p => p.id === asset.coinId)
            const currentPrice = liveCoin ? liveCoin.current_price : asset.avgPurchasePrice
            const currentValue = asset.quantity * currentPrice
            const allocation = totalCryptoBalance > 0 ? (currentValue / totalCryptoBalance) * 100 : 0
            const coinColor = getCoinColor(asset.coinId)

            return (
              <div key={asset._id} style={{ background: isDarkMode ? '#0f172a' : '#f8fafc', border: isDarkMode ? '1px solid #1f2937' : '1px solid #e2e8f0', padding: '18px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {liveCoin?.image && <img src={liveCoin.image} alt={asset.name} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />}
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: textColor }}>{asset.name}</div>
                      <div style={{ fontSize: '12px', color: mutedColor }}>{formatCrypto(asset.quantity)} {asset.symbol.toUpperCase()}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: textColor }}>${formatUsd(currentValue)}</div>
                    <div style={{ fontSize: '12px', color: '#3861fb', fontWeight: 700 }}>{formatAllocation(allocation)}</div>
                  </div>
                </div>
                <div style={{ width: '100%', height: '5px', background: isDarkMode ? '#1f2937' : '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.max(allocation, 1.5)}%`, height: '100%', background: coinColor, borderRadius: '3px' }} />
                </div>
              </div>
            )
          })}
          </div>
        </div>
      </div>

      <div style={panelStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: mutedColor, fontSize: '14px', fontWeight: 800 }}>
            <Clock size={16} />
            <span>Buy / Sell History</span>
          </div>

          {tradedCoins.length > 0 && (
            <select
              value={coinFilter}
              onChange={(event) => setCoinFilter(event.target.value)}
              style={{
                padding: '10px 12px',
                borderRadius: '10px',
                border: isDarkMode ? '1px solid #1f2937' : '1px solid #e2e8f0',
                background: isDarkMode ? '#0f172a' : '#f8fafc',
                color: textColor,
                fontWeight: 700,
                fontSize: '13px',
                outline: 'none'
              }}
            >
              <option value="all">All coins</option>
              {tradedCoins.map(([coinId, name]) => (
                <option key={coinId} value={coinId}>{name}</option>
              ))}
            </select>
          )}
        </div>

        {filteredTransactions.length === 0 ? (
          <div style={{ color: mutedColor, fontSize: '14px', padding: '12px 0' }}>No transactions yet.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ color: mutedColor, fontSize: '12px', borderBottom: isDarkMode ? '1px solid #1f2937' : '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px' }}>Type</th>
                  <th style={{ padding: '12px' }}>Asset</th>
                  <th style={{ padding: '12px' }}>Quantity</th>
                  <th style={{ padding: '12px' }}>Price</th>
                  <th style={{ padding: '12px' }}>Total</th>
                  <th style={{ padding: '12px' }}>Exchange</th>
                  <th style={{ padding: '12px' }}>USD After</th>
                  <th style={{ padding: '12px' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map(tx => {
                  const isBuy = tx.type === 'buy'
                  const isDeposit = tx.type === 'deposit'
                  const txColor = isDeposit ? '#3861fb' : isBuy ? '#10b981' : '#ef4444'
                  return (
                    <tr key={tx._id} style={{ borderBottom: isDarkMode ? '1px solid #1f2937' : '1px solid #f1f5f9', fontSize: '13px' }}>
                      <td style={{ padding: '14px 12px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: txColor, fontWeight: 900 }}>
                          {isDeposit ? <DollarSign size={14} /> : isBuy ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                          {tx.type.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '14px 12px', color: textColor, fontWeight: 800 }}>{isDeposit ? 'Broker Cash' : tx.name} <span style={{ color: mutedColor }}>{tx.symbol}</span></td>
                      <td style={{ padding: '14px 12px', color: mutedColor, fontWeight: 700 }}>{isDeposit ? `$${formatUsd(tx.totalUsd)}` : formatCrypto(tx.quantity)}</td>
                      <td style={{ padding: '14px 12px', color: textColor, fontWeight: 700 }}>{isDeposit ? '-' : `$${formatUsd(tx.price)}`}</td>
                      <td style={{ padding: '14px 12px', color: textColor, fontWeight: 900 }}>${formatUsd(tx.totalUsd)}</td>
                      <td style={{ padding: '14px 12px', color: mutedColor, fontWeight: 700 }}>{isDeposit ? '-' : (tx.exchange || '-')}</td>
                      <td style={{ padding: '14px 12px', color: mutedColor, fontWeight: 700 }}>${formatUsd(tx.cashBalanceAfter)}</td>
                      <td style={{ padding: '14px 12px', color: mutedColor, fontWeight: 700 }}>{new Date(tx.createdAt).toLocaleString()}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Portfolio
