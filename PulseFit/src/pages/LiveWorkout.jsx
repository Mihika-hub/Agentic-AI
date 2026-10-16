import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { Check, Pause, Play, SkipForward, Plus, RotateCcw, Trophy, Timer, Dumbbell, X, ListChecks, BookOpen, Flag, Loader2, CheckCircle2 } from 'lucide-react'
import PageTransition from '../components/PageTransition'
import ProgressRing from '../components/ProgressRing'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'
import { SkeletonCard, SkeletonLine } from '../components/Skeleton'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { useApi } from '../lib/useApi'

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

function fireConfetti() {
  const colors = ['#C6FF3D', '#22E4FF', '#7CFFB2', '#FFC94A', '#FF6B4A']
  const end = Date.now() + 1800
  ;(function frame() {
    confetti({ particleCount: 6, angle: 60, spread: 70, origin: { x: 0, y: 0.7 }, colors })
    confetti({ particleCount: 6, angle: 120, spread: 70, origin: { x: 1, y: 0.7 }, colors })
    if (Date.now() < end) requestAnimationFrame(frame)
  })()
  confetti({ particleCount: 160, spread: 100, startVelocity: 45, origin: { y: 0.55 }, colors })
}

function LiveSkeleton() {
  return (
    <div role="status" aria-label="Loading workout">
      <SkeletonLine className="mb-3 h-4 w-28" />
      <SkeletonLine className="mb-8 h-9 w-64" />
      <SkeletonLine className="mb-6 h-2.5 w-full" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <SkeletonCard className="flex h-96 items-center justify-center">
          <div className="mx-auto h-56 w-56 animate-pulse rounded-full border-[16px] border-ink/10" />
        </SkeletonCard>
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <SkeletonCard key={i}>
              <SkeletonLine className="h-5 w-1/2" />
              <SkeletonLine className="mt-2 h-4 w-1/3" />
              <div className="mt-4 flex gap-2">{[0, 1, 2].map((n) => <SkeletonLine key={n} className="h-14 w-20" />)}</div>
            </SkeletonCard>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function LiveWorkout() {
  const { data, error, loading, reload } = useApi('/workouts')
  const [workout, setWorkout] = useState(null)
  const [rest, setRest] = useState({ total: 0, left: 0, running: false })
  const [elapsed, setElapsed] = useState(0)
  const [complete, setComplete] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [streakNow, setStreakNow] = useState(null)
  const { toast } = useToast()
  const { refresh: refreshAuth } = useAuth()
  const celebrated = useRef(false)
  const setQueue = useRef(new Map()) // set id -> promise chain, keeps saves in order

  // Take the server copy into local state, and start the workout if it is still planned.
  useEffect(() => {
    const w = data?.workout
    if (!w) return
    setWorkout(w)
    setElapsed(w.elapsedSeconds || 0)
    celebrated.current = w.status === 'completed'
    if (w.status === 'planned' && w.exercises.length) {
      api('/workouts', { method: 'PATCH', body: { id: w.id, action: 'start' } })
        .then((res) => res.workout && setWorkout((cur) => ({ ...cur, status: res.workout.status, startedAt: res.workout.startedAt })))
        .catch((err) => toast("Couldn't start the workout", { type: 'error', description: err.message }))
    }
  }, [data, toast])

  const exercises = workout?.exercises || []
  const isFinished = workout?.status === 'completed'
  const totalSets = useMemo(() => exercises.reduce((a, e) => a + e.sets.length, 0), [exercises])
  const doneSets = useMemo(() => exercises.reduce((a, e) => a + e.sets.filter((s) => s.completed).length, 0), [exercises])
  const activeIdx = exercises.findIndex((e) => e.sets.some((s) => !s.completed))

  // Workout clock
  useEffect(() => {
    if (!workout || isFinished || complete) return
    const id = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(id)
  }, [workout, isFinished, complete])

  // Rest countdown
  useEffect(() => {
    if (!rest.running) return
    const id = setInterval(() => {
      setRest((r) => {
        if (r.left <= 1) {
          if (navigator.vibrate) navigator.vibrate([120, 60, 120])
          return { ...r, left: 0, running: false }
        }
        return { ...r, left: r.left - 1 }
      })
    }, 1000)
    return () => clearInterval(id)
  }, [rest.running])

  useEffect(() => {
    if (rest.total > 0 && rest.left === 0 && !rest.running && !complete && !isFinished) {
      toast('Rest over. Next set!', { type: 'info', description: "Let's go, you've got this." })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rest.left, rest.running])

  const finish = useCallback(async () => {
    if (!workout || celebrated.current) return
    celebrated.current = true
    setFinishing(true)
    try {
      await Promise.all([...setQueue.current.values()]) // make sure every tick is saved first
      const res = await api('/workouts', { method: 'PATCH', body: { id: workout.id, action: 'finish' } })
      setWorkout(res.workout)
      setElapsed(res.workout.elapsedSeconds || (res.workout.durationMinutes || 0) * 60)
      setStreakNow(res.streak?.current ?? null)
      setRest({ total: 0, left: 0, running: false })
      setComplete(true)
      fireConfetti()
      toast('Workout saved 🏆', { description: `${res.workout.durationMinutes} min logged to your dashboard.` })
      refreshAuth()
    } catch (err) {
      celebrated.current = false
      toast("Couldn't finish the workout", { type: 'error', description: err.message })
    } finally {
      setFinishing(false)
    }
  }, [workout, toast, refreshAuth])

  // Finishing every set completes the workout automatically.
  useEffect(() => {
    if (totalSets > 0 && doneSets === totalSets && !isFinished && !celebrated.current) finish()
  }, [doneSets, totalSets, isFinished, finish])

  const patchSet = (ei, si, completed) =>
    setWorkout((w) => ({
      ...w,
      exercises: w.exercises.map((e, i) =>
        i === ei ? { ...e, sets: e.sets.map((s, j) => (j === si ? { ...s, completed } : s)) } : e,
      ),
    }))

  const toggleSet = (ei, si) => {
    if (isFinished || finishing) return
    const set = exercises[ei].sets[si]
    const nowDone = !set.completed
    patchSet(ei, si, nowDone) // optimistic: update instantly, save in the background
    if (nowDone) {
      const restSecs = exercises[ei].restSeconds
      setRest({ total: restSecs, left: restSecs, running: true })
    }
    const prev = setQueue.current.get(set.id) || Promise.resolve()
    const next = prev
      .then(() => api('/sets', { method: 'PATCH', body: { id: set.id, completed: nowDone } }))
      .catch((err) => {
        patchSet(ei, si, !nowDone) // roll back
        toast("Couldn't save that set", { type: 'error', description: err.message })
      })
      .finally(() => {
        if (setQueue.current.get(set.id) === next) setQueue.current.delete(set.id)
      })
    setQueue.current.set(set.id, next)
  }

  const reset = async () => {
    if (!workout || isFinished) return
    try {
      await Promise.all([...setQueue.current.values()])
      const res = await api('/workouts', { method: 'PATCH', body: { id: workout.id, action: 'restart' } })
      celebrated.current = false
      setWorkout(res.workout)
      setRest({ total: 0, left: 0, running: false })
      setElapsed(0)
      setComplete(false)
      toast('Workout restarted', { type: 'info', description: 'All sets cleared. Fresh start!' })
    } catch (err) {
      toast("Couldn't restart", { type: 'error', description: err.message })
    }
  }

  // Also show the skeleton for the moment between data arriving and local state being set,
  // so the "No workout yet" message never flashes for a user who has a workout.
  if ((loading && !workout) || (!workout && data?.workout)) return <LiveSkeleton />
  if (error && !workout) return <ErrorState error={error} onRetry={reload} />
  if (!workout || !exercises.length) {
    return (
      <PageTransition>
        <EmptyState
          icon={Dumbbell}
          title="No workout yet today"
          message="No workout yet today. Pick one from the Library! Add a few exercises and they'll appear here, ready to tick off."
          action={
            <Link to="/library" className="btn-primary">
              <BookOpen size={18} /> Open the Library
            </Link>
          }
        />
      </PageTransition>
    )
  }

  const resting = rest.total > 0 && rest.left > 0
  const pct = totalSets ? Math.round((doneSets / totalSets) * 100) : 0

  return (
    <PageTransition>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] accent">
            {isFinished ? (
              <><CheckCircle2 size={13} /> Completed today</>
            ) : (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-lime" />
                </span>
                Live workout
              </>
            )}
          </p>
          <h1 className="text-3xl font-bold sm:text-4xl">{workout.name}</h1>
        </div>
        <div className="glass shrink-0 !rounded-2xl px-4 py-2 text-right">
          <p className="text-[11px] uppercase tracking-wider text-muted">{isFinished ? 'Duration' : 'Elapsed'}</p>
          <p className="font-display text-2xl font-bold tabular-nums">{fmt(elapsed)}</p>
        </div>
      </div>

      {/* Overall progress */}
      <div className="mb-6">
        <div className="mb-2 flex justify-between text-sm">
          <span className="text-muted">{doneSets} of {totalSets} sets</span>
          <span className="font-semibold accent">{pct}%</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-ink/10">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg,#C6FF3D,#22E4FF)', boxShadow: '0 0 16px rgba(198,255,61,.6)' }}
            animate={{ width: `${pct}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        {/* Rest timer */}
        <div className="glass flex flex-col items-center p-6 lg:sticky lg:top-8 lg:self-start">
          <p className="text-sm font-medium text-muted">
            {isFinished ? 'Workout finished' : resting ? 'Rest timer' : rest.total > 0 ? 'Rest complete' : 'Tick a set to start rest'}
          </p>
          <div className="relative mt-4">
            <div className={`absolute inset-6 rounded-full blur-3xl transition-colors duration-700 ${resting ? 'bg-cyan/25' : 'bg-lime/20'}`} />
            <ProgressRing
              value={rest.total ? rest.left : 0}
              max={rest.total || 1}
              size={260}
              stroke={16}
              color={resting ? '#22E4FF' : '#C6FF3D'}
              duration={0.9}
            >
              <div>
                <motion.p
                  key={rest.left}
                  initial={{ scale: 1.08, opacity: 0.6 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="font-display text-6xl font-bold tabular-nums"
                >
                  {fmt(rest.left)}
                </motion.p>
                <p className="mt-1 text-sm text-muted">{isFinished ? 'Nice work!' : resting ? (rest.running ? 'Breathe. Recover.' : 'Paused') : 'Ready'}</p>
              </div>
            </ProgressRing>
          </div>
          <div className="mt-6 flex w-full max-w-xs items-center justify-center gap-3">
            <button
              onClick={() => setRest((r) => ({ ...r, left: r.left + 15, total: Math.max(r.total, r.left + 15) }))}
              disabled={!resting}
              className="btn-ghost !px-4 disabled:opacity-40"
              aria-label="Add 15s of rest"
            >
              <Plus size={16} /> 15s
            </button>
            <button
              onClick={() => setRest((r) => ({ ...r, running: !r.running }))}
              disabled={!resting}
              className="btn-primary !h-14 !w-14 !rounded-full !p-0"
              aria-label={rest.running ? 'Pause rest' : 'Resume rest'}
            >
              {rest.running ? <Pause size={22} /> : <Play size={22} className="ml-0.5" />}
            </button>
            <button
              onClick={() => setRest((r) => ({ ...r, left: 0, running: false }))}
              disabled={!resting}
              className="btn-ghost !px-4 disabled:opacity-40"
              aria-label="Skip rest"
            >
              Skip <SkipForward size={16} />
            </button>
          </div>
          {!isFinished && (
            <div className="mt-5 flex items-center gap-5">
              <button onClick={reset} className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-ink">
                <RotateCcw size={14} /> Restart workout
              </button>
              {doneSets > 0 && doneSets < totalSets && (
                <button
                  onClick={finish}
                  disabled={finishing}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold accent transition hover:opacity-80 disabled:opacity-50"
                >
                  {finishing ? <Loader2 size={14} className="animate-spin" /> : <Flag size={14} />} Finish workout
                </button>
              )}
            </div>
          )}
          {isFinished && (
            <Link to="/dashboard" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold accent">
              See your dashboard
            </Link>
          )}
        </div>

        {/* Exercises */}
        <div className="space-y-3">
          {exercises.map((ex, ei) => {
            const sets = ex.sets
            const finished = sets.every((s) => s.completed)
            const active = ei === activeIdx && !isFinished
            return (
              <motion.div
                key={ex.id}
                layout
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: ei * 0.06 }}
                className={`glass p-5 transition-shadow ${active ? 'shadow-glow !border-lime/40' : ''} ${finished ? 'opacity-70' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      {active && <span className="chip bg-lime/15 accent !px-2 !py-0.5 text-[10px] uppercase tracking-wider">Up next</span>}
                      {finished && <span className="chip bg-ink/5 !px-2 !py-0.5 text-[10px] uppercase tracking-wider text-muted"><Check size={10} /> Done</span>}
                    </div>
                    <h3 className="mt-1 text-lg font-semibold">{ex.name}</h3>
                    <p className="text-sm text-muted">{ex.reps} reps · {ex.muscleGroup} · {ex.restSeconds}s rest</p>
                  </div>
                  <span className="font-display text-sm font-semibold text-muted">{sets.filter((s) => s.completed).length}/{sets.length}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {sets.map((s, si) => {
                    const isDone = s.completed
                    return (
                      <motion.button
                        key={s.id}
                        whileTap={isFinished ? undefined : { scale: 0.9 }}
                        onClick={() => toggleSet(ei, si)}
                        disabled={isFinished}
                        aria-pressed={isDone}
                        aria-label={`Set ${s.setNumber} ${isDone ? 'completed' : 'not completed'}`}
                        className={`relative flex h-14 min-w-[4.5rem] flex-1 items-center justify-center gap-1.5 rounded-2xl border font-display font-semibold transition-colors disabled:cursor-default sm:flex-none ${
                          isDone ? 'border-transparent text-[#0A0D12]' : 'border-line/10 bg-ink/[0.03] hover:border-lime/50'
                        }`}
                        style={isDone ? { background: 'linear-gradient(135deg,#C6FF3D,#7CFFB2)' } : undefined}
                      >
                        <AnimatePresence mode="wait" initial={false}>
                          {isDone ? (
                            <motion.span key="c" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}>
                              <Check size={20} strokeWidth={3} />
                            </motion.span>
                          ) : (
                            <motion.span key="n" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                              Set {s.setNumber}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    )
                  })}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Celebration */}
      <AnimatePresence>
        {complete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] grid place-items-center bg-bg/70 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.8, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.15 }}
              className="glass relative w-full max-w-md overflow-hidden p-8 text-center"
            >
              <button onClick={() => setComplete(false)} className="absolute right-4 top-4 text-muted hover:text-ink" aria-label="Close">
                <X size={20} />
              </button>
              <div className="pointer-events-none absolute -top-24 left-1/2 h-60 w-60 -translate-x-1/2 rounded-full bg-lime/30 blur-3xl" />
              <motion.div
                initial={{ rotate: -20, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', delay: 0.35 }}
                className="relative mx-auto grid h-20 w-20 place-items-center rounded-3xl text-[#0A0D12] shadow-glow"
                style={{ background: 'linear-gradient(135deg,#C6FF3D,#22E4FF)' }}
              >
                <Trophy size={38} />
              </motion.div>
              <h2 className="relative mt-5 text-3xl font-bold">Workout complete!</h2>
              <p className="relative mt-2 text-muted">
                You crushed {workout.name}.
                {streakNow ? ` Your streak is now ${streakNow} ${streakNow === 1 ? 'day' : 'days'}. 🔥` : ''}
              </p>
              <div className="relative mt-6 grid grid-cols-3 gap-2">
                {[
                  { icon: Timer, label: 'Minutes', value: workout.durationMinutes ?? Math.round(elapsed / 60) },
                  { icon: Dumbbell, label: 'Sets', value: doneSets },
                  { icon: ListChecks, label: 'Exercises', value: exercises.length },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl bg-ink/5 p-3">
                    <s.icon size={16} className="mx-auto accent" />
                    <p className="mt-1 font-display text-xl font-bold">{s.value}</p>
                    <p className="text-xs text-muted">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="relative mt-6 flex flex-col gap-2 sm:flex-row">
                <Link to="/dashboard" className="btn-primary flex-1">See dashboard</Link>
                <button onClick={fireConfetti} className="btn-ghost flex-1">Celebrate again 🎉</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  )
}
