import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, RotateCcw, Wifi, Server, Search, Globe, Film, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/useAppStore'
import { extractDomain } from '@/utils/format'

interface ErrorConfig {
  icon: typeof AlertCircle
  title: string
  description: string
}

function getErrorConfig(code: string | null, message: string): ErrorConfig {
  const text = message.toLowerCase()
  const configs: Record<string, ErrorConfig> = {
    UNSUPPORTED_SITE: { icon: Film, title: 'Este sitio aún no es compatible', description: 'Prueba con un enlace de una plataforma compatible o utiliza otro video.' },
    YT_DLP_NOT_FOUND: { icon: Settings, title: 'El servicio de descargas no está listo', description: 'Falta una herramienta en el servidor. Inténtalo de nuevo más tarde.' },
    NETWORK_ERROR: { icon: Wifi, title: 'No pudimos conectar con el servidor', description: 'Comprueba tu conexión a internet y vuelve a intentarlo.' },
    NO_VIDEO_FOUND: { icon: Search, title: 'No encontramos un video en este enlace', description: 'Asegúrate de copiar la URL directa del video, no la de una página general.' },
    TIMEOUT: { icon: Server, title: 'El servidor tardó demasiado en responder', description: 'El video puede ser muy grande o el servicio estar ocupado. Inténtalo otra vez.' },
  }
  if (code && configs[code]) return configs[code]
  if (text.includes('conexi') || text.includes('network') || text.includes('econn')) return configs.NETWORK_ERROR
  if (text.includes('unsupported') || text.includes('extractor')) return configs.UNSUPPORTED_SITE
  if (text.includes('yt-dlp') || text.includes('instal')) return configs.YT_DLP_NOT_FOUND
  if (text.includes('url') || text.includes('inv')) return { icon: Search, title: 'La URL no parece válida', description: 'Incluye la dirección completa, comenzando con https://, y vuelve a probar.' }
  if (text.includes('timeout') || text.includes('tard')) return configs.TIMEOUT
  return { icon: AlertCircle, title: 'No pudimos analizar este enlace', description: 'Comprueba que sea un enlace público y vuelve a intentarlo.' }
}

export function ErrorState() {
  const error = useAppStore((state) => state.error)
  const errorCode = useAppStore((state) => state.errorCode)
  const videoUrl = useAppStore((state) => state.videoUrl)
  const reset = useAppStore((state) => state.reset)
  const config = useMemo(() => getErrorConfig(errorCode, error || ''), [error, errorCode])

  if (!error) return null

  const Icon = config.icon
  const domain = videoUrl ? extractDomain(videoUrl) : null

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mx-auto mt-6 w-full max-w-xl">
      <div className="overflow-hidden rounded-2xl border border-amber-400/15 bg-zinc-900/60 shadow-2xl shadow-black/20">
        <div className="h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-transparent" />
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-400/15 bg-amber-400/10">
              <Icon className="h-5 w-5 text-amber-300" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-300/80">Revisa el enlace</p>
              <h3 className="mt-1 text-base font-semibold text-zinc-100">{config.title}</h3>
              <p className="mt-1 text-sm leading-6 text-zinc-400">{config.description}</p>
              {domain && (
                <div className="mt-3 inline-flex max-w-full items-center gap-1.5 rounded-lg border border-zinc-700/70 bg-zinc-950/50 px-2.5 py-1.5 text-xs text-zinc-400">
                  <Globe className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                  <span className="truncate">{domain}</span>
                </div>
              )}
              <div className="mt-5">
                <Button onClick={reset} size="sm" className="h-9 gap-2 rounded-lg px-3 text-xs">
                  <RotateCcw className="h-3.5 w-3.5" />
                  Probar otro enlace
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
