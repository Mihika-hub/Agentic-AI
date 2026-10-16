import { Component } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('PulseFit crashed:', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="grid min-h-dvh place-items-center bg-bg p-6 text-ink">
        <div className="glass max-w-md p-8 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#FF6B4A]/15 text-[#FF6B4A]">
            <AlertTriangle size={28} />
          </div>
          <h1 className="mt-5 text-2xl font-bold">Oops, we pulled a muscle.</h1>
          <p className="mt-2 text-muted">Something went wrong on our side. Your progress is safe. Give it another rep.</p>
          <button onClick={() => window.location.reload()} className="btn-primary mt-6">
            <RotateCcw size={16} /> Reload PulseFit
          </button>
        </div>
      </div>
    )
  }
}
