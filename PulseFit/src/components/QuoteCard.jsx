import { Quote } from 'lucide-react'
import GlassCard from './GlassCard'
import { quoteOfTheDay } from '../data/mockData'

export default function QuoteCard({ delay = 0, className = '' }) {
  const q = quoteOfTheDay()
  return (
    <GlassCard delay={delay} className={className}>
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-cyan/20 blur-3xl" />
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan">
        <Quote size={14} /> Quote of the day
      </div>
      <p className="mt-3 font-display text-xl font-semibold leading-snug sm:text-2xl">“{q.text}”</p>
      <p className="mt-3 text-sm text-muted">— {q.author}</p>
    </GlassCard>
  )
}
