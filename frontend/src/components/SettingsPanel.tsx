import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trash2, Download, Monitor } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { Button } from '@/components/ui/button'

export function SettingsPanel() {
  const { showSettings, setShowSettings, clearHistory } = useAppStore()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowSettings(false)
    }
    if (showSettings) {
      window.addEventListener('keydown', handler)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [showSettings, setShowSettings])

  return (
    <AnimatePresence>
      {showSettings && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowSettings(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Configuración"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
              <h2 className="text-base font-semibold text-zinc-100">Configuración</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <Monitor className="h-4 w-4" />
                  <span>Formato preferido</span>
                </div>
                <div className="flex gap-2">
                  {['mp4', 'mkv', 'webm'].map((fmt) => (
                    <button
                      key={fmt}
                      className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-800"
                    >
                      {fmt.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <Download className="h-4 w-4" />
                  <span>Historial de descargas</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { clearHistory() }}
                  className="w-full gap-2 text-xs"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Limpiar historial
                </Button>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
                <p className="text-[11px] leading-relaxed text-zinc-500">
                  Los datos se almacenan localmente en tu navegador. No se envía información a servidores externos.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
