import { Heart } from 'lucide-react'
import Logo from './Logo'

export default function Footer({ compact = false }) {
  const year = new Date().getFullYear()
  return (
    <footer className="border-t border-line/5">
      <div
        className={`mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 text-sm text-muted sm:flex-row sm:justify-between sm:px-6 lg:px-10 ${
          compact ? 'py-6' : 'py-10'
        }`}
      >
        <Logo size="sm" />
        <p className="flex items-center gap-1.5">
          © {year} PulseFit. Built with <Heart size={14} className="fill-[#FF6B4A] text-[#FF6B4A]" /> for people who show up.
        </p>
        <div className="flex gap-5">
          <a href="#" onClick={(e) => e.preventDefault()} className="transition hover:text-ink">Privacy</a>
          <a href="#" onClick={(e) => e.preventDefault()} className="transition hover:text-ink">Terms</a>
          <a href="#" onClick={(e) => e.preventDefault()} className="transition hover:text-ink">Support</a>
        </div>
      </div>
    </footer>
  )
}
