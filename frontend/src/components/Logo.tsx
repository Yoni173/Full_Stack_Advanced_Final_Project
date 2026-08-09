import { useId } from 'react'

interface LogoProps {
  size?: number
}

// סמל האפליקציה: אבן חן חתוכה בצורת משושה (blockchain hex) בגרדיאנט זהב - "אוצר שמור בכספת"
function Logo({ size = 26 }: LogoProps) {
  const uid = useId()
  const fillId = `cv-gem-fill-${uid}`
  const tableId = `cv-gem-table-${uid}`

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id={fillId} x1="4" y1="3" x2="20" y2="21" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset="0.5" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id={tableId} x1="8.5" y1="8" x2="15.5" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff7de" />
          <stop offset="1" stopColor="#fde68a" />
        </linearGradient>
      </defs>
      <path d="M12,3 L19.79,7.5 L19.79,16.5 L12,21 L4.21,16.5 L4.21,7.5 Z" fill={`url(#${fillId})`} />
      <path d="M12,8 L15.46,10 L15.46,14 L12,16 L8.54,14 L8.54,10 Z" fill={`url(#${tableId})`} opacity={0.92} />
      <g stroke="#fff7de" strokeWidth={0.35} opacity={0.85}>
        <path d="M12,3 L12,8 M19.79,7.5 L15.46,10 M19.79,16.5 L15.46,14 M12,21 L12,16 M4.21,16.5 L8.54,14 M4.21,7.5 L8.54,10" />
      </g>
    </svg>
  )
}

export default Logo
