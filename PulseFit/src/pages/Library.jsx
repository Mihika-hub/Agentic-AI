import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, Dumbbell, Timer, Plus, Check, SearchX, Repeat, Clock, Play, Loader2 } from 'lucide-react'
import PageTransition, { PageHeader } from '../components/PageTransition'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'
import { SkeletonCard, SkeletonLine } from '../components/Skeleton'
import { useToast } from '../context/ToastContext'
import { useTheme } from '../context/ThemeContext'
import { api } from '../lib/api'
import { useApi } from '../lib/useApi'

// lightText: darker shade of the same colour so the label stays readable on the light theme.
const difficultyMeta = {
  Beginner: { level: 1, color: '#7CFFB2', lightText: '#0E7A45' },
  Intermediate: { level: 2, color: '#FFC94A', lightText: '#8A5A00' },
  Advanced: { level: 3, color: '#FF6B4A', lightText: '#C2410C' },
}

function DifficultyBadge({ difficulty }) {
  const { level, color, lightText } = difficultyMeta[difficulty] || difficultyMeta.Beginner
  const { theme } = useTheme()
  return (
    <span className="inline-flex items-center gap-2 text-xs font-semibold" style={{ color: theme === 'dark' ? color : lightText }}>
      <span className="flex items-end gap-0.5">
        {[1, 2, 3].map((n) => (
          <span key={n} className="w-1.5 rounded-sm" style={{ height: 4 + n * 3, background: n <= level ? color : 'rgb(var(--muted) / .3)' }} />
        ))}
      </span>
      {difficulty}
    </span>
  )
}

function LibrarySkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" role="status" aria-label="Loading exercises">
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonCard key={i}>
          <div className="flex justify-between"><SkeletonLine className="h-6 w-16 !rounded-full" /><SkeletonLine className="h-4 w-20" /></div>
          <SkeletonLine className="mt-4 h-5 w-2/3" />
          <SkeletonLine className="mt-2 h-4 w-full" />
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[0, 1, 2].map((n) => <SkeletonLine key={n} className="h-14" />)}
          </div>
          <SkeletonLine className="mt-4 h-10 w-full" />
        </SkeletonCard>
      ))}
    </div>
  )
}

const openWorkoutIds = (workout) =>
  new Set(workout && workout.status !== 'completed' ? workout.exercises.map((e) => e.exerciseId) : [])

export default function Library() {
  const exercisesReq = useApi('/exercises')
  const workoutReq = useApi('/workouts')
  const [group, setGroup] = useState('All')
  const [query, setQuery] = useState('')
  const [added, setAdded] = useState(() => new Set())
  const [pending, setPending] = useState(() => new Set())
  const { toast } = useToast()

  useEffect(() => {
    if (workoutReq.data) setAdded(openWorkoutIds(workoutReq.data.workout))
  }, [workoutReq.data])

  const exercises = exercisesReq.data?.exercises || []
  const muscleGroups = ['All', ...(exercisesReq.data?.muscleGroups || [])]

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return exercises.filter(
      (e) =>
        (group === 'All' || e.muscleGroup === group) &&
        (!q || e.name.toLowerCase().includes(q) || e.description.toLowerCase().includes(q)),
    )
  }, [exercises, group, query])

  const toggleAdd = async (ex) => {
    if (pending.has(ex.id)) return
    const wasAdded = added.has(ex.id)
    const flip = (on) =>
      setAdded((prev) => {
        const next = new Set(prev)
        on ? next.add(ex.id) : next.delete(ex.id)
        return next
      })
    flip(!wasAdded) // optimistic
    setPending((p) => new Set(p).add(ex.id))
    try {
      if (wasAdded) await api(`/workouts?exerciseId=${ex.id}`, { method: 'DELETE' })
      else await api('/workouts', { method: 'POST', body: { exerciseId: ex.id } })
      if (wasAdded) toast('Removed from today', { type: 'info', description: `${ex.name} was taken off today's workout.` })
      else toast("Added to today's workout 💪", { description: `${ex.name} · ${ex.sets} × ${ex.reps}` })
    } catch (err) {
      flip(wasAdded) // roll back
      toast(wasAdded ? "Couldn't remove exercise" : "Couldn't add exercise", { type: 'error', description: err.message })
    } finally {
      setPending((p) => {
        const next = new Set(p)
        next.delete(ex.id)
        return next
      })
    }
  }

  const loading = exercisesReq.loading && !exercisesReq.data
  const error = exercisesReq.error && !exercisesReq.data ? exercisesReq.error : null

  return (
    <PageTransition>
      <PageHeader
        eyebrow="Workout Library"
        title="Find your next move"
        subtitle={
          loading
            ? 'Loading coach-approved exercises…'
            : `${exercises.length} coach-approved exercises. Filter by muscle group and build today's workout.`
        }
        action={
          added.size > 0 && (
            <Link to="/workout" className="btn-primary shrink-0">
              <Play size={16} className="fill-current" /> Start today's workout ({added.size})
            </Link>
          )
        }
      />

      <div className="glass mb-4 flex items-center gap-3 !rounded-2xl px-4 py-3">
        <Search size={18} className="text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search exercises…"
          className="w-full bg-transparent outline-none placeholder:text-muted"
          aria-label="Search exercises"
        />
      </div>

      <div className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {(muscleGroups.length > 1 ? muscleGroups : ['All', 'Chest', 'Back', 'Legs', 'Arms', 'Core', 'Cardio']).map((g) => {
          const active = g === group
          return (
            <button
              key={g}
              onClick={() => setGroup(g)}
              className={`relative shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition ${active ? 'text-[#0A0D12]' : 'glass !rounded-full text-muted hover:text-ink'}`}
            >
              {active && (
                <motion.span
                  layoutId="group-pill"
                  className="absolute inset-0 rounded-full"
                  style={{ background: 'linear-gradient(100deg,#C6FF3D,#22E4FF)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative">{g}</span>
            </button>
          )
        })}
      </div>

      {loading ? (
        <LibrarySkeleton />
      ) : error ? (
        <ErrorState error={error} onRetry={() => { exercisesReq.reload(); workoutReq.reload() }} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title={exercises.length ? 'No exercises match' : 'The library is empty'}
          message={
            exercises.length
              ? `We couldn't find anything for "${query}"${group !== 'All' ? ` in ${group}` : ''}. Try a different word or muscle group.`
              : 'No exercises have been added yet. Run "npm run db:setup" to load the sample library.'
          }
          action={
            exercises.length > 0 && (
              <button className="btn-ghost" onClick={() => { setQuery(''); setGroup('All') }}>
                Clear filters
              </button>
            )
          }
        />
      ) : (
        <motion.div layout className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((ex, i) => {
              const isAdded = added.has(ex.id)
              const isPending = pending.has(ex.id)
              const minutes = Math.max(1, Math.round((ex.sets * (40 + ex.restSeconds)) / 60))
              return (
                <motion.article
                  key={ex.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0, transition: { delay: Math.min(i * 0.03, 0.3) } }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -5 }}
                  className="glass group relative flex flex-col overflow-hidden p-5"
                >
                  <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-lime/0 blur-2xl transition duration-500 group-hover:bg-lime/25" />
                  <div className="flex items-start justify-between gap-3">
                    <span className="chip bg-ink/5 text-muted">{ex.muscleGroup}</span>
                    <DifficultyBadge difficulty={ex.difficulty} />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{ex.name}</h3>
                  <p className="line-clamp-2 text-sm text-muted">{ex.description}</p>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-ink/[0.04] py-2.5">
                      <p className="font-display text-xl font-bold">{ex.sets}</p>
                      <p className="flex items-center justify-center gap-1 text-[11px] text-muted"><Repeat size={10} /> sets</p>
                    </div>
                    <div className="rounded-xl bg-ink/[0.04] py-2.5">
                      <p className="font-display text-xl font-bold">{ex.reps}</p>
                      <p className="flex items-center justify-center gap-1 text-[11px] text-muted"><Dumbbell size={10} /> reps</p>
                    </div>
                    <div className="rounded-xl bg-ink/[0.04] py-2.5">
                      <p className="font-display text-xl font-bold">{ex.restSeconds}s</p>
                      <p className="flex items-center justify-center gap-1 text-[11px] text-muted"><Timer size={10} /> rest</p>
                    </div>
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                    <span className="flex shrink-0 items-center gap-1 text-sm text-muted"><Clock size={14} className="text-[#22E4FF]" /> ~{minutes} min</span>
                    <motion.button
                      whileTap={{ scale: 0.92 }}
                      onClick={() => toggleAdd(ex)}
                      disabled={isPending}
                      aria-pressed={isAdded}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition disabled:cursor-wait ${
                        isAdded ? 'bg-lime text-[#0A0D12]' : 'bg-ink/5 hover:bg-lime/20'
                      }`}
                    >
                      {isPending ? <Loader2 size={15} className="animate-spin" /> : isAdded ? <Check size={15} /> : <Plus size={15} />}
                      {isAdded ? "In today's workout" : "Add to today's workout"}
                    </motion.button>
                  </div>
                </motion.article>
              )
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </PageTransition>
  )
}
