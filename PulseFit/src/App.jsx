import { Suspense, lazy, useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import Landing from './pages/Landing'

// App pages load on demand, so the landing page does not download the charts library.
const pageLoaders = {
  '/dashboard': () => import('./pages/Dashboard'),
  '/library': () => import('./pages/Library'),
  '/workout': () => import('./pages/LiveWorkout'),
  '/progress': () => import('./pages/Progress'),
  '/classes': () => import('./pages/Classes'),
  '/profile': () => import('./pages/Profile'),
}
const Dashboard = lazy(pageLoaders['/dashboard'])
const Library = lazy(pageLoaders['/library'])
const LiveWorkout = lazy(pageLoaders['/workout'])
const Progress = lazy(pageLoaders['/progress'])
const Classes = lazy(pageLoaders['/classes'])
const Profile = lazy(pageLoaders['/profile'])
const NotFound = lazy(() => import('./pages/NotFound'))

// Start downloading the page being opened right away, in parallel with the login check.
if (typeof window !== 'undefined') pageLoaders[window.location.pathname]?.()
import { Login, Signup } from './pages/AuthPages'
import ProtectedRoute from './components/ProtectedRoute'

const titles = {
  '/': 'PulseFit · Train smarter. Get stronger.',
  '/dashboard': 'Dashboard · PulseFit',
  '/library': 'Workout Library · PulseFit',
  '/workout': 'Live Workout · PulseFit',
  '/progress': 'Progress · PulseFit',
  '/classes': 'Book a Class · PulseFit',
  '/profile': 'Profile · PulseFit',
  '/login': 'Log in · PulseFit',
  '/signup': 'Sign up · PulseFit',
}

function RouteEffects() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0 })
    document.title = titles[pathname] || 'PulseFit'
  }, [pathname])
  return null
}

export default function App() {
  return (
    <>
      <RouteEffects />
      <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route element={<Layout />}>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/library" element={<Library />} />
            <Route path="/workout" element={<LiveWorkout />} />
          </Route>
          <Route path="/progress" element={<Progress />} />
          <Route path="/classes" element={<Classes />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      </Suspense>
    </>
  )
}
