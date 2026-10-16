import { Suspense } from 'react'
import { NavLink, Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LayoutDashboard, Dumbbell, Timer, TrendingUp, CalendarDays, UserRound, Flame, LogOut, LogIn } from 'lucide-react'
import Logo from './Logo'
import ThemeToggle from './ThemeToggle'
import Footer from './Footer'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { PageSkeleton, SkeletonLine } from './Skeleton'

export function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() || '').join('') || '?'
}

export function Avatar({ name, className = 'h-10 w-10' }) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-xl font-display text-sm font-bold text-[#0A0D12] ring-2 ring-lime/40 ${className}`}
      style={{ background: 'linear-gradient(135deg,#C6FF3D,#22E4FF)' }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  )
}

export function useLogout() {
  const { logout } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  return async () => {
    try {
      // Leave the protected page first, otherwise its login guard redirects to /login.
      navigate('/', { replace: true })
      await logout()
      toast('Logged out', { type: 'info', description: 'See you at your next session 👋' })
    } catch (err) {
      toast("Couldn't log out", { type: 'error', description: err.message })
    }
  }
}

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/library', label: 'Library', icon: Dumbbell },
  { to: '/workout', label: 'Live Workout', short: 'Train', icon: Timer, primary: true },
  { to: '/progress', label: 'Progress', icon: TrendingUp },
  { to: '/classes', label: 'Classes', icon: CalendarDays },
  { to: '/profile', label: 'Profile', icon: UserRound },
]

function Sidebar() {
  const { user, streak, status } = useAuth()
  const authLoading = status === 'loading'
  const handleLogout = useLogout()
  const best = Math.max(streak.best, streak.current, 1)
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-line/5 p-5 lg:flex">
      <div className="px-2 pt-2">
        <Logo to="/" />
      </div>
      <nav className="mt-10 flex flex-col gap-1.5">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className="relative">
            {({ isActive }) => (
              <span
                className={`relative flex items-center gap-3 rounded-2xl px-4 py-3 font-medium transition-colors ${
                  isActive ? 'text-[#0A0D12]' : 'text-muted hover:bg-ink/5 hover:text-ink'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-2xl"
                    style={{ background: 'linear-gradient(100deg,#C6FF3D,#7CFFB2 60%,#22E4FF)', boxShadow: '0 10px 30px -12px rgba(198,255,61,.8)' }}
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <Icon size={19} className="relative" />
                <span className="relative">{label}</span>
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-4">
        {authLoading && (
          // Same size as the streak card, so nothing jumps when the session finishes loading.
          <div className="glass !rounded-2xl p-4" aria-hidden="true">
            <SkeletonLine className="h-5 w-32" />
            <SkeletonLine className="mt-1 h-8 w-24" />
            <div className="mt-3 h-1.5 rounded-full bg-ink/10" />
            <SkeletonLine className="mt-2 h-4 w-20" />
          </div>
        )}
        {user && (
          <div className="glass !rounded-2xl p-4">
            <div className="flex items-center gap-2 text-sm text-muted">
              <Flame size={16} className="text-[#FF6B4A]" /> Current streak
            </div>
            <p className="mt-1 font-display text-2xl font-bold">{streak.current} {streak.current === 1 ? 'day' : 'days'}</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink/10">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#FF6B4A] to-[#FFC94A]"
                initial={{ width: 0 }}
                animate={{ width: `${(streak.current / best) * 100}%` }}
                transition={{ duration: 1.2, delay: 0.3 }}
              />
            </div>
            <p className="mt-2 text-xs text-muted">Best: {streak.best} {streak.best === 1 ? 'day' : 'days'}</p>
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          {authLoading ? (
            <div className="flex items-center gap-3" aria-hidden="true">
              <SkeletonLine className="h-10 w-10" />
              <div className="space-y-1.5">
                <SkeletonLine className="h-4 w-24" />
                <SkeletonLine className="h-3 w-14" />
              </div>
            </div>
          ) : user ? (
            <div className="flex min-w-0 items-center gap-3">
              <Avatar name={user.fullName} />
              <div className="min-w-0 leading-tight">
                <p className="truncate text-sm font-semibold">{user.fullName}</p>
                <button onClick={handleLogout} className="inline-flex items-center gap-1 text-xs text-muted transition hover:text-ink">
                  <LogOut size={12} /> Log out
                </button>
              </div>
            </div>
          ) : (
            <Link to="/login" className="btn-ghost !px-4 !py-2.5 text-sm">
              <LogIn size={16} /> Log in
            </Link>
          )}
          <ThemeToggle />
        </div>
      </div>
    </aside>
  )
}

function MobileTopBar() {
  const { user, status } = useAuth()
  const handleLogout = useLogout()
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-line/5 bg-bg/70 px-4 py-3 backdrop-blur-xl lg:hidden">
      <Logo to="/" size="sm" />
      <div className="flex items-center gap-2">
        <ThemeToggle className="!h-10 !w-10" />
        {status === 'loading' ? (
          <SkeletonLine className="h-10 w-24" />
        ) : user ? (
          <>
            <span className="max-w-[5.5rem] truncate text-sm font-semibold sm:hidden">{user.fullName.split(' ')[0]}</span>
            <span className="hidden max-w-[9rem] truncate text-sm font-semibold sm:inline">{user.fullName}</span>
            <Avatar name={user.fullName} />
            <button
              onClick={handleLogout}
              className="glass grid h-10 w-10 place-items-center !rounded-2xl text-muted transition hover:text-ink"
              aria-label="Log out"
            >
              <LogOut size={17} />
            </button>
          </>
        ) : (
          <Link to="/login" className="btn-ghost !px-3 !py-2 text-sm">
            <LogIn size={16} /> Log in
          </Link>
        )}
      </div>
    </header>
  )
}

function BottomNav() {
  const items = nav.filter((n) => n.to !== '/profile')
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 px-3 lg:hidden"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <div className="glass mx-auto flex max-w-md items-center justify-around !rounded-[28px] px-2 py-2">
        {items.map(({ to, label, short, icon: Icon, primary }) => (
          <NavLink key={to} to={to} className="flex-1" aria-label={short ? `${short}: ${label}` : label}>
            {({ isActive }) =>
              primary ? (
                <span className="-mt-8 flex flex-col items-center">
                  <span
                    className="grid h-14 w-14 place-items-center rounded-2xl text-[#0A0D12] shadow-glow transition active:scale-95"
                    style={{ background: 'linear-gradient(135deg,#C6FF3D,#22E4FF)' }}
                  >
                    <Icon size={24} />
                  </span>
                  <span className={`mt-1 text-[11px] font-semibold ${isActive ? 'accent' : 'text-muted'}`}>{short}</span>
                </span>
              ) : (
                <span className="relative flex flex-col items-center gap-1 py-1.5">
                  {isActive && (
                    <motion.span layoutId="bottom-active" className="absolute -top-1 h-1 w-6 rounded-full bg-lime shadow-glow" />
                  )}
                  <Icon size={21} className={isActive ? 'accent' : 'text-muted'} />
                  <span className={`text-[11px] font-medium ${isActive ? 'text-ink' : 'text-muted'}`}>{label}</span>
                </span>
              )
            }
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export default function Layout() {
  const location = useLocation()
  return (
    <div className="relative min-h-dvh">
      <Backdrop />
      <Sidebar />
      <MobileTopBar />
      <div className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 pb-32 pt-6 sm:px-6 lg:px-10 lg:pb-10 lg:pt-10">
          <div key={location.pathname}>
            <Suspense fallback={<PageSkeleton />}>
              <Outlet />
            </Suspense>
          </div>
        </div>
        <div className="pb-24 lg:pb-0">
          <Footer compact />
        </div>
      </div>
      <BottomNav />
    </div>
  )
}

export function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-lime/[0.13] blur-[120px]" />
      <div className="absolute -right-40 top-1/3 h-[480px] w-[480px] rounded-full bg-cyan/[0.12] blur-[120px]" />
      <div className="absolute bottom-[-200px] left-1/3 h-[420px] w-[420px] rounded-full bg-[#7C5CFF]/[0.08] blur-[120px]" />
      <div className="grid-bg absolute inset-0 opacity-60" />
    </div>
  )
}
