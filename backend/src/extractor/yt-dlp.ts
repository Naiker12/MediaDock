import { YtDlp } from '../services/yt-dlp/index.js'
import { parseYtDlpOutput } from '../parser/metadata.js'
import type { Extractor, ExtractResult } from './types.js'

interface RawFormat {
  format_id: string
  format_note?: string
  ext: string
  vcodec: string
  acodec: string
  height?: number
  width?: number
  tbr?: number
  filesize?: number
  filesize_approx?: number
  fps?: number
  dynamic_range?: string
  audio_bitrate?: number
}

export interface RawYtDlpOutput {
  id: string
  title: string
  thumbnail: string
  description: string
  duration: number
  channel: string
  channel_url?: string
  channel_follower_count?: number
  upload_date?: string
  uploader?: string
  season_number?: number
  episode_number?: number
  release_year?: number
  language?: string
  subtitles?: Record<string, Array<{ ext: string }>>
  automatic_captions?: Record<string, unknown>
  webpage_url: string
  extractor: string
  extractor_key: string
  thumbnails?: Array<{ url: string; height?: number; width?: number; preference?: number }>
  formats: RawFormat[]
  resolution?: string
  fps?: number
  vcodec?: string
  acodec?: string
  dynamic_range?: string
}

const QUALITY_MAP: Record<string, string> = {
  '2160p': 'bestvideo[height<=2160]+bestaudio/best[height<=2160]',
  '1440p': 'bestvideo[height<=1440]+bestaudio/best[height<=1440]',
  '1080p': 'bestvideo[height<=1080]+bestaudio/best[height<=1080]',
  '720p': 'bestvideo[height<=720]+bestaudio/best[height<=720]',
  '480p': 'bestvideo[height<=480]+bestaudio/best[height<=480]',
  '360p': 'bestvideo[height<=360]+bestaudio/best[height<=360]',
  'Audio': 'bestaudio/best',
  'audio-only': 'bestaudio/best',
}

export class YtDlpExtractor implements Extractor {
  readonly name = 'yt-dlp'

  canHandle(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  async extract(url: string): Promise<ExtractResult> {
    const raw = await YtDlp.exec([
      '--dump-single-json',
      '--no-warnings',
      '--no-playlist',
      url,
    ])

    const parsed = JSON.parse(raw) as RawYtDlpOutput
    const info = parseYtDlpOutput(parsed)

    return { info, raw: parsed }
  }

  async download(url: string, qualityId: string): Promise<NodeJS.ReadableStream> {
    let format: string

    if (/^\d+$/.test(qualityId)) {
      format = qualityId
    } else {
      const mapped = QUALITY_MAP[qualityId]
      if (!mapped) {
        const e = new Error(`Calidad no válida: ${qualityId}`)
        e.name = 'ValidationError'
        throw e
      }
      format = mapped
    }

    try {
      return YtDlp.execStream(['-f', format, '-o', '-', url])
    } catch (error) {
      console.error('[YtDlpExtractor.download] Error:', error)
      throw new Error('Error al iniciar la descarga del video.')
    }
  }
}
