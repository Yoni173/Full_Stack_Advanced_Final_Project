import { useState, useEffect, memo } from 'react'
import apiClient from '../config/api'
import { useTheme } from '../context/ThemeContext'

interface FearAndGreedData {
  value: number
  value_classification: string
  source: 'cmc' | 'fallback'
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = (angleDeg * Math.PI) / 180
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy - r * Math.sin(angleRad),
  }
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, startAngle)
  const end = polarToCartesian(cx, cy, r, endAngle)
  return `M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${end.x} ${end.y}`
}

const SEGMENTS = [
  { from: 180, to: 144, color: '#ef4444' },
  { from: 144, to: 108, color: '#f97316' },
  { from: 108, to: 72, color: '#eab308' },
  { from: 72, to: 36, color: '#84cc16' },
  { from: 36, to: 0, color: '#10b981' },
]

const CX = 100
const CY = 100
const R = 78
const STROKE = 14

function FearGreedGauge() {
  const { isDarkMode } = useTheme()
  const [data, setData] = useState<FearAndGreedData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchSentiment = async () => {
      try {
        setLoading(true)
        const res = await apiClient.get('/api/crypto/fear-greed')
        setData(res.data)
        setError(false)
      } catch (err) {
        console.error('Failed to fetch Fear & Greed index:', err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchSentiment()
  }, [])

  const value = data?.value ?? 0
  const classification = data?.value_classification ?? '—'
  const clampedValue = Math.max(0, Math.min(100, value))
  const needleAngle = 180 - (clampedValue / 100) * 180
  const needlePos = polarToCartesian(CX, CY, R, needleAngle)

  const cardBg = isDarkMode ? '#1e293b' : '#ffffff'
  const cardBorder = isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0'
  const titleColor = isDarkMode ? '#e2e8f0' : '#334155'
  const numberColor = isDarkMode ? '#ffffff' : '#0f172a'
  const subColor = isDarkMode ? '#94a3b8' : '#64748b'

  return (
    <div
      style={{
        background: cardBg,
        border: cardBorder,
        borderRadius: '20px',
        padding: '20px 24px 16px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.04)',
        width: '260px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '13px', fontWeight: 800, color: titleColor, marginBottom: '8px' }}>
        Crypto Fear and Greed Index
      </div>

      {loading ? (
        <div style={{ padding: '30px 0', color: subColor, fontSize: '13px', fontWeight: 600 }}>
          Loading…
        </div>
      ) : (
        <>
          <svg viewBox="0 0 200 110" width="100%" height="100">
            {SEGMENTS.map((seg) => (
              <path
                key={seg.color}
                d={describeArc(CX, CY, R, seg.from, seg.to)}
                stroke={seg.color}
                strokeWidth={STROKE}
                strokeLinecap="round"
                fill="none"
              />
            ))}
            <circle
              cx={needlePos.x}
              cy={needlePos.y}
              r={8}
              fill="#ffffff"
              stroke="#0f172a"
              strokeWidth={2.5}
            />
          </svg>

          <div style={{ fontSize: '38px', fontWeight: 900, color: numberColor, lineHeight: 1, marginTop: '-8px' }}>
            {value}
          </div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: subColor, marginTop: '2px' }}>
            {classification}
          </div>

          {data?.source === 'fallback' && (
            <div style={{ fontSize: '10px', color: '#f59e0b', marginTop: '6px' }}>
              מקור גיבוי (alternative.me) — ייתכן שונה מ-CMC
            </div>
          )}
          {error && (
            <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '6px' }}>
              נתונים לא עודכנו (שגיאת רשת)
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default memo(FearGreedGauge)