import { motion } from 'framer-motion'

interface LoadingProps {
  label?: string
  detail?: string
  compact?: boolean
}

export function Loading({ label = 'Analizando el video', detail = 'Estamos buscando los formatos disponibles', compact = false }: LoadingProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={compact ? 'flex items-center gap-2 [&_.loader-orbit]:h-4 [&_.loader-orbit]:w-4 [&_.loader-orbit_i]:h-1.5 [&_.loader-orbit_i]:w-1.5' : 'loading-panel mx-auto mt-6 max-w-xl'}
    >
      <span className="loader-orbit" aria-hidden="true"><i /><i /><i /></span>
      {!compact && (
        <div>
          <p className="text-sm font-semibold text-zinc-100">{label}</p>
          <p className="mt-0.5 text-xs text-zinc-500">{detail}</p>
          <div className="loading-track mt-3"><span /></div>
        </div>
      )}
      {compact && label && <span className="text-sm text-zinc-300">{label}</span>}
    </motion.div>
  )
}
