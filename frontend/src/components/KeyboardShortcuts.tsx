import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Keyboard, X } from 'lucide-react'

const SHORTCUTS = [
  { keys: ['Ctrl', 'V'], desc: 'Pegar URL y analizar autom\u00e1ticamente' },
  { keys: ['Enter'], desc: 'Analizar URL' },
  { keys: ['Esc'], desc: 'Cerrar modal / Cancelar selecci\u00f3n' },
  { keys: ['?'], desc: 'Mostrar este mensaje de ayuda' },
]

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
      if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-30 flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/80 text-zinc-500 shadow-lg backdrop-blur-sm transition-all hover:border-zinc-700 hover:text-zinc-300"
        aria-label="Atajos de teclado"
      >
        <Keyboard className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label="Atajos de teclado"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800">
                    <Keyboard className="h-4 w-4 text-zinc-400" />
                  </div>
                  <h2 className="text-sm font-semibold text-zinc-100">Atajos de teclado</h2>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-5">
                <div className="space-y-3">
                  {SHORTCUTS.map((shortcut) => (
                    <div key={shortcut.desc} className="flex items-center justify-between">
                      <span className="text-sm text-zinc-400">{shortcut.desc}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, i) => (
                          <span key={i} className="flex items-center gap-1">
                            <kbd className="inline-flex h-7 min-w-[28px] items-center justify-center rounded-md border border-zinc-700 bg-zinc-800 px-2 text-[11px] font-medium text-zinc-200 shadow-sm">
                              {key}
                            </kbd>
                            {i < shortcut.keys.length - 1 && (
                              <span className="text-xs text-zinc-600">+</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-zinc-800 px-5 py-3">
                <p className="text-[11px] text-zinc-600">
                  Presiona <kbd className="inline-flex h-5 min-w-[20px] items-center justify-center rounded border border-zinc-700 bg-zinc-800 px-1.5 text-[10px] font-medium text-zinc-400">?</kbd> para abrir esta ventana en cualquier momento.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
