export interface VideoQuality {
  id: string
  label: string
  extension: string
  codec: string
  fps: number
  width: number
  height: number
  bitrate: number
  filesize: number
  audioCodec: string
  audioBitrate: number
  isHDR: boolean
  isBest: boolean
}

export interface VideoInfo {
  id: string
  title: string
  thumbnail: string
  description: string
  duration: number
  durationString: string
  season?: number
  episode?: number
  year?: number
  language?: string
  subtitles: string[]
  source: string
  uploader: string
  uploadDate: string
  qualities: VideoQuality[]
  thumbnailHD?: string
  poster?: string
  banner?: string
  extractor: string
  webpageUrl: string
}

export interface AnalyzeResult {
  info: VideoInfo
  cached: boolean
}

export interface DownloadItem {
  id: string
  title: string
  quality: string
  format: string
  url: string
  timestamp: number
  thumbnail?: string
}

export interface DownloadProgress {
  loaded: number
  total: number
  speed: string
  eta: string
  percent: number
}

export type AppStatus = 'idle' | 'loading' | 'success' | 'error'

export interface ApiErrorResponse {
  error: string
  code: string
  status: number
}

export interface ClipInfo {
  index: number
  start: number
  end: number
  label: string
  filename: string
  sizeBytes: number
  durationSec: number
  thumbnailUrl?: string
}

export interface ClipResult {
  videoId: string
  totalClips: number
  clipDuration: number
  clips: ClipInfo[]
  zipUrl: string
}

export interface ClipJob {
  jobId: string
  status: 'processing' | 'done' | 'error'
  stage: 'preparing' | 'downloading' | 'segmenting' | 'finalizing' | 'done'
  clipsGenerated: number
  totalClips?: number
  clips: ClipInfo[]
  result?: ClipResult
  error?: string
}

export type ClipStatus = 'idle' | 'processing' | 'done' | 'error'
