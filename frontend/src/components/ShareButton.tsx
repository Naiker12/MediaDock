import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Share2, Copy, Check, Link, Twitter, Facebook } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/useAppStore'
import { toast } from 'sonner'

export function ShareButton() {
  const { videoInfo, videoUrl } = useAppStore()
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!videoInfo) return null

  const text = `${videoInfo.title} - ${videoInfo.uploader || videoInfo.source}\n${videoUrl}`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(videoUrl || '')
      setCopied(true)
      toast.success('Enlace copiado al portapapeles')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('No se pudo copiar el enlace')
    }
  }

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success('Informaci\u00f3n copiada')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('No se pudo copiar')
    }
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(!open)}
        className="gap-1.5 text-xs text-zinc-400 hover:text-zinc-200"
        aria-label="Compartir"
      >
        <Share2 className="h-3.5 w-3.5" />
        Compartir
      </Button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 z-50 mt-1 w-52 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl"
            >
              <div className="p-1.5">
                <button
                  onClick={handleCopyLink}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <Link className="h-4 w-4" />
                  )}
                  Copiar enlace
                </button>
                <button
                  onClick={handleCopyAll}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
                >
                  <Copy className="h-4 w-4" />
                  Copiar todo
                </button>
              </div>
              <div className="border-t border-zinc-800 px-3 py-2">
                <p className="mb-1.5 text-[11px] text-zinc-600">Compartir en</p>
                <div className="flex gap-1">
                  <button
                    onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank')}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
                    aria-label="Compartir en Twitter"
                  >
                    <Twitter className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(videoUrl || '')}`, '_blank')}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
                    aria-label="Compartir en Facebook"
                  >
                    <Facebook className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
