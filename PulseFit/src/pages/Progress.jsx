import { useState } from 'react'
import { motion } from 'framer-motion'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Trophy, TrendingUp, Award, Calendar, Dumbbell, Timer } from 'lucide-react'
import PageTransition, { PageHeader } from '../components/PageTransition'
import GlassCard from '../components/GlassCard'
import AnimatedCounter from '../components/AnimatedCounter'
import ChartTooltip from '../components/ChartTooltip'
import { personalRecords, strengthHistory, user } from '../data/mockData'

const lifts = [
  { key: 'deadlift', label: 'Deadlift', color: '#C6FF3D' },
  { key: 'squat', label: 'Squat', color: '#22E4FF' },
  { key: 'bench', label: 'Bench', color: '#FF6B4A' },
]

const tiers = {
  gold: { color: '#FFC94A', label: 'Gold' },
  silver: { color: '#C9D3DD', label: 'Silver' },
  bronze: { color: '#E08A5A', label: 'Bronze' },
}

export default function Progress() {
  const [visible, setVisible] = useState(() => new Set(lifts.map((l) => l.key)))

  const toggle = (key) =>
    setVisible((prev) => {
      const next = new Set(prev)
      if (next.has(key) && next.size > 1) next.delete(key)
      else next.add(key)
      return next
    })

  const first = strengthHistory[0]
  const last = strengthHistory[strengthHistory.length - 1]
  const totalGain = lifts.reduce((a, l) => a + (last[l.key] - first[l.key]), 0)

  const summary = [
    { icon: TrendingUp, label: 'Total strength gained', value: totalGain, suffix: ' kg', color: '#C6FF3D' },
    { icon: Dumbbell, label: 'Workouts logged', value: user.stats.workouts, color: '#22E4FF' },
    { icon: Timer, label: 'Hours trained', value: user.stats.hours, color: '#A78BFA' },
    { icon: Trophy, label: 'Personal records', value: user.stats.prs, color: '#FFC94A' },
  ]

  return (
    <PageTransition>
      <PageHeader eyebrow="Progress" title="Look how far you've come" subtitle="Six months of consistent training, visualised." />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summary.map((s, i) => (
          <GlassCard key={s.label} delay={i * 0.06} className="!p-4 sm:!p-5">
            <div className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: `${s.color}1f`, color: s.color }}>
              <s.icon size={18} />
            </div>
            <p className="mt-3 font-display text-3xl font-bold">
              <AnimatedCounter value={s.value} suffix={s.suffix || ''} />
            </p>
            <p className="text-sm text-muted">{s.label}</p>
          </GlassCard>
        ))}
      </div>

      <GlassCard hover={false} delay={0.2} className="mb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Strength gains</h2>
            <p className="text-sm text-muted">Estimated 1-rep max, kg</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {lifts.map((l) => {
              const on = visible.has(l.key)
              return (
                <button
                  key={l.key}
                  onClick={() => toggle(l.key)}
                  aria-pressed={on}
                  className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
                    on ? 'border-transparent bg-ink/[0.07]' : 'border-line/10 text-muted opacity-60'
                  }`}
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: l.color, boxShadow: on ? `0 0 10px ${l.color}` : 'none' }} />
                  {l.label}
                  <span className="text-xs text-muted">+{last[l.key] - first[l.key]}</span>
                </button>
              )
            })}
          </div>
        </div>
        <div className="mt-6 h-72 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={strengthHistory} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
              <defs>
                {lifts.map((l) => (
                  <filter key={l.key} id={`glow-${l.key}`} x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="b" />
                    <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                ))}
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="4 4" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} domain={['dataMin - 10', 'dataMax + 10']} />
              <Tooltip content={<ChartTooltip unit=" kg" />} />
              {lifts.filter((l) => visible.has(l.key)).map((l) => (
                <Line
                  key={l.key}
                  type="monotone"
                  dataKey={l.key}
                  name={l.label}
                  stroke={l.color}
                  strokeWidth={3}
                  dot={{ r: 4, fill: l.color, strokeWidth: 0 }}
                  activeDot={{ r: 7, stroke: 'rgb(var(--bg))', strokeWidth: 3 }}
                  filter={`url(#glow-${l.key})`}
                  animationDuration={1600}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Personal records</h2>
        <span className="text-sm text-muted">{personalRecords.length} recent PRs</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {personalRecords.map((pr, i) => {
          const tier = tiers[pr.tier]
          return (
            <motion.div
              key={pr.lift}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.07 }}
              whileHover={{ y: -4 }}
              className="glass group flex items-center gap-4 p-4"
            >
              <motion.div
                whileHover={{ rotate: [0, -12, 12, 0] }}
                transition={{ duration: 0.5 }}
                className="relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl"
                style={{ background: `linear-gradient(135deg, ${tier.color}33, ${tier.color}0d)`, color: tier.color, boxShadow: `0 0 24px -6px ${tier.color}88` }}
              >
                <Trophy size={26} />
                <span className="absolute -bottom-1.5 rounded-full px-1.5 text-[9px] font-bold uppercase text-[#0A0D12]" style={{ background: tier.color }}>
                  {tier.label}
                </span>
              </motion.div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted">{pr.lift}</p>
                <p className="font-display text-2xl font-bold">{pr.value}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold accent">{pr.delta}</p>
                <p className="flex items-center justify-end gap-1 text-xs text-muted"><Calendar size={11} /> {pr.date}</p>
              </div>
            </motion.div>
          )
        })}
      </div>

      <GlassCard delay={0.5} className="mt-4 flex items-center gap-4" hover={false}>
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-lime/15 accent"><Award size={22} /></div>
        <p className="text-muted">
          <span className="font-semibold text-ink">You're 17.5 kg away from a 100 kg bench.</span> At your current pace, that's about 3 months. Keep stacking those plates.
        </p>
      </GlassCard>
    </PageTransition>
  )
}
