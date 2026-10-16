import { Link } from 'react-router-dom'

export function PulseMark({ size = 36, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="pf-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#C6FF3D" />
          <stop offset="1" stopColor="#22E4FF" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="#0B0F15" />
      <rect x="1" y="1" width="62" height="62" rx="17" fill="none" stroke="url(#pf-mark)" strokeOpacity=".35" />
      <path
        d="M8 34h12l5-12 8 24 6-16 4 4h13"
        fill="none"
        stroke="url(#pf-mark)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="300"
        className="animate-pulseLine"
      />
    </svg>
  )
}

export default function Logo({ to = '/', size = 'md' }) {
  const text = size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-lg' : 'text-2xl'
  const mark = size === 'lg' ? 44 : size === 'sm' ? 28 : 36
  return (
    <Link to={to} className="group inline-flex items-center gap-2.5" aria-label="PulseFit home">
      <PulseMark size={mark} className="transition-transform duration-500 group-hover:rotate-[-8deg] group-hover:scale-105" />
      <span className={`font-display font-bold tracking-tight ${text}`}>
        <span className="text-gradient">Pulse</span>
        <span className="text-ink">Fit</span>
      </span>
    </Link>
  )
}
