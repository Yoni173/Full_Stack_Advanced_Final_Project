import { useEffect, memo } from 'react'
import { Wallet } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { fetchCashBalance } from '../store/userSlice'

interface CashBalanceBadgeProps {
  label?: string
  compact?: boolean
}

const formatUsd = (value: number) =>
  value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// היתרה מגיעה מ-Redux (במקום fetch מקומי) - כך שברגע שהיא מתעדכנת במקום אחד באפליקציה
// (למשל אחרי קנייה בדף Trade), התג הזה מתעדכן בכל מקום שהוא מוצג בלי צורך ברענון.
function CashBalanceBadge({ label = 'Available USD', compact = false }: CashBalanceBadgeProps) {
  const { isDarkMode } = useTheme()
  const dispatch = useAppDispatch()
  const { cashBalance, balanceStatus } = useAppSelector((state) => state.user)

  useEffect(() => {
    if (balanceStatus === 'idle' && localStorage.getItem('token')) {
      dispatch(fetchCashBalance())
    }
  }, [balanceStatus, dispatch])

  const valueText = balanceStatus === 'loading' || balanceStatus === 'idle'
    ? 'Loading...'
    : cashBalance === null
      ? 'Unavailable'
      : `$${formatUsd(cashBalance)}`

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: compact ? '8px' : '12px',
      minWidth: compact ? '180px' : '220px',
      padding: compact ? '10px 12px' : '14px 16px',
      borderRadius: '16px',
      background: isDarkMode ? '#111827' : '#ffffff',
      border: isDarkMode ? '1px solid #1f2937' : '1px solid #e2e8f0',
      boxShadow: '0 10px 30px rgba(0,0,0,0.03)'
    }}>
      <div style={{
        width: compact ? '32px' : '38px',
        height: compact ? '32px' : '38px',
        borderRadius: '12px',
        background: 'rgba(16, 185, 129, 0.1)',
        color: '#10b981',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <Wallet size={compact ? 16 : 18} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '12px', color: isDarkMode ? '#94a3b8' : '#64748b', fontWeight: 700 }}>
          {label}
        </div>
        <div style={{
          fontSize: compact ? '16px' : '20px',
          color: isDarkMode ? '#ffffff' : '#0f172a',
          fontWeight: 900,
          whiteSpace: 'nowrap'
        }}>
          {valueText}
        </div>
      </div>
    </div>
  )
}

export default memo(CashBalanceBadge)
