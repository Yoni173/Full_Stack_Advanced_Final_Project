import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import apiClient from '../config/api'
import { ArrowUpDown } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { fetchCashBalance, setCashBalance as setCashBalanceAction } from '../store/userSlice'

interface TradeAmounts {
  usdAmount: number | ''
  cryptoAmount: number | ''
}

interface TradableCoin {
  id: string
  name: string
  symbol: string
  current_price: number
}

interface PortfolioAsset {
  coinId: string
  quantity: number
}

const formatUsd = (value: number) =>
  value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// מסך מסחר - קנייה ומכירה של מטבעות, עם אפשרות להזין סכום בדולרים או כמות מטבעות (מתעדכן הדדית)
function Trade() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { cashBalance } = useAppSelector((state) => state.user)
  const { action: routeAction, coinId: routeCoinId } = useParams<{ action?: string; coinId?: string }>()

  // ניהול מצבי הטופס (Action, מטבע נבחר, מחיר) - הסכומים עצמם מנוהלים ע"י react-hook-form
  const [action, setAction] = useState<'buy' | 'sell'>('buy')
  const [selectedCoinId, setSelectedCoinId] = useState(routeCoinId || 'bitcoin')
  const [currentPrice, setCurrentPrice] = useState<number>(0)
  const [statusMessage, setStatusMessage] = useState('')

  const { register: registerAmount, watch, setValue, handleSubmit, formState: { errors: amountErrors } } =
    useForm<TradeAmounts>({ defaultValues: { usdAmount: '', cryptoAmount: '' } })
  const usdAmount = watch('usdAmount')
  const cryptoAmount = watch('cryptoAmount')
  const [portfolioAssets, setPortfolioAssets] = useState<PortfolioAsset[]>([])
  const [accountLoading, setAccountLoading] = useState(true)
  const [availableCoins, setAvailableCoins] = useState<TradableCoin[]>([])
  const [coinsLoading, setCoinsLoading] = useState(true)

  // שליפת כל המטבעות שמופיעים ב-Markets, כדי שכל מטבע שאפשר לראות אפשר גם לסחור בו
  useEffect(() => {
    const fetchTradableCoins = async () => {
      try {
        const res = await apiClient.get('/api/crypto/markets')
        const coins: TradableCoin[] = (res.data || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          symbol: String(c.symbol).toUpperCase(),
          current_price: c.current_price
        }))
        setAvailableCoins(coins)
      } catch (error) {
        console.error('Failed to fetch tradable coins:', error)
      } finally {
        setCoinsLoading(false)
      }
    }
    fetchTradableCoins()
  }, [])

  // סנכרון הפעולה והמטבע הנבחרים עם פרמטרי הנתיב (כשמגיעים דרך "Trade" מדף מטבע ספציפי)
  useEffect(() => {
    if (routeAction === 'buy' || routeAction === 'sell') {
      setAction(routeAction)
    }

    if (routeCoinId && availableCoins.some(c => c.id === routeCoinId)) {
      setSelectedCoinId(routeCoinId)
    } else if (!routeCoinId && availableCoins.length > 0 && !availableCoins.some(c => c.id === selectedCoinId)) {
      setSelectedCoinId(availableCoins[0].id)
    }
  }, [routeAction, routeCoinId, availableCoins])

  useEffect(() => {
    const fetchAccountData = async () => {
      try {
        const [, portfolioRes] = await Promise.all([
          dispatch(fetchCashBalance()),
          apiClient.get('/api/crypto/portfolio')
        ])

        setPortfolioAssets(portfolioRes.data)
      } catch (error) {
        console.error('Failed to fetch account data:', error)
      } finally {
        setAccountLoading(false)
      }
    }

    fetchAccountData()
  }, [])

  useEffect(() => {
    if (!selectedCoinId) return

    // מציגים קודם את המחיר הידוע מרשימת השוק, כדי שהמסך לא יהיה ריק עד שהקריאה החיה חוזרת
    const knownCoin = availableCoins.find(c => c.id === selectedCoinId)
    if (knownCoin) {
      setCurrentPrice(knownCoin.current_price)
    }

    const fetchSelectedCoinPrice = async () => {
      try {
        const res = await apiClient.get(`/api/crypto/coin/${selectedCoinId}`)
        setCurrentPrice(res.data.market_data.current_price.usd)
      } catch {
        // אם הקריאה נכשלת, פשוט נשארים עם המחיר הידוע מרשימת השוק
        if (knownCoin) {
          setCurrentPrice(knownCoin.current_price)
        }
      }
    }
    fetchSelectedCoinPrice()
  }, [selectedCoinId, availableCoins])

  // טיפול בעדכון סכום דולרי וחישוב כמות הקריפטו המקבילה באופן ויזואלי
  const handleUsdChange = (val: number | '') => {
    if (val === '' || val <= 0 || currentPrice <= 0) {
      setValue('cryptoAmount', '', { shouldValidate: true })
    } else {
      const calculated = Number(val) / currentPrice
      setValue('cryptoAmount', Number(calculated.toFixed(4)), { shouldValidate: true })
    }
  }

  // טיפול בעדכון כמות קריפטו וחישוב הסכום הדולרי המקביל באופן ויזואלי
  const handleCryptoChange = (val: number | '') => {
    if (val === '' || val <= 0 || currentPrice <= 0) {
      setValue('usdAmount', '', { shouldValidate: true })
    } else {
      const calculated = Number(val) * currentPrice
      setValue('usdAmount', Number(calculated.toFixed(2)), { shouldValidate: true })
    }
  }

  // נקראת רק אחרי שה-form validation עבר בהצלחה
  const handleExecuteOrder = async () => {
    const activeCoin = availableCoins.find(c => c.id === selectedCoinId)
    if (!activeCoin) return

    if (isInsufficientCash) {
      setStatusMessage(`Not enough USD balance. You have $${formatUsd(cashBalance ?? 0)}.`)
      return
    }

    if (isInsufficientCrypto) {
      setStatusMessage(`Not enough ${activeCoin.symbol}. You own ${ownedQuantity.toLocaleString(undefined, { maximumFractionDigits: 8 })} ${activeCoin.symbol}.`)
      return
    }

    try {
      setStatusMessage('Processing secure trade order...')

      const tradeRes = await apiClient.post('/api/crypto/trade', {
        coinId: selectedCoinId,
        symbol: activeCoin.symbol.toLowerCase(),
        name: activeCoin.name,
        type: action,
        quantity: Number(cryptoAmount),
        price: currentPrice
      })

      if (typeof tradeRes.data?.cashBalance === 'number') {
        // מעדכן את היתרה ב-Redux כדי שה-Header וכל שאר המסכים ישקפו את זה מיידית
        dispatch(setCashBalanceAction(tradeRes.data.cashBalance))
      }

      setStatusMessage('Order executed successfully! Portfolio updated. 🚀')
      // מעבר אוטומטי לעמוד תיק ההשקעות לאחר ביצוע מוצלח מבלי לזרוק לשוק
      setTimeout(() => navigate('/portfolio'), 1500)
    } catch (error: any) {
      setStatusMessage(error.response?.data?.message || 'Trade failed. Please check your balance.')
    }
  }

  const activeCoinInfo = availableCoins.find(c => c.id === selectedCoinId)
  const parsedUsdAmount = usdAmount === '' ? 0 : Number(usdAmount)
  const parsedCryptoAmount = cryptoAmount === '' ? 0 : Number(cryptoAmount)
  const ownedQuantity = portfolioAssets.find(asset => asset.coinId === selectedCoinId)?.quantity ?? 0
  const estimatedRemainingCash = cashBalance === null ? null : cashBalance - parsedUsdAmount
  const isInsufficientCash = action === 'buy' && cashBalance !== null && parsedUsdAmount > cashBalance
  const isInsufficientCrypto = action === 'sell' && parsedCryptoAmount > ownedQuantity
  const isSubmitDisabled = accountLoading || coinsLoading || !activeCoinInfo || parsedUsdAmount <= 0 || parsedCryptoAmount <= 0 || isInsufficientCash || isInsufficientCrypto

  return (
    <div style={{ maxWidth: '500px', margin: '60px auto', padding: '0 20px', color: '#0f172a', direction: 'ltr' }}>
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '32px', boxShadow: '0 10px 30px rgba(0,0,0,0.01)' }}>

        <h2 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: 800, textAlign: 'center' }}>Independent Trading Terminal</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, marginBottom: '4px' }}>Available USD</div>
            <div style={{ fontSize: '20px', color: '#10b981', fontWeight: 900 }}>
              {accountLoading ? 'Loading...' : cashBalance === null ? 'Unavailable' : `$${formatUsd(cashBalance)}`}
            </div>
          </div>
          <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, marginBottom: '4px' }}>Owned {activeCoinInfo?.symbol}</div>
            <div style={{ fontSize: '20px', color: '#3861fb', fontWeight: 900 }}>
              {accountLoading ? 'Loading...' : `${ownedQuantity.toLocaleString(undefined, { maximumFractionDigits: 8 })} ${activeCoinInfo?.symbol}`}
            </div>
          </div>
        </div>

        {/* 1. בחירת סוג פעולה: קנייה או מכירה */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
          <button
            type="button"
            onClick={() => { setAction('buy'); setStatusMessage('') }}
            style={{ flex: 1, padding: '12px', borderRadius: '12px', fontWeight: 700, border: 'none', cursor: 'pointer', background: action === 'buy' ? '#10b981' : '#f1f5f9', color: action === 'buy' ? '#fff' : '#475569', transition: 'all 0.2s' }}
          >
            Buy
          </button>
          <button
            type="button"
            onClick={() => { setAction('sell'); setStatusMessage('') }}
            style={{ flex: 1, padding: '12px', borderRadius: '12px', fontWeight: 700, border: 'none', cursor: 'pointer', background: action === 'sell' ? '#ef4444' : '#f1f5f9', color: action === 'sell' ? '#fff' : '#475569', transition: 'all 0.2s' }}
          >
            Sell
          </button>
        </div>

        {/* 2. תפריט בחירת מטבע קריפטו */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Select Digital Asset</label>
          <select
            value={selectedCoinId}
            onChange={(e) => { setSelectedCoinId(e.target.value); setValue('usdAmount', ''); setValue('cryptoAmount', ''); setStatusMessage('') }}
            disabled={coinsLoading}
            style={{ width: '100%', padding: '14px', border: '1px solid #e2e8f0', borderRadius: '14px', fontSize: '15px', fontWeight: 600, color: '#0f172a', outline: 'none', background: '#fff' }}
          >
            {coinsLoading && <option>Loading assets...</option>}
            {availableCoins.map(coin => (
              <option key={coin.id} value={coin.id}>{coin.name} ({coin.symbol})</option>
            ))}
          </select>
        </div>

        {/* הצגת שער החליפין הנוכחי בשוק */}
        <div style={{ marginBottom: '20px', background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>Current Market Rate:</span>
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>

        <form onSubmit={handleSubmit(handleExecuteOrder)} noValidate>

        {/* 3. שדה הזנה חופשי בסכום דולרי ($) */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Amount in USD ($)</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#94a3b8' }}>$</span>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              {...registerAmount('usdAmount', {
                required: 'Enter a USD amount',
                valueAsNumber: true,
                min: { value: 0.01, message: 'Amount must be greater than 0' },
                onChange: (e) => handleUsdChange(e.target.value === '' ? '' : Number(e.target.value))
              })}
              style={{ width: '100%', padding: '14px 14px 14px 32px', border: amountErrors.usdAmount ? '1px solid #ef4444' : '1px solid #e2e8f0', borderRadius: '14px', fontSize: '16px', fontWeight: 700, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          {amountErrors.usdAmount && (
            <div style={{ marginTop: '6px', fontSize: '12px', color: '#ef4444', fontWeight: 700 }}>{amountErrors.usdAmount.message}</div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0' }}>
          <div style={{ background: '#f1f5f9', padding: '8px', borderRadius: '50%', color: '#3861fb' }}><ArrowUpDown size={16} /></div>
        </div>

        {/* 4. שדה הזנה חופשי או תצוגה מעודכנת של כמות הקריפטו */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Coin Quantity ({activeCoinInfo?.symbol})</label>
          <input
            type="number"
            step="any"
            placeholder="0.00"
            {...registerAmount('cryptoAmount', {
              required: 'Enter a coin quantity',
              valueAsNumber: true,
              min: { value: 0.00000001, message: 'Quantity must be greater than 0' },
              onChange: (e) => handleCryptoChange(e.target.value === '' ? '' : Number(e.target.value))
            })}
            style={{ width: '100%', padding: '14px', border: amountErrors.cryptoAmount ? '1px solid #ef4444' : '1px solid #e2e8f0', borderRadius: '14px', fontSize: '16px', fontWeight: 700, background: '#fff', color: '#0f172a', boxSizing: 'border-box', outline: 'none' }}
          />
          {amountErrors.cryptoAmount && (
            <div style={{ marginTop: '6px', fontSize: '12px', color: '#ef4444', fontWeight: 700 }}>{amountErrors.cryptoAmount.message}</div>
          )}
        </div>

        {action === 'buy' && parsedUsdAmount > 0 && estimatedRemainingCash !== null && !isInsufficientCash && (
          <div style={{ margin: '-8px 0 16px 0', fontSize: '13px', color: '#10b981', fontWeight: 700, textAlign: 'center' }}>
            Estimated USD after buy: ${formatUsd(estimatedRemainingCash)}
          </div>
        )}

        {isInsufficientCash && (
          <div style={{ margin: '-8px 0 16px 0', fontSize: '13px', color: '#ef4444', fontWeight: 700, textAlign: 'center' }}>
            Not enough USD balance for this buy order.
          </div>
        )}

        {isInsufficientCrypto && (
          <div style={{ margin: '-8px 0 16px 0', fontSize: '13px', color: '#ef4444', fontWeight: 700, textAlign: 'center' }}>
            Not enough {activeCoinInfo?.symbol} available for this sell order.
          </div>
        )}

        {statusMessage && (
          <p style={{ fontSize: '13px', fontWeight: 600, textAlign: 'center', margin: '0 0 16px 0', color: statusMessage.includes('successfully') ? '#10b981' : '#ef4444' }}>
            {statusMessage}
          </p>
        )}

        {/* כפתור אישור וביצוע הפקודה */}
        <button
          type="submit"
          disabled={isSubmitDisabled}
          style={{
            width: '100%',
            padding: '14px',
            border: 'none',
            borderRadius: '14px',
            fontSize: '15px',
            fontWeight: 700,
            color: '#fff',
            background: isSubmitDisabled ? '#94a3b8' : action === 'buy' ? '#10b981' : '#ef4444',
            cursor: isSubmitDisabled ? 'not-allowed' : 'pointer',
            boxShadow: isSubmitDisabled ? 'none' : action === 'buy' ? '0 4px 12px rgba(16,185,129,0.15)' : '0 4px 12px rgba(239,68,68,0.15)'
          }}
        >
          {action === 'buy' ? 'Execute Buy Order' : 'Execute Sell Order'}
        </button>
        </form>
      </div>
    </div>
  )
}

export default Trade
