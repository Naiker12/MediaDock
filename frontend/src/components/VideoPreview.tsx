import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock, Play, X, User, Globe, Maximize2, Eye,
  Film, Music, Monitor, Shield,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { formatDuration, formatBitrate } from '@/utils/format'
import { ShareButton } from './ShareButton'

const INFO_ITEMS = [
  { icon: Clock, label: 'Duración' },
  { icon: Maximize2, label: 'Resolución' },
  { icon: Eye, label: 'FPS' },
  { icon: Film, label: 'Codec' },
  { icon: Music, label: 'Audio' },
  { icon: Monitor, label: 'Bitrate' },
  { icon: Shield, label: 'HDR' },
]

function PreviewModal() {
  const { showPreviewModal, setShowPreviewModal, videoInfo } = useAppStore()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowPreviewModal(false)
    }
    if (showPreviewModal) {
      window.addEventListener('keydown', handler)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [showPreviewModal, setShowPreviewModal])

  if (!showPreviewModal || !videoInfo) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setShowPreviewModal(false)}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Vista previa del video"
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-h-[90vh] max-w-6xl overflow-hidden rounded-xl"
        >
          <button
            onClick={() => setShowPreviewModal(false)}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/80"
            aria-label="Cerrar vista previa"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="relative bg-black">
            <img
              src={videoInfo.thumbnail}
              alt={videoInfo.title}
              className="max-h-[85vh] w-full object-contain"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
                <Play className="h-8 w-8 translate-x-0.5 text-white drop-shadow-lg" />
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 pt-16">
            <h3 className="text-xl font-bold text-white drop-shadow-lg">{videoInfo.title}</h3>
            <p className="text-sm text-zinc-300">{videoInfo.uploader || videoInfo.source} &middot; {videoInfo.year}</p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function InfoGrid() {
  const { videoInfo } = useAppStore()
  if (!videoInfo) return null

  const bestQ = videoInfo.qualities.find(q => q.isBest) || videoInfo.qualities[0]

  return (
    <div className="grid grid-cols-2 gap-2">
      {INFO_ITEMS.map((item) => {
        let value: string
        switch (item.label) {
          case 'Duración': value = videoInfo.durationString || formatDuration(videoInfo.duration); break
          case 'Resolución': value = bestQ ? `${bestQ.height}p` : 'N/A'; break
          case 'FPS': value = bestQ ? `${bestQ.fps}` : 'N/A'; break
          case 'Codec': value = bestQ?.codec || 'N/A'; break
          case 'Audio': value = bestQ?.audioCodec || 'N/A'; break
          case 'Bitrate': value = bestQ?.bitrate ? formatBitrate(bestQ.bitrate) : 'N/A'; break
          case 'HDR': value = bestQ?.isHDR ? 'Sí' : 'No'; break
          default: value = 'N/A'
        }
        return (
          <div
            key={item.label}
            className="flex items-center gap-2 rounded-lg bg-zinc-800/30 px-3 py-2.5"
          >
            <item.icon className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-zinc-600">{item.label}</p>
              <p className="text-xs font-medium text-zinc-200 truncate">{value}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function VideoPreview() {
  const { videoInfo, videoUrl, setShowPreviewModal } = useAppStore()
  if (!videoInfo) return null

  const bestQuality = videoInfo.qualities.find((q) => q.isBest) || videoInfo.qualities[0]

  function extractDomain(url: string): string {
    try { return new URL(url).hostname.replace('www.', '') }
    catch { return url }
  }

  return (
    <>
      <PreviewModal />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="mx-auto mt-6 w-full"
      >
        <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="lg:col-span-7 xl:col-span-8"
          >
            <button
              onClick={() => setShowPreviewModal(true)}
              className="group relative w-full overflow-hidden rounded-2xl border border-zinc-800 bg-black shadow-2xl"
              aria-label="Abrir vista previa"
            >
              <div className="relative aspect-video">
                {videoInfo.thumbnail ? (
                  <img
                    src={videoInfo.thumbnail}
                    alt={videoInfo.title}
                    className="h-full w-full object-cover transition-all duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-950">
                    <Film className="h-16 w-16 text-zinc-800" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 backdrop-blur-md ring-1 ring-white/20 transition-all duration-300 group-hover:scale-110 group-hover:bg-white/20 sm:h-20 sm:w-20">
                    <Play className="h-7 w-7 translate-x-0.5 text-white drop-shadow-lg sm:h-8 sm:w-8" />
                  </div>
                </div>

                <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 sm:bottom-4 sm:left-4 sm:right-4">
                  <div className="flex items-center gap-1.5 rounded-lg bg-black/70 px-2.5 py-1 text-[11px] font-medium text-zinc-200 backdrop-blur-sm">
                    <Clock className="h-3.5 w-3.5" />
                    {videoInfo.durationString || formatDuration(videoInfo.duration)}
                  </div>
                  <div className="rounded-lg bg-primary/90 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm shadow-lg shadow-primary/25">
                    HD
                  </div>
                  <div className="rounded-lg bg-black/70 px-2.5 py-1 text-[11px] font-medium text-zinc-200 backdrop-blur-sm">
                    {bestQuality?.label || videoInfo.qualities[0]?.label || 'N/A'}
                  </div>
                </div>
              </div>
            </button>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
              <span className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" />
                {extractDomain(videoUrl || '')}
              </span>
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                {videoInfo.uploader || videoInfo.source}
              </span>
              <div className="ml-auto">
                <ShareButton />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="lg:col-span-5 xl:col-span-4"
          >
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
              <div className="mb-4">
                <h2 className="text-sm font-bold leading-tight text-zinc-100 line-clamp-2">
                  {videoInfo.title}
                </h2>
                <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                  <User className="h-3 w-3" />
                  {videoInfo.uploader || videoInfo.source}
                  {videoInfo.year && <><span className="text-zinc-700">|</span>{videoInfo.year}</>}
                </div>
              </div>

              <InfoGrid />

              {videoInfo.subtitles.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {videoInfo.subtitles.map((sub) => (
                    <span
                      key={sub}
                      className="rounded-md bg-zinc-800/50 px-2 py-0.5 text-[10px] font-medium text-zinc-400"
                    >
                      {sub}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </>
  )
}
