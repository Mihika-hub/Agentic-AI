import { useEffect, useRef } from 'react'
import { animate, useInView } from 'framer-motion'
import { safeCount } from '../lib/ring'

function format(n, compact) {
  if (compact && n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (compact && n >= 10_000) return `${(n / 1000).toFixed(1)}K`
  return Math.round(n).toLocaleString()
}

// Counts up from 0 when scrolled into view. The number is written straight to the DOM
// on each frame (no React re-render per frame), which keeps the page fast on phones.
export default function AnimatedCounter({ value, duration = 2, suffix = '', prefix = '', compact = false, className = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const target = safeCount(value)

  useEffect(() => {
    if (!inView || !ref.current) return
    const node = ref.current
    const controls = animate(0, target, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        node.textContent = `${prefix}${format(v, compact)}${suffix}`
      },
    })
    return () => controls.stop()
  }, [inView, target, duration, prefix, suffix, compact])

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {prefix}
      {format(0, compact)}
      {suffix}
    </span>
  )
}
