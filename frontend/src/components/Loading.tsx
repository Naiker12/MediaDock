import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

export function Loading() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="mx-auto mt-8 flex items-center justify-center gap-3"
    >
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
      <span className="text-sm text-zinc-400">Analizando...</span>
    </motion.div>
  )
}
