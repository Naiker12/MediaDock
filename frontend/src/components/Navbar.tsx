import { motion } from 'framer-motion'
import { Download, History, Settings } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

export function Navbar() {
  const { setShowSettings } = useAppStore()

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800 bg-background/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-lg shadow-primary/25">
            <Download className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="text-base font-semibold text-zinc-100">
              Video<span className="text-primary">Downloader</span>
            </span>
            <p className="text-[10px] leading-tight text-zinc-500 hidden sm:block">
              Download videos from multiple platforms
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              const el = document.getElementById('history-section')
              el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
            aria-label="Historial"
          >
            <History className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
            aria-label="Configuración"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.nav>
  )
}
