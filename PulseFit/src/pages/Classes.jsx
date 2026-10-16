import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Clock, MapPin, UserRound, CalendarX, Check, Loader2, Users } from 'lucide-react'
import PageTransition, { PageHeader } from '../components/PageTransition'
import EmptyState from '../components/EmptyState'
import { classes as initialClasses, classTypes, weekDays } from '../data/mockData'
import { useToast } from '../context/ToastContext'

const types = ['All', ...Object.keys(classTypes)]
const todayIdx = (new Date().getDay() + 6) % 7

function dateFor(dayIdx) {
  const now = new Date()
  const d = new Date(now)
  d.setDate(now.getDate() - todayIdx + dayIdx)
  return d.getDate()
}

export default function Classes() {
  const [day, setDay] = useState(weekDays[todayIdx])
  const [type, setType] = useState('All')
  const [list, setList] = useState(initialClasses)
  const [booked, setBooked] = useState(() => new Set())
  const [pending, setPending] = useState(null)
  const { toast } = useToast()

  const visible = useMemo(() => list.filter((c) => c.day === day && (type === 'All' || c.type === type)), [list, day, type])
  const countFor = (d) => list.filter((c) => c.day === d).length

  const book = (c) => {
    if (booked.has(c.id)) {
      setBooked((b) => { const n = new Set(b); n.delete(c.id); return n })
      setList((l) => l.map((x) => (x.id === c.id ? { ...x, spots: x.spots + 1 } : x)))
      toast('Booking cancelled', { type: 'info', description: `Your spot in ${c.name} has been released.` })
      return
    }
    if (c.spots === 0) {
      toast("This class is full, but you're on the waitlist", {
        type: 'error',
        description: "We'll ping you the moment a spot opens. Meanwhile, try another time slot!",
      })
      return
    }
    setPending(c.id)
    setTimeout(() => {
      setPending(null)
      setBooked((b) => new Set(b).add(c.id))
      setList((l) => l.map((x) => (x.id === c.id ? { ...x, spots: x.spots - 1 } : x)))
      toast("You're booked! 🎉", { description: `${c.name} · ${c.day} at ${c.time} with ${c.coach}` })
    }, 700)
  }

  return (
    <PageTransition>
      <PageHeader
        eyebrow="Class booking"
        title="Sweat with the crew"
        subtitle="Book Yoga, HIIT, Spin and Boxing sessions led by our top coaches."
        action={
          booked.size > 0 && (
            <span className="chip bg-lime/15 !py-2 accent"><Check size={14} /> {booked.size} booked this week</span>
          )
        }
      />

      {/* Day picker */}
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {weekDays.map((d, i) => {
          const active = d === day
          return (
            <button
              key={d}
              onClick={() => setDay(d)}
              className={`relative flex min-w-[64px] flex-1 shrink-0 flex-col items-center rounded-2xl px-3 py-3 transition ${active ? 'text-[#0A0D12]' : 'glass !rounded-2xl hover:-translate-y-0.5'}`}
            >
              {active && (
                <motion.span
                  layoutId="day-pill"
                  className="absolute inset-0 rounded-2xl shadow-glow"
                  style={{ background: 'linear-gradient(160deg,#C6FF3D,#22E4FF)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <span className={`relative text-xs font-medium ${active ? '' : 'text-muted'}`}>{d}</span>
              <span className="relative font-display text-xl font-bold">{dateFor(i)}</span>
              <span className={`relative mt-1 h-1.5 w-1.5 rounded-full ${countFor(d) ? (active ? 'bg-[#0A0D12]' : 'bg-lime') : 'bg-transparent'}`} />
            </button>
          )
        })}
      </div>

      {/* Type filter */}
      <div className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {types.map((t) => {
          const active = t === type
          const color = classTypes[t]?.color || '#C6FF3D'
          return (
            <button
              key={t}
              onClick={() => setType(t)}
              className="shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition"
              style={active ? { background: `${color}22`, borderColor: `${color}88`, color } : { borderColor: 'var(--glass-border)' }}
            >
              <span className={active ? '' : 'text-muted'}>{t}</span>
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={day + type} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
          {visible.length === 0 ? (
            <EmptyState
              icon={CalendarX}
              title={type === 'All' ? 'Rest day: no classes' : `No ${type} on ${day}`}
              message={type === 'All' ? 'The studio is quiet today. Recovery is training too. Pick another day to book.' : 'Try another day or check out a different class type.'}
              action={type !== 'All' && <button className="btn-ghost" onClick={() => setType('All')}>Show all classes</button>}
            />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {visible.map((c, i) => {
                const color = classTypes[c.type].color
                const isBooked = booked.has(c.id)
                const full = c.spots === 0 && !isBooked
                const fillPct = ((c.capacity - c.spots) / c.capacity) * 100
                const low = c.spots > 0 && c.spots <= 3
                return (
                  <motion.article
                    key={c.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    whileHover={{ y: -4 }}
                    className={`glass relative overflow-hidden p-5 ${isBooked ? '!border-lime/50' : ''}`}
                  >
                    <div className="absolute inset-y-0 left-0 w-1" style={{ background: color, boxShadow: `0 0 16px ${color}` }} />
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="chip" style={{ background: `${color}1f`, color }}>{c.type}</span>
                        <h3 className="mt-2 truncate text-lg font-semibold">{c.name}</h3>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-2xl font-bold">{c.time}</p>
                        <p className="text-xs text-muted">{c.duration} min</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                      <span className="flex items-center gap-1.5"><UserRound size={14} /> {c.coach}</span>
                      <span className="flex items-center gap-1.5"><MapPin size={14} /> {c.room}</span>
                      <span className="flex items-center gap-1.5"><Clock size={14} /> {c.duration} min</span>
                    </div>
                    <div className="mt-4">
                      <div className="mb-1.5 flex justify-between text-xs">
                        <span className={`flex items-center gap-1 font-semibold ${full ? 'text-[#FF6B4A]' : low ? 'text-[#FFC94A]' : 'text-muted'}`}>
                          <Users size={12} /> {full ? 'Class full' : `${c.spots} spot${c.spots === 1 ? '' : 's'} left`}
                        </span>
                        <span className="text-muted">{c.capacity - c.spots}/{c.capacity}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-ink/10">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${fillPct}%` }}
                          transition={{ duration: 0.9, delay: 0.2 + i * 0.05 }}
                        />
                      </div>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => book(c)}
                      disabled={pending === c.id}
                      className={`mt-4 w-full ${isBooked ? 'btn-ghost !border-lime/40' : full ? 'btn-ghost opacity-70' : 'btn-primary !py-3'}`}
                    >
                      {pending === c.id ? (
                        <><Loader2 size={16} className="animate-spin" /> Booking…</>
                      ) : isBooked ? (
                        <><Check size={16} className="accent" /> Booked · tap to cancel</>
                      ) : full ? (
                        'Join waitlist'
                      ) : (
                        'Book spot'
                      )}
                    </motion.button>
                  </motion.article>
                )
              })}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </PageTransition>
  )
}
