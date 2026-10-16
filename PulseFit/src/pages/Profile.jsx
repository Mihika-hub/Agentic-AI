import { motion } from 'framer-motion'
import {
  Award, CalendarCheck, Crown, Dumbbell, Flame, Lock, Medal, Settings, Share2, Sparkles, Sunrise, Trophy, Users, Wind,
} from 'lucide-react'

const Icons = { Award, CalendarCheck, Dumbbell, Flame, Medal, Sunrise, Trophy, Users, Wind }
import PageTransition from '../components/PageTransition'
import GlassCard from '../components/GlassCard'
import AnimatedCounter from '../components/AnimatedCounter'
import { achievements, user } from '../data/mockData'
import { useToast } from '../context/ToastContext'

export default function Profile() {
  const { toast } = useToast()
  const xpPct = (user.xp / user.xpNext) * 100
  const unlocked = achievements.filter((a) => a.unlocked).length

  const stats = [
    { label: 'Workouts', value: user.stats.workouts },
    { label: 'Hours', value: user.stats.hours },
    { label: 'PRs', value: user.stats.prs },
    { label: 'Classes', value: user.stats.classes },
  ]

  const share = async () => {
    try {
      await navigator.clipboard.writeText(`Join me on PulseFit! ${user.handle}`)
      toast('Profile link copied', { description: 'Share it with your gym buddies.' })
    } catch {
      toast("Couldn't copy the link", { type: 'error', description: 'Your browser blocked clipboard access. Try again.' })
    }
  }

  return (
    <PageTransition>
      <GlassCard hover={false} className="mb-4 !p-0">
        <div className="relative h-32 sm:h-40" style={{ background: 'linear-gradient(120deg,#C6FF3D 0%,#7CFFB2 40%,#22E4FF 100%)' }}>
          <div className="grid-bg absolute inset-0 opacity-40 mix-blend-overlay" />
          <div className="absolute right-4 top-4 flex gap-2">
            <button onClick={share} className="grid h-10 w-10 place-items-center rounded-xl bg-[#0A0D12]/70 text-white backdrop-blur transition hover:bg-[#0A0D12]" aria-label="Share profile">
              <Share2 size={17} />
            </button>
            <button
              onClick={() => toast('Settings are coming soon', { type: 'info', description: 'We are polishing them up for you.' })}
              className="grid h-10 w-10 place-items-center rounded-xl bg-[#0A0D12]/70 text-white backdrop-blur transition hover:bg-[#0A0D12]"
              aria-label="Settings"
            >
              <Settings size={17} />
            </button>
          </div>
        </div>
        <div className="px-5 pb-6 sm:px-8">
          <div className="-mt-14 flex flex-col gap-4 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', delay: 0.15 }} className="relative">
                <div className="rounded-[28px] p-1" style={{ background: 'linear-gradient(135deg,#C6FF3D,#22E4FF)' }}>
                  <img src={user.avatar} alt={user.name} className="h-24 w-24 rounded-[24px] border-4 border-bg object-cover sm:h-28 sm:w-28" />
                </div>
                <span className="absolute -bottom-2 -right-2 grid h-9 w-9 place-items-center rounded-xl bg-[#0A0D12] font-display text-sm font-bold text-lime ring-4 ring-bg">
                  {user.level}
                </span>
              </motion.div>
              <div className="pb-1">
                <h1 className="text-2xl font-bold sm:text-3xl">{user.name}</h1>
                <p className="text-muted">{user.handle} · Member since {user.memberSince}</p>
              </div>
            </div>
            <span className="chip self-start bg-gradient-to-r from-[#FFC94A]/25 to-[#FF6B4A]/20 !px-4 !py-2 text-sm text-[#E8A400] dark:text-[#FFC94A] sm:self-end">
              <Crown size={15} /> {user.membership}
            </span>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex justify-between text-sm">
              <span className="font-semibold">Level {user.level}</span>
              <span className="text-muted">{user.xp.toLocaleString()} / {user.xpNext.toLocaleString()} XP</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-ink/10">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg,#C6FF3D,#22E4FF)', boxShadow: '0 0 16px rgba(198,255,61,.6)' }}
                initial={{ width: 0 }}
                animate={{ width: `${xpPct}%` }}
                transition={{ duration: 1.4, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <p className="mt-2 text-xs text-muted">{(user.xpNext - user.xp).toLocaleString()} XP to Level {user.level + 1}</p>
          </div>

          <div className="mt-6 grid grid-cols-4 gap-2">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl bg-ink/[0.04] p-3 text-center">
                <p className="font-display text-xl font-bold sm:text-2xl"><AnimatedCounter value={s.value} duration={1.4} /></p>
                <p className="text-xs text-muted">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xl font-semibold"><Sparkles size={18} className="accent" /> Achievements</h2>
        <span className="text-sm text-muted">{unlocked} of {achievements.length} unlocked</span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {achievements.map((a, i) => {
          const Icon = Icons[a.icon] || Icons.Award
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.06, type: 'spring', stiffness: 260, damping: 22 }}
              whileHover={{ y: -5 }}
              className={`glass relative flex flex-col items-center overflow-hidden p-5 text-center ${a.unlocked ? '' : 'opacity-80'}`}
            >
              {a.unlocked && <div className="pointer-events-none absolute -top-10 h-24 w-24 rounded-full blur-2xl" style={{ background: `${a.color}55` }} />}
              <div
                className="relative grid h-16 w-16 place-items-center rounded-2xl"
                style={
                  a.unlocked
                    ? { background: `linear-gradient(135deg, ${a.color}, ${a.color}99)`, color: '#0A0D12', boxShadow: `0 10px 30px -10px ${a.color}` }
                    : { background: 'rgb(var(--ink) / .06)', color: 'rgb(var(--muted))' }
                }
              >
                <Icon size={28} />
                {!a.unlocked && (
                  <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-lg bg-surface ring-2 ring-bg">
                    <Lock size={12} />
                  </span>
                )}
              </div>
              <p className="relative mt-3 font-display font-semibold">{a.name}</p>
              <p className="relative text-xs text-muted">{a.desc}</p>
              {!a.unlocked && (
                <div className="relative mt-3 w-full">
                  <div className="h-1.5 overflow-hidden rounded-full bg-ink/10">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: a.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${a.progress}%` }}
                      transition={{ duration: 1, delay: 0.4 + i * 0.05 }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-muted">{a.progress}%</p>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </PageTransition>
  )
}
