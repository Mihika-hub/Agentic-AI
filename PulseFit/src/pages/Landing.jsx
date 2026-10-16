import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight, Play, Users, Dumbbell, Calendar, Flame, Timer, Trophy, TrendingUp, Sparkles, Zap, HeartPulse, LogOut,
} from 'lucide-react'
import Logo from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'
import Footer from '../components/Footer'
import AnimatedCounter from '../components/AnimatedCounter'
import ProgressRing from '../components/ProgressRing'
import QuoteCard from '../components/QuoteCard'
import { Avatar, Backdrop, useLogout } from '../components/Layout'
import { SkeletonLine } from '../components/Skeleton'
// The hero illustration keeps its sample numbers on purpose; it is artwork, not user data.
import { user } from '../data/mockData'
import { useAuth } from '../context/AuthContext'
import { useApi } from '../lib/useApi'

const statIcons = { Users, Dumbbell, Calendar }

function useCommunityStats() {
  const { data, error, loading } = useApi('/stats')
  const stats = [
    { label: 'Active members', value: data?.members, icon: 'Users' },
    { label: 'Workouts completed', value: data?.workoutsCompleted, icon: 'Dumbbell' },
    { label: 'Classes this week', value: data?.classesThisWeek, icon: 'Calendar' },
  ]
  return { stats, error, loading }
}

const features = [
  { icon: Dumbbell, title: 'Workout Library', text: 'Filter 100s of moves by muscle group, with sets, reps and difficulty.', to: '/library', color: '#C6FF3D' },
  { icon: Timer, title: 'Live Workout Mode', text: 'Big rest timer, tap-to-tick sets, and a confetti finish line.', to: '/workout', color: '#22E4FF' },
  { icon: TrendingUp, title: 'Progress Tracking', text: 'Watch your strength curve climb and collect PR trophies.', to: '/progress', color: '#7CFFB2' },
  { icon: Calendar, title: 'Class Booking', text: 'Yoga, HIIT, Spin and Boxing. Grab a spot in one tap.', to: '/classes', color: '#A78BFA' },
  { icon: Flame, title: 'Streaks & Rings', text: 'Daily streaks and weekly rings that keep you coming back.', to: '/dashboard', color: '#FF6B4A' },
  { icon: Trophy, title: 'Achievements', text: 'Unlock badges as you level up your membership.', to: '/profile', color: '#FFC94A' },
]

const container = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } }
const item = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } } }

function HeroVisual() {
  return (
    <div className="relative mx-auto h-[440px] w-full max-w-[420px] sm:h-[500px]">
      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 40, rotate: -4 }}
        animate={{ opacity: 1, y: 0, rotate: -3 }}
        transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="glass absolute left-1/2 top-6 w-[290px] -translate-x-1/2 p-6 sm:w-[320px]"
      >
        <div className="flex items-center justify-between">
          <span className="chip bg-lime/15 accent"><Zap size={12} /> Today</span>
          <span className="text-xs text-muted">48 min</span>
        </div>
        <p className="mt-4 font-display text-2xl font-bold tracking-tight">Upper Body Power</p>
        <p className="text-sm text-muted">4 exercises · 13 sets</p>
        <div className="mt-6 flex items-center justify-center">
          <ProgressRing value={9} max={13} size={170} stroke={14} delay={0.8} duration={2}>
            <div>
              <p className="font-display text-4xl font-bold">69%</p>
              <p className="text-xs text-muted">9 of 13 sets</p>
            </div>
          </ProgressRing>
        </div>
        <div className="mt-6 space-y-2">
          {['Bench Press', 'Incline DB Press', 'Pull-Ups'].map((n, i) => (
            <div key={n} className="flex items-center justify-between rounded-xl bg-ink/5 px-3 py-2 text-sm">
              <span>{n}</span>
              <span className={i < 2 ? 'accent font-semibold' : 'text-muted'}>{i < 2 ? 'Done' : '1/3'}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Heart-rate chip */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.7 }}
        className="glass absolute left-0 top-[58%] w-44 animate-float !rounded-2xl p-4"
      >
        <div className="flex items-center gap-2 text-xs text-muted"><HeartPulse size={14} className="text-[#FF6B4A]" /> Heart rate</div>
        <p className="mt-1 font-display text-2xl font-bold">142 <span className="text-sm font-medium text-muted">bpm</span></p>
        <svg viewBox="0 0 160 36" className="mt-1 h-8 w-full">
          <path d="M0 20h30l6-12 10 24 8-18 6 6h30l6-14 10 26 6-12h48" fill="none" stroke="#FF6B4A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="300" className="animate-pulseLine" />
        </svg>
      </motion.div>

      {/* Streak chip */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.9 }}
        className="glass absolute right-0 top-2 !rounded-2xl p-4 sm:-right-4"
        style={{ animation: 'float 7s ease-in-out infinite 1s' }}
      >
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-[#FF6B4A] to-[#FFC94A] text-white">
            <Flame size={22} />
          </div>
          <div>
            <p className="font-display text-xl font-bold leading-none">{user.streak} days</p>
            <p className="text-xs text-muted">streak 🔥</p>
          </div>
        </div>
      </motion.div>

      {/* PR chip */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.1 }}
        className="glass absolute bottom-0 right-2 !rounded-2xl p-4"
      >
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#FFC94A]/15 text-[#FFC94A]"><Trophy size={20} /></div>
          <div>
            <p className="text-xs text-muted">New PR · Deadlift</p>
            <p className="font-display text-xl font-bold leading-none">155 kg</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default function Landing() {
  const { user: me } = useAuth()
  const handleLogout = useLogout()
  const { stats: communityStats, error: statsError, loading: statsLoading } = useCommunityStats()
  const startTo = me ? '/dashboard' : '/signup'
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="relative min-h-dvh overflow-x-hidden">
      <Backdrop />

      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-line/5 bg-bg/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-10">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted md:flex">
            <Link to="/library" className="transition hover:text-ink">Workouts</Link>
            <Link to="/classes" className="transition hover:text-ink">Classes</Link>
            <Link to="/progress" className="transition hover:text-ink">Progress</Link>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {me ? (
              <>
                <span className="hidden items-center gap-2 text-sm font-semibold sm:flex">
                  <Avatar name={me.fullName} className="h-9 w-9" /> {me.fullName}
                </span>
                <button onClick={handleLogout} className="btn-ghost !px-3 !py-2.5 text-sm" aria-label="Log out">
                  <LogOut size={16} /> <span className="hidden sm:inline">Log out</span>
                </button>
                <Link to="/dashboard" className="btn-primary !px-4 !py-2.5 text-sm">
                  Open app <ArrowRight size={16} />
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost !px-4 !py-2.5 text-sm">Log in</Link>
                <Link to="/signup" className="btn-primary !px-4 !py-2.5 text-sm">
                  Sign up <ArrowRight size={16} />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-10 sm:px-6 md:pt-16 lg:grid-cols-[1.1fr_1fr] lg:px-10 lg:pt-20">
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.div variants={item} className="chip mb-6 border border-lime/30 bg-lime/10 accent">
            <Sparkles size={13} /> New: AI-paced rest timers
          </motion.div>
          <motion.h1 variants={item} className="text-[clamp(2.75rem,8vw,5.25rem)] font-bold leading-[0.95]">
            <span className="sr-only">PulseFit: </span>
            Train smarter.
            <br />
            <span className="text-gradient animate-shimmer">Get stronger.</span>
          </motion.h1>
          <motion.p variants={item} className="mt-6 max-w-lg text-lg text-muted">
            <span className="font-semibold text-ink">PulseFit</span> plans your workouts, tracks every rep, books your classes
            and keeps your streak alive. Your whole gym life, in your pocket.
          </motion.p>
          <motion.div variants={item} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to={startTo} className="btn-primary text-lg">
              <Play size={18} className="fill-current" /> Start Your Workout
            </Link>
            <Link to="/dashboard" className="btn-ghost text-lg">
              See your dashboard <ArrowRight size={18} />
            </Link>
          </motion.div>
          <motion.div variants={item} className="mt-8 flex items-center gap-4">
            <div className="flex -space-x-3">
              {[32, 45, 5, 47].map((n) => (
                <img key={n} src={`https://i.pravatar.cc/80?img=${n}`} alt="" className="h-10 w-10 rounded-full border-2 border-bg object-cover" />
              ))}
            </div>
            <p className="text-sm text-muted">
              <span className="font-semibold text-ink">4.9★</span> from 12,000+ members
            </p>
          </motion.div>
        </motion.div>
        <HeroVisual />
      </section>

      {/* Animated stats */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-10">
        <div className="glass grid grid-cols-1 divide-y divide-line/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {communityStats.map((s, i) => {
            const Icon = statIcons[s.icon]
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-4 p-6 sm:flex-col sm:items-start lg:p-8"
              >
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-lime/10 accent"><Icon size={22} /></div>
                <div>
                  <div className="font-display text-4xl font-bold lg:text-5xl">
                    {statsLoading ? (
                      <SkeletonLine className="h-10 w-24 lg:h-12" />
                    ) : statsError ? (
                      <span className="text-muted" title={statsError.message}>—</span>
                    ) : (
                      <AnimatedCounter value={s.value} compact />
                    )}
                  </div>
                  <p className="mt-1 text-muted">{s.label}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-10">
        <div className="mb-10 max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] accent">Everything you need</p>
          <h2 className="text-4xl font-bold sm:text-5xl">One app. Every rep. <span className="text-gradient">Zero excuses.</span></h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: (i % 3) * 0.08, duration: 0.6 }}
              whileHover={{ y: -6 }}
            >
              <Link to={f.to} className="glass group relative block h-full overflow-hidden p-6">
                <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-60" style={{ background: f.color }} />
                <div className="relative grid h-12 w-12 place-items-center rounded-2xl" style={{ background: `${f.color}1f`, color: f.color }}>
                  <f.icon size={22} />
                </div>
                <h3 className="relative mt-5 text-xl font-semibold">{f.title}</h3>
                <p className="relative mt-2 text-muted">{f.text}</p>
                <span className="relative mt-4 inline-flex items-center gap-1 text-sm font-semibold accent">
                  Explore <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Quote + CTA */}
      <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-20 sm:px-6 lg:grid-cols-[1fr_1.4fr] lg:px-10">
        <QuoteCard />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl p-8 text-[#0A0D12] sm:p-10"
          style={{ background: 'linear-gradient(120deg,#C6FF3D 0%,#7CFFB2 50%,#22E4FF 100%)' }}
        >
          <div className="absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-white/30 blur-3xl" />
          <h2 className="relative text-3xl font-bold sm:text-4xl">Your next PR starts today.</h2>
          <p className="relative mt-3 max-w-md text-[#0A0D12]/75">Jump into today's session. It takes 48 minutes and you'll feel unstoppable.</p>
          <Link to={startTo} className="relative mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#0A0D12] px-6 py-3.5 font-display font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-xl">
            <Play size={18} className="fill-current" /> Start Your Workout
          </Link>
        </motion.div>
      </section>
      </main>

      <Footer />
    </motion.div>
  )
}
