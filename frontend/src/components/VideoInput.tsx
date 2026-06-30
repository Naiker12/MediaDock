import { useState, useEffect, useRef, type FormEvent, type ClipboardEvent } from 'react'
import { motion } from 'framer-motion'
import { Search, Link, Globe, X, AlertCircle, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useVideoInfo } from '@/hooks/useVideoInfo'
import { useAppStore } from '@/store/useAppStore'
import { isValidUrl, extractDomain, detectPlatform, PLATFORMS } from '@/utils/format'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function VideoInput() {
  const [url, setUrl] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const mutation = useVideoInfo()
  const { status, reset, setStatus, setVideoUrl } = useAppStore()
  const isPending = status === 'loading'
  const detected = url.trim() ? detectPlatform(url.trim()) : null
  const urlValid = url.trim() ? isValidUrl(url.trim()) : false

  const submitUrl = (raw: string) => {
    const trimmed = raw.trim()
    if (!trimmed) return
    if (!isValidUrl(trimmed)) {
      toast.error('URL no válida. Debe incluir http:// o https://')
      return
    }
    setVideoUrl(trimmed)
    mutation.mutate(trimmed)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    submitUrl(url)
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text')
    if (isValidUrl(pasted.trim())) submitUrl(pasted.trim())
  }

  const handleChangeUrl = () => {
    reset()
    setStatus('idle')
    setUrl('')
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && status === 'success') {
        handleChangeUrl()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [status])

  useEffect(() => {
    if (status === 'idle' && inputRef.current) inputRef.current.focus()
  }, [status])

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="mx-auto w-full"
    >
      <div className="flex items-center gap-2.5">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2">
            <Link className="h-4 w-4 text-zinc-500" />
          </div>
          <Input
            ref={inputRef}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onPaste={handlePaste}
            placeholder="Pega la URL del video..."
            disabled={isPending}
            className={cn(
              'h-14 pl-10 pr-10 text-base transition-all rounded-xl border-zinc-700/50 bg-zinc-900/50',
              'focus:border-zinc-500 focus:bg-zinc-900',
              'placeholder:text-zinc-600',
              urlValid && 'border-success/30',
            )}
            aria-label="URL del video"
          />
          {url && (
            <button
              type="button"
              onClick={() => setUrl('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={isPending || (url.trim() !== '' && !urlValid)}
          className="h-14 min-w-[120px] gap-2 rounded-xl font-medium"
          aria-label="Analizar video"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analizando
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              Analizar
            </>
          )}
        </Button>
      </div>

      <div className="mt-3 flex items-center gap-3 flex-wrap">
        {detected && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium',
              detected.bg, detected.color, detected.border,
            )}
          >
            <span>{detected.emoji}</span>
            <span>{detected.name} detectado</span>
          </motion.div>
        )}

        {urlValid && !detected && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 rounded-lg bg-zinc-800/50 px-2.5 py-1 text-xs text-zinc-500"
          >
            <Globe className="h-3 w-3" />
            <span>{extractDomain(url.trim())}</span>
          </motion.div>
        )}

        {url && !urlValid && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 rounded-lg bg-danger/10 px-2.5 py-1 text-xs text-danger/70"
          >
            <AlertCircle className="h-3 w-3" />
            <span>URL inválida</span>
          </motion.div>
        )}

        {!url && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-[11px] text-zinc-600"
          >
            {PLATFORMS.slice(0, 6).map((p) => (
              <span key={p.id} className="flex items-center gap-1">
                <span>{p.emoji}</span>
                <span className="hidden sm:inline">{p.name}</span>
              </span>
            ))}
          </motion.div>
        )}
      </div>
    </motion.form>
  )
}
