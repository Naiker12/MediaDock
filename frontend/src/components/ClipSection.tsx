import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Scissors, Download, Loader2, FileVideo, Package, Upload, Film, X } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { generateClips } from '@/services/api'
import { ApiRequestError } from '@/services/api'
import { Button } from '@/components/ui/button'
import { formatSize } from '@/utils/format'
import { Skeleton } from '@/components/ui/skeleton'
import type { ClipInfo, ClipResult } from '@/types'

const API_URL = import.meta.env.VITE_API_URL || '/api'

export function ClipSection() {
  const { videoInfo, videoUrl, clipStatus, clipResult, clipError, setClipResult, setClipError, setClipStatus } = useAppStore()
  const [clipDuration, setClipDuration] = useState(120)
  const [mode, setMode] = useState<'fast' | 'precise'>('fast')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (uploadFile) {
      const url = URL.createObjectURL(uploadFile)
      setPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    } else {
      setPreviewUrl(null)
    }
  }, [uploadFile])

  const isProcessing = clipStatus === 'processing' || uploading

  const handleGenerate = async () => {
    if (uploadFile) {
      await handleUploadClip()
    } else if (videoUrl) {
      await handleUrlClip()
    }
  }

  const handleUrlClip = async () => {
    if (!videoUrl) return
    setClipStatus('processing')
    setClipError(null)
    try {
      const result = await generateClips(videoUrl, clipDuration, mode)
      setClipResult(result)
    } catch (err) {
      setClipError(err instanceof ApiRequestError ? err.message : 'Error al generar clips')
    }
  }

  const handleUploadClip = async () => {
    if (!uploadFile) return
    setUploading(true)
    setClipError(null)
    try {
      const formData = new FormData()
      formData.append('video', uploadFile)
      formData.append('clipDuration', String(clipDuration))
      formData.append('mode', mode)

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 600000)
      const res = await fetch(`${API_URL}/clip/upload`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      })
      clearTimeout(timeout)

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Error del servidor' }))
        throw new Error(err.error || 'Error al procesar el video')
      }

      const result: ClipResult = await res.json()
      setClipResult(result)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setClipError('La subida tardó demasiado. Intenta con un video más pequeño.')
      } else {
        setClipError(err instanceof Error ? err.message : 'Error al subir el video')
      }
    } finally {
      setUploading(false)
    }
  }

  const handleDownloadClip = (clip: ClipInfo) => {
    const link = document.createElement('a')
    link.href = `${API_URL}/clip/${clipResult!.videoId}/${clip.filename}`
    link.download = clip.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDownloadAll = () => {
    const link = document.createElement('a')
    link.href = `${API_URL}/clip/${clipResult!.videoId}/download-all`
    link.download = `${clipResult!.videoId}-clips.zip`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('video/')) {
      setUploadFile(file)
      setClipResult(null)
      setClipError(null)
    }
  }

  const durationOptions = [
    { value: 60, label: '1 min' },
    { value: 120, label: '2 min' },
    { value: 300, label: '5 min' },
    { value: 600, label: '10 min' },
  ]

  const showUpload = !videoUrl || uploadFile

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-4"
    >
      {!clipResult && (
        <>
          {showUpload && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => inputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-900/30 p-8 transition-colors hover:border-zinc-500 hover:bg-zinc-900/50"
            >
              {uploadFile ? (
                <div className="w-full space-y-3">
                  <div className="relative aspect-video overflow-hidden rounded-lg bg-zinc-900">
                    {previewUrl ? (
                      <video
                        ref={videoRef}
                        src={previewUrl}
                        controls
                        className="h-full w-full object-contain"
                        preload="metadata"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                      </div>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); setUploadFile(null) }}
                      className="absolute right-2 top-2 rounded-lg bg-zinc-900/80 p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between px-1">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-200">{uploadFile.name}</p>
                      <p className="text-xs text-zinc-500">{formatSize(uploadFile.size)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-zinc-600" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-zinc-300">
                      Haz clic o arrastra un video aquí
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      MP4, MKV, WEBM, AVI, MOV (máx 1 GB)
                    </p>
                  </div>
                </>
              )}
              <input
                ref={inputRef}
                type="file"
                accept="video/mp4,video/x-matroska,video/webm,video/avi,video/quicktime"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setUploadFile(file)
                    setClipResult(null)
                    setClipError(null)
                  }
                }}
              />
            </div>
          )}

          {videoUrl && !uploadFile && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
              <div className="flex items-center gap-2 text-sm text-zinc-300">
                <Film className="h-4 w-4 text-primary" />
                Video desde URL: {videoInfo?.title || videoUrl}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-zinc-500">Duración:</span>
                <div className="flex gap-1">
                  {durationOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setClipDuration(opt.value)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                        clipDuration === opt.value
                          ? 'bg-primary/20 text-primary'
                          : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-zinc-500">Modo:</span>
                <button
                  onClick={() => setMode('fast')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                    mode === 'fast'
                      ? 'bg-primary/20 text-primary'
                      : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  Rápido
                </button>
                <button
                  onClick={() => setMode('precise')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                    mode === 'precise'
                      ? 'bg-primary/20 text-primary'
                      : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  Preciso
                </button>
              </div>

              <Button
                size="sm"
                disabled={isProcessing || (!videoUrl && !uploadFile)}
                onClick={handleGenerate}
                className="ml-auto gap-1.5"
              >
                {isProcessing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Scissors className="h-3.5 w-3.5" />
                )}
                {uploading ? 'Subiendo...' : isProcessing ? 'Generando...' : 'Generar clips'}
              </Button>
            </div>

            {isProcessing && (
              <div className="flex items-center gap-3 rounded-lg bg-zinc-800/30 px-4 py-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <div className="text-sm text-zinc-300">
                  {uploadFile ? 'Procesando video...' : `Cortando video en segmentos de ${clipDuration / 60} min...`}
                </div>
              </div>
            )}

            {clipError && (
              <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
                {clipError}
              </div>
            )}
          </div>
        </>
      )}

      {clipResult && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/30 px-4 py-3">
            <span className="text-xs text-zinc-400">
              {clipResult.totalClips} clips de {formatDuration(clipDuration)} generados
            </span>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setClipResult(null); setUploadFile(null) }}
                className="gap-1.5 text-zinc-500"
              >
                <X className="h-3.5 w-3.5" />
                Nuevo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadAll}
                className="gap-1.5"
              >
                <Package className="h-3.5 w-3.5" />
                Descargar todo (.zip)
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {clipResult.clips.map((clip) => (
              <ClipCard
                key={clip.index}
                clip={clip}
                onDownload={() => handleDownloadClip(clip)}
              />
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

interface ClipCardProps {
  clip: ClipInfo
  onDownload: () => void
}

function ClipCard({ clip, onDownload }: ClipCardProps) {
  const [thumbLoaded, setThumbLoaded] = useState(false)
  const [thumbError, setThumbError] = useState(false)

  return (
    <div className="group rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 transition-colors hover:border-zinc-700">
      <div className="relative mb-2 flex aspect-video items-center justify-center overflow-hidden rounded-md bg-zinc-800">
        {clip.thumbnailUrl && !thumbError ? (
          <>
            {!thumbLoaded && (
              <Skeleton className="absolute inset-0 h-full w-full" />
            )}
            <img
              src={clip.thumbnailUrl}
              alt={`Clip ${clip.index} preview`}
              className={`h-full w-full object-cover transition-opacity duration-300 ${thumbLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setThumbLoaded(true)}
              onError={() => setThumbError(true)}
              loading="lazy"
            />
          </>
        ) : (
          <FileVideo className="h-8 w-8 text-zinc-600" />
        )}
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-zinc-200">
            Clip {clip.index}
          </p>
          <p className="text-[11px] text-zinc-500">{clip.label}</p>
          <p className="text-[10px] text-zinc-600">{formatSize(clip.sizeBytes)}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-zinc-400 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:transition-opacity"
          onClick={onDownload}
          aria-label={`Descargar clip ${clip.index}`}
        >
          <Download className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}
