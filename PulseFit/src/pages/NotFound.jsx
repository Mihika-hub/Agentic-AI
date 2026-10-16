import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import PageTransition from '../components/PageTransition'
import EmptyState from '../components/EmptyState'

export default function NotFound() {
  return (
    <PageTransition className="py-10">
      <EmptyState
        icon={Compass}
        title="This page skipped leg day"
        message="We couldn't find what you were looking for. Let's get you back to training."
        action={<Link to="/dashboard" className="btn-primary">Back to dashboard</Link>}
      />
    </PageTransition>
  )
}
