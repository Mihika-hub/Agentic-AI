import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { PageSkeleton } from './Skeleton'
import ErrorState from './ErrorState'

export default function ProtectedRoute() {
  const { user, status, error, refresh } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <PageSkeleton />
  if (status === 'error') return <ErrorState error={error} onRetry={refresh} />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}
