import { DatabaseZap, RefreshCw, WifiOff } from 'lucide-react'
import EmptyState from './EmptyState'

// Friendly full-card error with a retry button. Explains clearly when the database is down.
export default function ErrorState({ error, onRetry }) {
  const dbDown = error?.code === 'DB_UNAVAILABLE'
  const offline = error?.code === 'NETWORK'
  return (
    <EmptyState
      icon={dbDown ? DatabaseZap : WifiOff}
      title={dbDown ? "Can't reach the database" : offline ? "Can't reach the server" : 'Something went wrong'}
      message={
        dbDown
          ? 'PulseFit could not connect to its database. Check your internet connection and that DATABASE_URL in .env is correct, then try again.'
          : offline
            ? 'The PulseFit API is not responding. Make sure "npm run dev" is running, then try again.'
            : error?.message || 'Please try again in a moment.'
      }
      action={
        onRetry && (
          <button className="btn-ghost" onClick={onRetry}>
            <RefreshCw size={16} /> Try again
          </button>
        )
      }
    />
  )
}
