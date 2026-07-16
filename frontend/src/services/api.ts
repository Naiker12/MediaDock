import axios from 'axios'
import type { AnalyzeResult, DownloadProgress, ApiErrorResponse } from '@/types'

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
  ) {
    super(message)
    this.name = 'ApiRequestError'
  }
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (axios.isCancel(error)) {
      return Promise.reject(new Error('Descarga cancelada'))
    }
    if (error.response?.data) {
      const apiError = error.response.data as ApiErrorResponse
      return Promise.reject(new ApiRequestError(
        apiError.error || 'Error del servidor',
        apiError.code || 'UNKNOWN',
        apiError.status || 500,
      ))
    }
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new ApiRequestError(
        'La solicitud tardó demasiado. Intenta de nuevo.',
        'TIMEOUT',
        408,
      ))
    }
    if (!error.response) {
      return Promise.reject(new ApiRequestError(
        'No se pudo conectar con el servidor. Verifica tu conexión.',
        'NETWORK_ERROR',
        0,
      ))
    }
    return Promise.reject(error)
  },
)

export async function analyzeVideo(url: string): Promise<AnalyzeResult> {
  const { data } = await api.post<AnalyzeResult>('/analyze', { url })
  return data
}

export function downloadVideo(
  url: string,
  qualityId: string,
  onProgress?: (progress: DownloadProgress) => void,
  signal?: AbortSignal,
): Promise<Blob> {
  return api
    .post<Blob>(
      '/download',
      { url, qualityId },
      {
        responseType: 'blob',
        signal,
        onDownloadProgress: (e) => {
          if (onProgress && e.total) {
            const percent = Math.round((e.loaded / e.total) * 100)
            onProgress({
              loaded: e.loaded,
              total: e.total,
              percent,
              speed: formatSpeed(e.rate || 0),
              eta: formatEta(e.loaded, e.total, e.rate || 0),
            })
          }
        },
      },
    )
    .then((res) => res.data)
}

export async function generateClips(url: string, clipDuration = 120, mode: 'fast' | 'precise' = 'fast'): Promise<import('@/types').ClipResult> {
  const { data } = await api.post<import('@/types').ClipResult>('/clip', { url, clipDuration, mode }, { timeout: 600000 })
  return data
}

function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond === 0) return '--'
  const units = ['B/s', 'KB/s', 'MB/s', 'GB/s']
  let value = bytesPerSecond
  let i = 0
  while (value >= 1024 && i < units.length - 1) { value /= 1024; i++ }
  return `${value.toFixed(1)} ${units[i]}`
}

function formatEta(loaded: number, total: number, rate: number): string {
  if (rate === 0) return '--'
  const remaining = (total - loaded) / rate
  if (remaining < 60) return `${Math.round(remaining)}s`
  const mins = Math.floor(remaining / 60)
  const secs = Math.round(remaining % 60)
  return `${mins}:${String(secs).padStart(2, '0')}`
}
