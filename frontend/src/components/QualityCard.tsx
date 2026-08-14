import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/useAppStore'
import { downloadVideo } from '@/services/api'
import { formatSize } from '@/utils/format'
import type { VideoQuality } from '@/types'
import { cn } from '@/lib/utils'
import { setAbortController } from '@/lib/downloadManager'
import { Download, Monitor, Music, Star } from 'lucide-react'
import { Loading } from '@/components/Loading'
import { toast } from 'sonner'

interface QualityCardProps {
  quality: VideoQuality
  index: number
}

const QUALITY_COLORS: Record<string, { bg: string; border: string; badge: string; label: string }> = {
  '2160p': { bg: 'bg-purple-500/[0.06]', border: 'border-purple-500/30', badge: 'bg-purple-500', label: '4K' },
  '1440p': { bg: 'bg-indigo-500/[0.06]', border: 'border-indigo-500/30', badge: 'bg-indigo-500', label: '2K' },
  '1080p': { bg: 'bg-blue-500/[0.06]', border: 'border-blue-500/30', badge: 'bg-blue-500', label: 'FHD' },
  '720p': { bg: 'bg-zinc-500/[0.04]', border: 'border-zinc-600/30', badge: 'bg-zinc-600', label: 'HD' },
}

const AUDIO_COLOR = { bg: 'bg-emerald-500/[0.06]', border: 'border-emerald-500/30', badge: 'bg-emerald-500', label: 'Audio' }

export function QualityCard({ quality, index }: QualityCardProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const {
    selectedQuality, setSelectedQuality, videoInfo, videoUrl,
    addToHistory, setDownloadProgress, setIsDownloading: setIsGlobalDownloading,
  } = useAppStore()
  const isSelected = selectedQuality === quality.id
  const isAudio = quality.extension === 'mp3' || quality.extension === 'm4a' || quality.label === 'Audio'
  const isBest = quality.isBest

  const colors = isAudio ? AUDIO_COLOR : (QUALITY_COLORS[quality.id] || { bg: 'bg-transparent', border: 'border-zinc-700/20', badge: 'bg-zinc-700', label: quality.id })

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!videoUrl) { toast.error('URL del video no disponible'); return }

    const controller = new AbortController()
    setAbortController(controller)

    setIsDownloading(true)
    setIsGlobalDownloading(true)
    setDownloadProgress({ loaded: 0, total: 0, percent: 0, speed: '', eta: '' })
    try {
      const blob = await downloadVideo(videoUrl, quality.id, (p) => setDownloadProgress(p), controller.signal)
      const blobUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `${videoInfo?.title || 'video'}.${quality.extension}`
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      window.URL.revokeObjectURL(blobUrl)
      addToHistory({
        id: `${Date.now()}`, title: videoInfo?.title || 'Video',
        quality: quality.label, format: quality.extension, url: videoUrl,
        timestamp: Date.now(), thumbnail: videoInfo?.thumbnail,
      })

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Descarga completada', {
          body: `${videoInfo?.title || 'Video'} - ${quality.label}`,
          icon: '/icons/icon-192.png',
        })
      }

      toast.success('Descarga completada')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al descargar')
    } finally {
      setAbortController(null)
      setIsDownloading(false)
      setIsGlobalDownloading(false)
      setDownloadProgress(null)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.05 * index }}
      onClick={() => setSelectedQuality(quality.id)}
      className={cn(
        'group relative cursor-pointer overflow-hidden rounded-xl border p-4 transition-all duration-200',
        isSelected
          ? cn(colors.border, colors.bg)
          : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-600 hover:bg-zinc-900/60',
      )}
    >
      {isBest && (
        <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary shadow-sm">
          <Star className="h-2.5 w-2.5 fill-primary" />
          BEST
        </div>
      )}

      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all',
            isSelected
              ? isAudio ? 'bg-emerald-500/20 text-emerald-400' : isBest ? 'bg-primary/20 text-primary' : 'bg-zinc-700 text-zinc-300'
              : 'bg-zinc-800 text-zinc-500',
          )}
        >
          {isAudio ? <Music className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className={cn('text-base font-bold', isSelected ? 'text-zinc-100' : 'text-zinc-200')}>
              {quality.label}
            </h4>
            <span className={cn(
              'rounded px-1.5 py-0.5 text-[10px] font-semibold text-white',
              isBest ? 'bg-primary' : colors.badge,
            )}>
              {isAudio ? 'AUDIO' : quality.extension?.toUpperCase()}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-zinc-500">
            <span>{formatSize(quality.filesize)}</span>
            {quality.codec && <><span className="text-zinc-700">/</span><span>{quality.codec}</span></>}
          </div>
        </div>
      </div>

      {isSelected && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-3"
        >
          <Button
            className="w-full gap-2 font-medium"
            size="default"
            disabled={isDownloading}
            onClick={handleDownload}
          >
            {isDownloading ? <Loading compact label="" /> : (
              <Download className="h-4 w-4" />
            )}
            {isDownloading ? 'Descargando...' : 'Descargar'}
          </Button>
        </motion.div>
      )}
    </motion.div>
  )
}
