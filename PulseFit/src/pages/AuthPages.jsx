import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Loader2, LogIn, Mail, Lock, UserRound, Target, Timer, Sparkles } from 'lucide-react'
import Logo from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'
import { Backdrop } from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

function AuthShell({ eyebrow, title, subtitle, children, footer }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="relative min-h-dvh">
      <Backdrop />
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-10">
        <Logo />
        <ThemeToggle />
      </header>
      <main className="mx-auto grid max-w-md px-4 pb-16 pt-6 sm:pt-12">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="glass relative overflow-hidden p-6 sm:p-8"
        >
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-lime/20 blur-3xl" />
          <p className="relative mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] accent">
            <Sparkles size={13} /> {eyebrow}
          </p>
          <h1 className="relative text-3xl font-bold">{title}</h1>
          <p className="relative mt-2 text-muted">{subtitle}</p>
          <div className="relative mt-6">{children}</div>
        </motion.div>
        <p className="mt-6 text-center text-sm text-muted">{footer}</p>
      </main>
    </motion.div>
  )
}

function Field({ icon: Icon, label, hint, ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
        <Icon size={14} className="text-muted" /> {label}
      </span>
      <input className="input" {...props} />
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  )
}

function useAfterAuth() {
  const location = useLocation()
  const navigate = useNavigate()
  const to = location.state?.from && location.state.from !== '/login' ? location.state.from : '/dashboard'
  return () => navigate(to, { replace: true })
}

export function Login() {
  const { user, login } = useAuth()
  const { toast } = useToast()
  const done = useAfterAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (user && !busy) return <Navigate to="/dashboard" replace />

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const u = await login(form.email, form.password)
      toast(`Welcome back, ${u.fullName.split(' ')[0]}! 💪`)
      done()
    } catch (err) {
      setError(err.message)
      if (err.isDbDown || err.code === 'NETWORK') toast("Can't log in right now", { type: 'error', description: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Log in to PulseFit"
      subtitle="Pick up right where you left off. Your streak is waiting."
      footer={<>New here? <Link to="/signup" className="font-semibold accent hover:underline">Create an account</Link></>}
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field icon={Mail} label="Email" type="email" autoComplete="email" required placeholder="you@example.com"
          value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Field icon={Lock} label="Password" type="password" autoComplete="current-password" required placeholder="••••••••"
          value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {error && <p className="rounded-xl bg-[#FF6B4A]/10 px-3 py-2 text-sm text-[#FF6B4A]" role="alert">{error}</p>}
        <button type="submit" className="btn-primary w-full text-lg" disabled={busy}>
          {busy ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />} {busy ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </AuthShell>
  )
}

export function Signup() {
  const { user, signup } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', weeklyGoalWorkouts: 4, weeklyGoalMinutes: 180 })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (user && !busy) return <Navigate to="/dashboard" replace />
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const u = await signup({
        ...form,
        weeklyGoalWorkouts: Number(form.weeklyGoalWorkouts),
        weeklyGoalMinutes: Number(form.weeklyGoalMinutes),
      })
      toast(`Welcome to PulseFit, ${u.fullName.split(' ')[0]}! 🎉`, { description: 'Pick a few moves from the Library to build today’s workout.' })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message)
      if (err.isDbDown || err.code === 'NETWORK') toast("Can't sign up right now", { type: 'error', description: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Join PulseFit"
      title="Create your account"
      subtitle="Set your weekly goals and we'll track every rep toward them."
      footer={<>Already a member? <Link to="/login" className="font-semibold accent hover:underline">Log in</Link></>}
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field icon={UserRound} label="Full name" autoComplete="name" required placeholder="Alex Rivera"
          value={form.fullName} onChange={set('fullName')} />
        <Field icon={Mail} label="Email" type="email" autoComplete="email" required placeholder="you@example.com"
          value={form.email} onChange={set('email')} />
        <Field icon={Lock} label="Password" type="password" autoComplete="new-password" required placeholder="8+ characters, a letter and a number"
          value={form.password} onChange={set('password')} />
        <div className="grid grid-cols-2 gap-3">
          <Field icon={Target} label="Workouts / week" type="number" min={1} max={14} inputMode="numeric"
            value={form.weeklyGoalWorkouts} onChange={set('weeklyGoalWorkouts')} />
          <Field icon={Timer} label="Minutes / week" type="number" min={10} max={2000} step={10} inputMode="numeric"
            value={form.weeklyGoalMinutes} onChange={set('weeklyGoalMinutes')} />
        </div>
        {error && <p className="rounded-xl bg-[#FF6B4A]/10 px-3 py-2 text-sm text-[#FF6B4A]" role="alert">{error}</p>}
        <button type="submit" className="btn-primary w-full text-lg" disabled={busy}>
          {busy ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />} {busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthShell>
  )
}
