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
  action?: string
}

function getErrorConfig(code: string | null, message: string): ErrorConfig {
  const m = message.toLowerCase()

  switch (code) {
    case 'UNSUPPORTED_SITE':
      return {
        icon: Film,
        title: 'Este sitio no es compatible',
        description: 'El extractor actual no puede analizar esta página.',
      }
    case 'YT_DLP_NOT_FOUND':
      return {
        icon: Settings,
        title: 'yt-dlp no está instalado',
        description: 'Instálalo en el servidor para habilitar descargas reales.',
      }
    case 'NETWORK_ERROR':
      return {
        icon: Wifi,
        title: 'Error de conexión',
        description: 'No pudimos conectar con el servidor.',
      }
    case 'NO_VIDEO_FOUND':
      return {
        icon: Search,
        title: 'No se encontró video',
        description: 'La página no contiene un reproductor de video detectable.',
      }
    case 'TIMEOUT':
      return {
        icon: Server,
        title: 'La solicitud tardó demasiado',
        description: 'El servidor no respondió a tiempo.',
      }
    default:
      break
  }

  if (m.includes('conexi') || m.includes('network') || m.includes('econnaborted') || m.includes('econnrefused')) {
    return { icon: Wifi, title: 'Error de conexión', description: 'Verifica tu conexión a internet.' }
  }
  if (m.includes('unsupported') || m.includes('no compatible') || m.includes('extractor')) {
    return { icon: Film, title: 'Sitio no compatible', description: 'Esta página no puede analizarse con el extractor actual.' }
  }
  if (m.includes('yt-dlp') || m.includes('instal')) {
    return { icon: Settings, title: 'yt-dlp no disponible', description: 'El servidor no tiene yt-dlp instalado.' }
  }
  if (m.includes('url') || m.includes('inv')) {
    return { icon: Search, title: 'URL no válida', description: 'Verifica que el enlace sea correcto.' }
  }
  if (m.includes('timeout') || m.includes('tard')) {
    return { icon: Server, title: 'Tiempo de espera agotado', description: 'El servidor no respondió.' }
  }

  return { icon: AlertCircle, title: 'No se pudo analizar', description: 'Ocurrió un error inesperado.' }
}

export function ErrorState() {
  const error = useAppStore((s) => s.error)
  const errorCode = useAppStore((s) => s.errorCode)
  const videoUrl = useAppStore((s) => s.videoUrl)
  const reset = useAppStore((s) => s.reset)

  const config = useMemo(() => getErrorConfig(errorCode, error || ''), [error, errorCode])

  if (!error) return null

  const Icon = config.icon
  const domain = videoUrl ? extractDomain(videoUrl) : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="mx-auto mt-4 w-full max-w-lg"
    >
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-800">
            <Icon className="h-5 w-5 text-zinc-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-zinc-100">{config.title}</h3>
            <p className="mt-0.5 text-xs text-zinc-500">{config.description}</p>
            {domain && errorCode === 'UNSUPPORTED_SITE' && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500">
                <Globe className="h-3 w-3" />
                <span>{domain}</span>
              </div>
            )}
            <div className="mt-3 flex items-center gap-2">
              <Button onClick={reset} variant="secondary" size="sm" className="h-8 gap-1.5 text-xs">
                <RotateCcw className="h-3.5 w-3.5" />
                Cambiar URL
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
