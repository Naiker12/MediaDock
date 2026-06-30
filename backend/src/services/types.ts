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
