import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Play, Flame, Timer, Dumbbell, Zap, CalendarDays, ArrowRight, Target, ListChecks, CheckCircle2, BookOpen } from 'lucide-react'
import PageTransition from '../components/PageTransition'
import GlassCard from '../components/GlassCard'
import ProgressRing from '../components/ProgressRing'
import AnimatedCounter from '../components/AnimatedCounter'
import QuoteCard from '../components/QuoteCard'
import ChartTooltip from '../components/ChartTooltip'
import ErrorState from '../components/ErrorState'
import { PageSkeleton } from '../components/Skeleton'
import { useApi } from '../lib/useApi'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

// Rough time estimate: ~40 seconds of work per set plus the prescribed rest.
export function estimateMinutes(exercises) {
  const secs = exercises.reduce((a, e) => a + e.sets.length * (40 + e.restSeconds), 0)
  return Math.max(1, Math.round(secs / 60))
}

function formatClassTime(iso) {
  const d = new Date(iso)
  return `${d.toLocaleDateString(undefined, { weekday: 'short' })} · ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`
}

function TodayWorkoutCard({ workout }) {
  const exercises = workout?.exercises || []
  if (!exercises.length) {
    return (
      <GlassCard className="lg:col-span-2" hover={false}>
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-lime/20 blur-3xl" />
        <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="chip bg-lime/15 accent"><Zap size={12} /> Today's workout</span>
            <h2 className="mt-3 text-2xl font-bold sm:text-3xl">No workout yet today.</h2>
            <p className="mt-1 text-muted">Pick one from the Library! Add a few moves and they'll show up here.</p>
          </div>
          <Link to="/library" className="btn-primary shrink-0 text-lg">
            <BookOpen size={18} /> Open Library
          </Link>
        </div>
      </GlassCard>
    )
  }

  const totalSets = exercises.reduce((a, e) => a + e.sets.length, 0)
  const doneSets = exercises.reduce((a, e) => a + e.sets.filter((s) => s.completed).length, 0)
  const completed = workout.status === 'completed'
  const minutes = completed ? workout.durationMinutes : estimateMinutes(exercises)
  const groups = [...new Set(exercises.map((e) => e.muscleGroup))].join(' · ')
  const subtitle = completed
    ? `Finished in ${workout.durationMinutes} min. Great work!`
    : workout.status === 'in_progress'
      ? `In progress · ${doneSets} of ${totalSets} sets done`
      : `${groups} · ready when you are`

  return (
    <GlassCard className="lg:col-span-2" hover={false}>
      <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-lime/20 blur-3xl" />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="chip bg-lime/15 accent">
            {completed ? <CheckCircle2 size={12} /> : <Zap size={12} />} {completed ? 'Completed today' : "Today's workout"}
          </span>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">{workout.name}</h2>
          <p className="mt-1 text-muted">{subtitle}</p>
          <div className="mt-5 flex flex-wrap gap-2 text-sm">
            <span className="chip bg-ink/5 !py-1.5 text-ink"><Timer size={14} /> {completed ? '' : '~'}{minutes} min</span>
            <span className="chip bg-ink/5 !py-1.5 text-ink"><Dumbbell size={14} /> {totalSets} sets</span>
            <span className="chip bg-ink/5 !py-1.5 text-ink"><ListChecks size={14} /> {exercises.length} exercises</span>
          </div>
        </div>
        <Link to="/workout" className="btn-primary shrink-0 text-lg">
          {completed ? <CheckCircle2 size={18} /> : <Play size={18} className="fill-current" />}
          {completed ? 'View' : workout.status === 'in_progress' ? 'Resume' : 'Start'}
          <span className="sr-only"> today's workout</span>
        </Link>
      </div>
      <div className="relative mt-6 grid gap-2 sm:grid-cols-2">
        {exercises.map((e, i) => (
          <motion.div
            key={e.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.07 }}
            className="flex items-center gap-3 rounded-2xl bg-ink/[0.04] p-3"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ink/5 font-display font-bold text-muted">{i + 1}</span>
            <div className="min-w-0">
              <p className="truncate font-medium">{e.name}</p>
              <p className="text-xs text-muted">{e.sets.length} × {e.reps} · {e.restSeconds}s rest</p>
            </div>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  )
}

export default function Dashboard() {
  const { data, error, loading, reload } = useApi('/dashboard')

  if (loading && !data) return <PageSkeleton />
  if (error && !data) return <ErrorState error={error} onRetry={reload} />

  const { user, todayWorkout, activity, activityChangePct, week, streak, rings, nextClass } = data
  const totalMinutes = activity.reduce((a, d) => a + d.minutes, 0)
  const todayDate = activity[activity.length - 1]?.date
  const todayIdx = activity.length - 1

  return (
    <PageTransition>
      <div className="mb-6 sm:mb-8">
        <p className="text-muted">{greeting()}, {user.fullName.split(' ')[0]} 👋</p>
        <h1 className="mt-1 text-3xl font-bold sm:text-4xl">
          Ready to <span className="text-gradient">crush it</span> today?
        </h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Today's workout */}
        <TodayWorkoutCard workout={todayWorkout} />

        {/* Streak */}
        <GlassCard delay={0.1}>
          <div className="pointer-events-none absolute -bottom-16 -right-10 h-56 w-56 rounded-full bg-[#FF6B4A]/25 blur-3xl" />
          <p className="text-sm font-medium text-muted">Workout streak</p>
          <div className="mt-4 flex items-center gap-4">
            {/* Same pulse as before, as a CSS animation so it runs off the main thread. */}
            <div className="animate-flame grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-[#FF6B4A] to-[#FFC94A] text-white shadow-[0_0_40px_-6px_rgba(255,107,74,.7)]">
              <Flame size={40} className="fill-white/30" />
            </div>
            <div>
              <p className="font-display text-5xl font-bold leading-none"><AnimatedCounter value={streak.current} duration={1.2} /></p>
              <p className="mt-1 text-muted">{streak.current === 1 ? 'day in a row' : 'days in a row'}</p>
            </div>
          </div>
          <div className="mt-6 flex justify-between gap-1">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => {
              const day = week[i]
              const done = day?.trained
              const isToday = day?.date === todayDate
              return (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.05, type: 'spring' }}
                    className={`grid h-9 w-9 place-items-center rounded-xl text-xs font-bold ${
                      done ? 'bg-gradient-to-br from-[#FF6B4A] to-[#FFC94A] text-white' : 'bg-ink/5 text-muted'
                    } ${isToday ? 'ring-2 ring-lime ring-offset-2 ring-offset-bg' : ''}`}
                  >
                    {done ? <Flame size={14} /> : d}
                  </motion.div>
                  <span className="text-[10px] text-muted">{d}</span>
                </div>
              )
            })}
          </div>
          <p className="mt-4 text-sm text-muted">
            {streak.best > 0 ? (
              <>Best streak: <span className="font-semibold text-ink">{streak.best} {streak.best === 1 ? 'day' : 'days'}</span>. Keep going!</>
            ) : (
              'Finish your first workout to start a streak 🔥'
            )}
          </p>
        </GlassCard>

        {/* Rings */}
        <GlassCard delay={0.15} className="lg:col-span-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted">This week</p>
            <Target size={16} className="text-muted" />
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {rings.map((r, i) => (
              <div key={r.key} className="flex flex-col items-center">
                <ProgressRing value={r.value} max={r.goal} size={92} stroke={9} color={r.color} delay={0.3 + i * 0.15}>
                  <div>
                    <p className="font-display text-lg font-bold leading-none">{r.value}</p>
                    <p className="text-[10px] text-muted">/ {r.goal}</p>
                  </div>
                </ProgressRing>
                <p className="mt-2 text-center text-xs font-medium">{r.label}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Weekly chart */}
        <GlassCard delay={0.2} className="lg:col-span-2" hover={false}>
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-muted">Last 7 days</p>
              <p className="mt-1 font-display text-3xl font-bold">
                <AnimatedCounter value={totalMinutes} /> <span className="text-base font-medium text-muted">active minutes</span>
              </p>
            </div>
            {activityChangePct !== null ? (
              <span className={`chip ${activityChangePct >= 0 ? 'bg-lime/15 accent' : 'bg-[#FF6B4A]/15 text-[#FF6B4A]'}`}>
                {activityChangePct >= 0 ? '+' : ''}{activityChangePct}% vs last week
              </span>
            ) : (
              <span className="chip bg-ink/5 text-muted">Your first week 🌱</span>
            )}
          </div>
          <div className="mt-4 h-52 sm:h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activity} margin={{ top: 10, right: 0, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C6FF3D" />
                    <stop offset="100%" stopColor="#22E4FF" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="4 4" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip unit=" min" />} cursor={{ fill: 'rgba(198,255,61,0.06)', radius: 12 }} />
                <Bar dataKey="minutes" name="minutes" radius={[10, 10, 10, 10]} animationDuration={1400} maxBarSize={42}>
                  {activity.map((d, i) => (
                    <Cell key={d.date} fill={i === todayIdx ? 'url(#barGrad)' : 'rgba(198,255,61,0.55)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <QuoteCard delay={0.25} className="lg:col-span-2" />

        {/* Next class */}
        {nextClass && (
          <GlassCard delay={0.3}>
            <p className="text-sm font-medium text-muted">Next class</p>
            <h3 className="mt-2 text-xl font-bold">{nextClass.title}</h3>
            <p className="text-sm text-muted">{formatClassTime(nextClass.startTime)} · {nextClass.coachName}</p>
            <p className="mt-3 text-sm">
              <span className="font-semibold text-[#FF6B4A]">{nextClass.intensity} intensity</span>
              <span className="text-muted"> · {nextClass.durationMinutes} min · {nextClass.capacity} spots</span>
            </p>
            <Link to="/classes" className="btn-ghost mt-4 w-full">
              <CalendarDays size={16} /> Book a class <ArrowRight size={16} />
            </Link>
          </GlassCard>
        )}
      </div>
    </PageTransition>
  )
}
