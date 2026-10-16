import { motion } from 'framer-motion'

export default function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass flex flex-col items-center px-6 py-12 text-center"
    >
      <div className="relative mb-5">
        <div className="absolute inset-0 rounded-full bg-lime/30 blur-2xl" />
        <div className="relative grid h-16 w-16 place-items-center rounded-2xl border border-lime/30 bg-lime/10 text-lime">
          {Icon && <Icon size={28} />}
        </div>
      </div>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-2 max-w-sm text-muted">{message}</p>
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  )
}
