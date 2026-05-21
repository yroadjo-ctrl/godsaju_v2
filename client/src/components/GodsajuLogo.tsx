/** 갓사주 브랜드 로고 (로컬 SVG — 배포 환경에서도 표시) */
interface Props {
  className?: string
}

export default function GodsajuLogo({ className = 'w-32 h-32' }: Props) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      role="img"
      aria-label="갓사주"
    >
      <defs>
        <linearGradient id="godsaju-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#EAB308" />
        </linearGradient>
      </defs>
      <rect x="8" y="8" width="104" height="104" rx="22" fill="#111827" />
      <circle cx="60" cy="52" r="28" fill="url(#godsaju-gold)" opacity="0.95" />
      <text
        x="60"
        y="58"
        textAnchor="middle"
        fontSize="28"
        fontWeight="700"
        fill="#111827"
        fontFamily="system-ui, sans-serif"
      >
        命
      </text>
      <text
        x="60"
        y="96"
        textAnchor="middle"
        fontSize="18"
        fontWeight="700"
        fill="url(#godsaju-gold)"
        fontFamily="system-ui, sans-serif"
      >
        갓사주
      </text>
    </svg>
  )
}
