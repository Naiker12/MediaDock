import { motion } from 'framer-motion'
import {
  Download, History, Trash2, Monitor, Music, XCircle, RotateCcw,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { useVideoInfo } from '@/hooks/useVideoInfo'
import { cancelDownload } from '@/lib/downloadManager'
import { QualityCard } from './QualityCard'
import { Button } from '@/components/ui/button'
import { formatSize } from '@/utils/format'

function formatTimestamp(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Ahora'
  if (mins < 60) return `Hace ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Ayer'
  if (days < 7) return `Hace ${days}d`
  return new Date(ts).toLocaleDateString()
}

function groupByDate(items: ReturnType<typeof useAppStore.getState>['history']) {
  const groups: { label: string; items: typeof items }[] = []
  const now = Date.now()
  const today = items.filter(i => now - i.timestamp < 86400000)
  const yesterday = items.filter(i => {
    const diff = now - i.timestamp
    return diff >= 86400000 && diff < 172800000
  })
  const older = items.filter(i => now - i.timestamp >= 172800000)

  if (today.length) groups.push({ label: 'Hoy', items: today })
  if (yesterday.length) groups.push({ label: 'Ayer', items: yesterday })
  if (older.length) groups.push({ label: 'Anteriores', items: older })
  return groups
}

function DownloadProgress() {
  const { downloadProgress, isDownloading, videoInfo, selectedQuality, setDownloadProgress, setIsDownloading } = useAppStore()

  if (!isDownloading || !downloadProgress) return null

  const quality = videoInfo?.qualities.find((q) => q.id === selectedQuality)

  const handleCancel = () => {
    cancelDownload()
    setIsDownloading(false)
    setDownloadProgress(null)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {quality?.extension === 'mp3' || quality?.extension === 'm4a' ? (
            <Music className="h-4 w-4 text-primary" />
          ) : (
            <Monitor className="h-4 w-4 text-primary" />
          )}
          <div>
            <p className="text-sm font-medium text-zinc-200">
              Descargando{quality ? ` ${quality.label}` : ''}...
            </p>
            <p className="text-[11px] text-zinc-500">
              {formatSize(downloadProgress.loaded)} / {formatSize(downloadProgress.total)}
            </p>
          </div>
        </div>
        <span className="text-xs text-zinc-500">{downloadProgress.eta}</span>
      </div>

      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-zinc-800">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary to-blue-400"
          initial={{ width: '0%' }}
          animate={{ width: `${downloadProgress.percent}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500">{downloadProgress.speed}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="h-7 gap-1 text-xs text-zinc-500 hover:text-danger"
        >
          <XCircle className="h-3.5 w-3.5" />
          Cancelar
        </Button>
      </div>
    </motion.div>
  )
}

function HistorySection() {
  const { history, clearHistory } = useAppStore()
  const mutation = useVideoInfo()

  if (history.length === 0) return null

  const handleReAnalyze = (item: typeof history[0]) => {
    mutation.mutate(item.url)
  }

  const groups = groupByDate(history)

  return (
    <motion.div
      id="history-section"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-zinc-400" />
          <h3 className="text-sm font-semibold text-zinc-200">Últimas descargas</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearHistory}
          className="h-7 gap-1 text-xs text-zinc-500 hover:text-zinc-300"
        >
          <Trash2 className="h-3 w-3" />
          Limpiar
        </Button>
      </div>

      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-zinc-600">
              {group.label}
            </p>
            <div className="space-y-1.5">
              {group.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleReAnalyze(item)}
                  className="flex w-full items-center gap-3 rounded-lg border border-zinc-800/40 bg-zinc-900/20 px-3 py-2.5 text-left transition-colors hover:bg-zinc-900/40"
                >
                  <div className="flex h-10 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-800">
                    {item.thumbnail ? (
                      <img src={item.thumbnail} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Download className="h-4 w-4 text-zinc-600" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-200">{item.title}</p>
                    <p className="text-[11px] text-zinc-500">
                      {item.quality} &middot; {item.format?.toUpperCase()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-right shrink-0">
                    <span className="text-[11px] text-zinc-600 whitespace-nowrap">{formatTimestamp(item.timestamp)}</span>
                    <RotateCcw className="h-3 w-3 text-zinc-600" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

export function DownloadSection() {
  const videoInfo = useAppStore((s) => s.videoInfo)

  if (!videoInfo?.qualities.length) return null

  return (
    <div className="mx-auto mt-6 w-full space-y-6">
      <DownloadProgress />

      <div>
        <div className="mb-4">
          <h3 className="text-base font-semibold text-zinc-100">Calidades disponibles</h3>
          <p className="text-xs text-zinc-500">
            {videoInfo.qualities.length} opciones &middot; Selecciona y descarga
          </p>
        </div>

        <div className="space-y-2.5">
          {videoInfo.qualities.map((quality, index) => (
            <QualityCard key={quality.id} quality={quality} index={index} />
          ))}
        </div>
      </div>

      <HistorySection />
    </div>
  )
}
