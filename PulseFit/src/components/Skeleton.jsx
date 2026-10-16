// Glass-style loading placeholders.

export function SkeletonLine({ className = '' }) {
  return <div className={`animate-pulse rounded-xl bg-ink/10 ${className}`} />
}

export function SkeletonCard({ className = '', lines = 3, children }) {
  return (
    <div className={`glass relative overflow-hidden p-5 sm:p-6 ${className}`} aria-hidden="true">
      <div className="skeleton-sheen pointer-events-none absolute inset-0" />
      {children || (
        <div className="space-y-3">
          <SkeletonLine className="h-4 w-1/3" />
          {Array.from({ length: lines }).map((_, i) => (
            <SkeletonLine key={i} className={`h-4 ${i % 2 ? 'w-2/3' : 'w-full'}`} />
          ))}
        </div>
      )}
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-3" role="status" aria-label="Loading">
      <SkeletonCard className="h-64 lg:col-span-2" lines={5} />
      <SkeletonCard className="h-64" lines={4} />
      <SkeletonCard className="h-52" lines={3} />
      <SkeletonCard className="h-52 lg:col-span-2" lines={3} />
    </div>
  )
}
