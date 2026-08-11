import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import apiClient from '../config/api'
import type { CSSProperties } from 'react'
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { ArrowLeft, ExternalLink, FileText, Globe, Info, Newspaper, ShieldCheck } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

interface Ticker {
  market: {
    name: string
    identifier?: string
  }
  base: string
  target: string
  last?: number
  volume?: number
  trust_score?: string
  bid_ask_spread_percentage?: number
  converted_last?: { usd?: number }
  converted_volume?: { usd?: number }
}

interface CoinData {
  id: string
  name: string
  symbol: string
  image?: { small?: string; thumb?: string }
  market_cap_rank?: number
  contract_address?: string
  asset_platform_id: string | null
  description: { en: string }
  links: {
    homepage: string[]
    whitepaper?: string
    twitter_screen_name?: string
    telegram_channel_identifier?: string
    blockchain_site?: string[]
  }
  tickers: Ticker[]
  market_data: {
    current_price: { usd: number }
    price_change_percentage_24h?: number
    price_change_percentage_30d?: number
    market_cap: { usd: number }
    total_volume: { usd: number }
    fully_diluted_valuation?: { usd?: number }
    total_supply?: number
    max_supply?: number | null
    circulating_supply?: number
    high_24h?: { usd?: number }
    low_24h?: { usd?: number }
    ath?: { usd?: number }
    ath_change_percentage?: { usd?: number }
    ath_date?: { usd?: string }
    atl?: { usd?: number }
    atl_change_percentage?: { usd?: number }
    atl_date?: { usd?: string }
  }
}

interface ChartPoint {
  time: string
  price: number
  volume: number
}

interface NewsArticle {
  id: string
  title: string
  url: string
  source: string
  publishedAt: string
}

// אין אפשרות "All" - ה-API החינמי של CoinGecko חוסם גישה להיסטוריה מעבר לשנה אחורה
const RANGE_OPTIONS = [
  { label: '24h', value: '1' },
  { label: '7D', value: '7' },
  { label: '1M', value: '30' },
  { label: '1Y', value: '365' }
]

const formatUsd = (value?: number, digits = 2) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'N/A'
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })}`
}

const formatCompactUsd = (value?: number) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'N/A'
  return `$${value.toLocaleString(undefined, { notation: 'compact', maximumFractionDigits: 2 })}`
}

const formatNumber = (value?: number | null, suffix = '') => {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'N/A'
  return `${value.toLocaleString(undefined, { notation: 'compact', maximumFractionDigits: 2 })}${suffix}`
}

const formatPercent = (value?: number) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'N/A'
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

const cleanDescription = (html: string) =>
  html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()

function CoinDetails() {
  const { coinId } = useParams<{ coinId: string }>()
  const navigate = useNavigate()
  const { isDarkMode } = useTheme()
  const [coin, setCoin] = useState<CoinData | null>(null)
  const [chartData, setChartData] = useState<ChartPoint[]>([])
  const [days, setDays] = useState('30')
  const [newsRange, setNewsRange] = useState<'day' | 'week' | 'month'>('week')
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([])
  const [visibleNewsCount, setVisibleNewsCount] = useState(5)
  const [newsLoading, setNewsLoading] = useState(true)
  const [coinAmount, setCoinAmount] = useState<number | ''>(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCoinDeepData = async () => {
      try {
        setLoading(true)

        const [infoRes, chartRes] = await Promise.all([
          apiClient.get(`/api/crypto/coin/${coinId}`),
          apiClient.get(`/api/crypto/coin/${coinId}/chart`, {
            params: { days }
          })
        ])

        setCoin(infoRes.data)

        const formattedChart = (chartRes.data.prices || []).map((p: number[], index: number) => {
          const date = new Date(p[0])
          const volumePoint = chartRes.data.total_volumes?.[index]
          return {
            time: days === '1'
              ? date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
              : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            price: p[1],
            volume: volumePoint?.[1] ?? 0
          }
        })
        setChartData(formattedChart)
      } catch (error) {
        console.error('Failed to load coin details:', error)
        setChartData([])
      } finally {
        setLoading(false)
      }
    }

    fetchCoinDeepData()
  }, [coinId, days])

  useEffect(() => {
    const fetchCoinNews = async () => {
      try {
        setNewsLoading(true)
        setVisibleNewsCount(5)
        const res = await apiClient.get(`/api/crypto/coin/${coinId}/news`, {
          params: { range: newsRange, limit: 40 }
        })
        setNewsArticles(res.data)
      } catch (error) {
        console.error('Failed to load coin news:', error)
        setNewsArticles([])
      } finally {
        setNewsLoading(false)
      }
    }

    fetchCoinNews()
  }, [coinId, newsRange])

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '100px', color: '#64748b', fontWeight: 700 }}>Loading coin intelligence...</div>
  }

  if (!coin) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px', color: '#64748b', fontWeight: 700 }}>
        Could not load coin data.
      </div>
    )
  }

  const currentPrice = coin.market_data.current_price.usd
  const firstPrice = chartData[0]?.price || currentPrice
  const lastPrice = chartData[chartData.length - 1]?.price || currentPrice
  const rangeChange = ((lastPrice - firstPrice) / (firstPrice || 1)) * 100
  const isTrendPositive = rangeChange >= 0
  const graphColor = isTrendPositive ? '#10b981' : '#ef4444'
  const textColor = isDarkMode ? '#f8fafc' : '#0f172a'
  const mutedColor = isDarkMode ? '#94a3b8' : '#64748b'
  const panelBg = isDarkMode ? '#111827' : '#ffffff'
  const softBg = isDarkMode ? '#0f172a' : '#f8fafc'
  const borderColor = isDarkMode ? '#1f2937' : '#e2e8f0'
  const usdValue = (coinAmount === '' ? 0 : Number(coinAmount)) * currentPrice
  const homepage = coin.links.homepage?.find(Boolean)
  const explorer = coin.links.blockchain_site?.find(Boolean)
  const description = cleanDescription(coin.description?.en || '')

  const panelStyle: CSSProperties = {
    background: panelBg,
    border: `1px solid ${borderColor}`,
    borderRadius: '18px',
    boxShadow: '0 18px 45px rgba(0,0,0,0.04)'
  }

  const statItems = [
    { label: 'Market cap', value: formatCompactUsd(coin.market_data.market_cap.usd), change: formatPercent(coin.market_data.price_change_percentage_24h), positive: (coin.market_data.price_change_percentage_24h ?? 0) >= 0 },
    { label: 'Volume (24h)', value: formatCompactUsd(coin.market_data.total_volume.usd), change: '24h' },
    { label: 'Vol/Mkt Cap (24h)', value: `${((coin.market_data.total_volume.usd / (coin.market_data.market_cap.usd || 1)) * 100).toFixed(2)}%` },
    { label: 'FDV', value: formatCompactUsd(coin.market_data.fully_diluted_valuation?.usd) },
    { label: 'Total supply', value: formatNumber(coin.market_data.total_supply, ` ${coin.symbol.toUpperCase()}`) },
    { label: 'Max supply', value: coin.market_data.max_supply ? formatNumber(coin.market_data.max_supply, ` ${coin.symbol.toUpperCase()}`) : 'Unlimited / N/A' },
    { label: 'Circulating supply', value: formatNumber(coin.market_data.circulating_supply, ` ${coin.symbol.toUpperCase()}`) }
  ]

  const marketRows = coin.tickers.slice(0, 12)
  const visibleNewsArticles = newsArticles.slice(0, visibleNewsCount)

  return (
    <div style={{ maxWidth: '1280px', margin: '28px auto 48px', padding: '0 24px', color: textColor, direction: 'ltr' }}>
      <button
        onClick={() => navigate('/dashboard')}
        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: panelBg, border: `1px solid ${borderColor}`, borderRadius: '12px', cursor: 'pointer', fontWeight: 800, color: mutedColor, marginBottom: '20px' }}
      >
        <ArrowLeft size={16} /> Back to Markets
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(320px, 380px)', gap: '24px', alignItems: 'start' }}>
        <aside style={{ gridColumn: 2, gridRow: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ ...panelStyle, padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {coin.image?.small && <img src={coin.image.small} alt={coin.name} style={{ width: '42px', height: '42px', borderRadius: '50%' }} />}
                <div>
                  <h1 style={{ margin: 0, color: textColor, fontSize: '28px', fontWeight: 900 }}>{coin.name}</h1>
                  <div style={{ color: mutedColor, fontSize: '13px', fontWeight: 800 }}>
                    {coin.symbol.toUpperCase()} {coin.market_cap_rank ? `#${coin.market_cap_rank}` : ''}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '18px', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '38px', fontWeight: 900, color: textColor }}>{formatUsd(currentPrice, currentPrice < 1 ? 4 : 2)}</div>
              <div style={{ color: (coin.market_data.price_change_percentage_24h ?? 0) >= 0 ? '#10b981' : '#ef4444', fontSize: '14px', fontWeight: 900 }}>
                {formatPercent(coin.market_data.price_change_percentage_24h)} (24h)
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {statItems.map((item, index) => (
                <div key={item.label} style={{
                  gridColumn: index === 0 || item.label === 'Circulating supply' ? '1 / -1' : undefined,
                  background: softBg,
                  border: `1px solid ${borderColor}`,
                  borderRadius: '12px',
                  padding: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', color: mutedColor, fontSize: '12px', fontWeight: 700 }}>
                    {item.label} <Info size={12} />
                  </div>
                  <div style={{ marginTop: '6px', textAlign: 'center', color: textColor, fontWeight: 900, fontSize: '16px' }}>{item.value}</div>
                  {item.change && (
                    <div style={{ marginTop: '3px', textAlign: 'center', color: item.positive ? '#10b981' : '#64748b', fontWeight: 800, fontSize: '12px' }}>
                      {item.change}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...panelStyle, padding: '20px' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '15px', color: textColor }}>Links</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {homepage && (
                <a href={homepage} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3861fb', textDecoration: 'none', fontWeight: 800, fontSize: '13px' }}>
                  <Globe size={16} /> Website <ExternalLink size={13} />
                </a>
              )}
              {coin.links.whitepaper && (
                <a href={coin.links.whitepaper} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', textDecoration: 'none', fontWeight: 800, fontSize: '13px' }}>
                  <FileText size={16} /> Whitepaper <ExternalLink size={13} />
                </a>
              )}
              {explorer && (
                <a href={explorer} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: mutedColor, textDecoration: 'none', fontWeight: 800, fontSize: '13px' }}>
                  <ShieldCheck size={16} /> Explorer <ExternalLink size={13} />
                </a>
              )}
            </div>
          </div>

          <div style={{ ...panelStyle, padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', color: textColor }}>
                <Newspaper size={16} /> Latest News
              </h3>
            </div>

            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
              {[
                { label: 'Day', value: 'day' },
                { label: 'Week', value: 'week' },
                { label: 'Month', value: 'month' }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setNewsRange(option.value as 'day' | 'week' | 'month')}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    borderRadius: '10px',
                    border: `1px solid ${borderColor}`,
                    background: newsRange === option.value ? '#3861fb' : softBg,
                    color: newsRange === option.value ? '#ffffff' : mutedColor,
                    cursor: 'pointer',
                    fontWeight: 900,
                    fontSize: '12px'
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {newsLoading ? (
              <div style={{ color: mutedColor, fontSize: '13px', fontWeight: 700 }}>Loading news...</div>
            ) : visibleNewsArticles.length === 0 ? (
              <div style={{ color: mutedColor, fontSize: '13px', fontWeight: 700 }}>No recent articles found.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {visibleNewsArticles.map(article => (
                  <a
                    key={article.id}
                    href={article.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ display: 'block', color: 'inherit', textDecoration: 'none', borderBottom: `1px solid ${borderColor}`, paddingBottom: '12px' }}
                  >
                    <div style={{ color: textColor, fontSize: '13px', fontWeight: 900, lineHeight: 1.35 }}>{article.title}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginTop: '8px', color: mutedColor, fontSize: '11px', fontWeight: 700 }}>
                      <span>{article.source}</span>
                      <span>{article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('en-US') : ''}</span>
                    </div>
                  </a>
                ))}
                {visibleNewsCount < newsArticles.length && (
                  <button
                    onClick={() => setVisibleNewsCount(count => count + 5)}
                    style={{ padding: '10px 12px', borderRadius: '10px', border: `1px solid ${borderColor}`, background: softBg, color: textColor, fontWeight: 900, cursor: 'pointer' }}
                  >
                    Load More
                  </button>
                )}
              </div>
            )}
          </div>

          <div style={{ ...panelStyle, padding: '20px' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '15px', color: textColor }}>{coin.symbol.toUpperCase()} to USD converter</h3>
            <div style={{ border: `1px solid ${borderColor}`, borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '12px', background: softBg, borderBottom: `1px solid ${borderColor}` }}>
                <span style={{ color: mutedColor, fontWeight: 800 }}>{coin.symbol.toUpperCase()}</span>
                <input
                  type="number"
                  value={coinAmount}
                  onChange={(event) => setCoinAmount(event.target.value === '' ? '' : Number(event.target.value))}
                  style={{ width: '140px', textAlign: 'right', background: 'transparent', color: textColor, border: 'none', outline: 'none', fontWeight: 900 }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '12px', background: panelBg }}>
                <span style={{ color: mutedColor, fontWeight: 800 }}>USD</span>
                <span style={{ color: textColor, fontWeight: 900 }}>{usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          <div style={{ ...panelStyle, padding: '20px' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '15px', color: textColor }}>Price performance</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: mutedColor, fontSize: '13px' }}>
              <span>Low<br /><strong style={{ color: textColor }}>{formatUsd(coin.market_data.low_24h?.usd)}</strong></span>
              <span style={{ textAlign: 'right' }}>High<br /><strong style={{ color: textColor }}>{formatUsd(coin.market_data.high_24h?.usd)}</strong></span>
            </div>
            <div style={{ height: '4px', background: isDarkMode ? '#374151' : '#e2e8f0', borderRadius: '999px', marginBottom: '18px' }}>
              <div style={{ width: '55%', height: '100%', background: '#64748b', borderRadius: '999px' }} />
            </div>
            <div style={{ display: 'grid', gap: '12px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                <span style={{ color: mutedColor }}>All-time high<br />{coin.market_data.ath_date?.usd ? new Date(coin.market_data.ath_date.usd).toLocaleDateString('en-US') : ''}</span>
                <span style={{ textAlign: 'right', color: textColor, fontWeight: 900 }}>{formatUsd(coin.market_data.ath?.usd)}<br /><span style={{ color: '#ef4444' }}>{formatPercent(coin.market_data.ath_change_percentage?.usd)}</span></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                <span style={{ color: mutedColor }}>All-time low<br />{coin.market_data.atl_date?.usd ? new Date(coin.market_data.atl_date.usd).toLocaleDateString('en-US') : ''}</span>
                <span style={{ textAlign: 'right', color: textColor, fontWeight: 900 }}>{formatUsd(coin.market_data.atl?.usd)}<br /><span style={{ color: '#10b981' }}>{formatPercent(coin.market_data.atl_change_percentage?.usd)}</span></span>
              </div>
            </div>
          </div>
        </aside>

        <main style={{ gridColumn: 1, gridRow: 1, minWidth: 0 }}>
          <div style={{ ...panelStyle, padding: '0', overflow: 'hidden', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', padding: '16px 18px', borderBottom: `1px solid ${borderColor}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px', color: mutedColor, fontWeight: 900, fontSize: '14px' }}>
                <span style={{ color: '#3861fb', borderBottom: '2px solid #3861fb', paddingBottom: '12px' }}>Chart</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', background: isDarkMode ? '#1f2937' : '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
                {RANGE_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setDays(option.value)}
                    style={{ padding: '7px 11px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 900, background: days === option.value ? '#3861fb' : 'transparent', color: days === option.value ? '#ffffff' : mutedColor }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ padding: '16px 18px 8px', display: 'flex', justifyContent: 'space-between', gap: '14px', alignItems: 'center' }}>
              <div>
                <div style={{ color: mutedColor, fontSize: '12px', fontWeight: 800 }}>Selected range</div>
                <div style={{ color: graphColor, fontSize: '18px', fontWeight: 900 }}>{formatPercent(rangeChange)}</div>
              </div>
            </div>

            <div style={{ height: '430px', padding: '0 8px 8px' }}>
              {chartData.length === 0 ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: mutedColor, fontWeight: 800 }}>
                  Real chart data is unavailable right now.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 12, right: 26, left: 0, bottom: 8 }}>
                    <defs>
                      <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={graphColor} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={graphColor} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={borderColor} vertical={false} />
                    <XAxis dataKey="time" tick={{ fill: mutedColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="price" orientation="right" domain={['auto', 'auto']} tick={{ fill: mutedColor, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(value) => formatCompactUsd(Number(value)).replace('$', '')} />
                    <YAxis yAxisId="volume" hide />
                    <Tooltip
                      contentStyle={{ background: panelBg, border: `1px solid ${borderColor}`, borderRadius: '12px', color: textColor }}
                      formatter={(value, name) => {
                        const numericValue = Number(value ?? 0)
                        return name === 'price'
                          ? [formatUsd(numericValue, currentPrice < 1 ? 4 : 2), 'Price']
                          : [formatCompactUsd(numericValue), 'Volume']
                      }}
                    />
                    <Bar yAxisId="volume" dataKey="volume" fill={isDarkMode ? '#263454' : '#dbeafe'} barSize={3} opacity={0.55} />
                    <Area yAxisId="price" type="linear" dataKey="price" stroke={graphColor} fill="url(#priceGradient)" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div style={{ ...panelStyle, padding: '20px', marginBottom: '20px' }}>
            <h2 style={{ margin: '0 0 14px', color: textColor, fontSize: '22px', fontWeight: 900 }}>About {coin.name}</h2>
            <p style={{ margin: 0, color: mutedColor, fontSize: '14px', lineHeight: 1.7 }}>
              {description ? `${description.slice(0, 420)}${description.length > 420 ? '...' : ''}` : `${coin.name} is a digital asset tracked with live market data, price history and exchange liquidity.`}
            </p>
          </div>

          <div style={{ ...panelStyle, padding: '20px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', gap: '16px', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, color: textColor, fontSize: '26px', fontWeight: 900 }}>{coin.name} Markets</h2>
              <div style={{ display: 'flex', gap: '8px', color: mutedColor, fontSize: '12px', fontWeight: 900 }}>
                <span style={{ background: softBg, border: `1px solid ${borderColor}`, padding: '7px 12px', borderRadius: '10px', color: textColor }}>All</span>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '760px', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${borderColor}`, color: mutedColor, fontSize: '12px', fontWeight: 900 }}>
                    <th style={{ padding: '13px 10px' }}>#</th>
                    <th style={{ padding: '13px 10px' }}>Exchange</th>
                    <th style={{ padding: '13px 10px' }}>Pairs</th>
                    <th style={{ padding: '13px 10px' }}>Price</th>
                    <th style={{ padding: '13px 10px' }}>Spread</th>
                    <th style={{ padding: '13px 10px' }}>Quantity / Volume (24h)</th>
                    <th style={{ padding: '13px 10px' }}>Volume %</th>
                    <th style={{ padding: '13px 10px' }}>Trust</th>
                  </tr>
                </thead>
                <tbody>
                  {marketRows.map((ticker, index) => {
                    const volumeUsd = ticker.converted_volume?.usd ?? ticker.volume ?? 0
                    const volumePercent = coin.market_data.total_volume.usd > 0 ? (volumeUsd / coin.market_data.total_volume.usd) * 100 : 0
                    const trustColor = ticker.trust_score === 'green' ? '#10b981' : ticker.trust_score === 'yellow' ? '#f59e0b' : '#64748b'
                    return (
                      <tr key={`${ticker.market.name}-${ticker.base}-${ticker.target}-${index}`} style={{ borderBottom: `1px solid ${borderColor}`, color: textColor, fontSize: '13px' }}>
                        <td style={{ padding: '14px 10px', color: mutedColor, fontWeight: 800 }}>{index + 1}</td>
                        <td style={{ padding: '14px 10px', fontWeight: 900 }}>{ticker.market.name}</td>
                        <td style={{ padding: '14px 10px', color: '#3861fb', fontWeight: 900 }}>{ticker.base}/{ticker.target}</td>
                        <td style={{ padding: '14px 10px', fontWeight: 800 }}>{formatUsd(ticker.converted_last?.usd ?? ticker.last, currentPrice < 1 ? 4 : 2)}</td>
                        <td style={{ padding: '14px 10px', color: mutedColor, fontWeight: 800 }}>{typeof ticker.bid_ask_spread_percentage === 'number' ? `${ticker.bid_ask_spread_percentage.toFixed(2)}%` : 'N/A'}</td>
                        <td style={{ padding: '14px 10px' }}><span style={{ background: isDarkMode ? 'rgba(16,185,129,0.18)' : '#dcfce7', color: '#10b981', padding: '6px 12px', borderRadius: '999px', fontWeight: 900 }}>{formatCompactUsd(volumeUsd)}</span></td>
                        <td style={{ padding: '14px 10px', fontWeight: 800 }}>{volumePercent >= 0.01 ? `${volumePercent.toFixed(2)}%` : '<0.01%'}</td>
                        <td style={{ padding: '14px 10px' }}><span style={{ color: trustColor, fontWeight: 900 }}>{ticker.trust_score || 'N/A'}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default CoinDetails
