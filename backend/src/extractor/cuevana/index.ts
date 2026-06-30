import type { Extractor, ExtractResult } from '../types.js'
import { ExtractorError } from '../types.js'
import type { VideoInfo, VideoQuality } from '../../services/types.js'
import type { RawYtDlpOutput } from '../yt-dlp.js'
import { parseYtDlpOutput } from '../../parser/metadata.js'
import { YtDlp } from '../../services/yt-dlp/index.js'
import { analyzePage } from './analyzer.js'
import { resolveIframes } from './iframeResolver.js'
import { findStreams } from './playerResolver.js'
import { fetchUrl, streamFromUrl } from './network.js'

const CUEVANA_DOMAINS = [
  'cuevana', 'cuevanahd', 'cuevana3', 'cuevanapelispedia',
  'cuevana8', 'cuevana9', 'cuevana10',
  'cuevana2', 'cuevana4', 'cuevana5', 'cuevana6', 'cuevana7',
  'cuevanamega', 'cuevanachill',
  'gnula', 'pelisplus', 'repelis', 'hdfull',
]

function isUrl(str: string): boolean {
  return str.includes('://')
}

export class CuevanaExtractor implements Extractor {
  readonly name = 'cuevana-html'
  private ytAvailable: boolean | null = null

  canHandle(url: string): boolean {
    try {
      const hostname = new URL(url).hostname.toLowerCase()
      return CUEVANA_DOMAINS.some(d => hostname.includes(d))
    } catch {
      return false
    }
  }

  async extract(url: string): Promise<ExtractResult> {
    let html: string
    try {
      html = await fetchUrl(url)
    } catch (err) {
      const status = (err as Error & { status?: number }).status
      if (status === 404) {
        throw new ExtractorError('La página no existe (404). Verifica el enlace.', 'NETWORK_ERROR', 404)
      }
      throw new ExtractorError(
        'No se pudo acceder al sitio. Puede estar bloqueando el acceso.',
        'NETWORK_ERROR',
        502,
      )
    }

    if (html.length < 500) {
      throw new ExtractorError(
        'El sitio devolvió contenido vacío. Probablemente requiere JavaScript.',
        'NO_CONTENT',
        502,
      )
    }

    const metadata = analyzePage(html, url)

    // Phase 1: extract streams from main page
    let streams = findStreams(html, url)

    // Phase 2: follow iframes and extract streams from each
    if (streams.length === 0) {
      const iframes = await resolveIframes(html, url)
      for (const iframe of iframes) {
        if (iframe.html) {
          const iframeStreams = findStreams(iframe.html, iframe.src)
          streams.push(...iframeStreams)
        }
      }
    }

    // Phase 3: search inline script content more aggressively
    if (streams.length === 0) {
      const wildPatterns = [
        /https?:\/\/[^"'\s<>]*\.(?:m3u8|mp4)[^"'\s<>]*/gi,
        /https?:\/\/[^"'\s<>]*(?:video|stream|get|play)[^"'\s<>]*(?:\.php|\.html|\?)[^"'\s<>]*/gi,
      ]
      for (const pattern of wildPatterns) {
        let m: RegExpExecArray | null
        while ((m = pattern.exec(html)) !== null) {
          const u = m[0]
          if (!streams.find(s => s.url === u)) {
            streams.push({
              url: u,
              type: u.includes('.m3u8') ? 'm3u8' : u.includes('.mp4') ? 'mp4' : 'direct',
            })
          }
        }
        if (streams.length > 0) break
      }
    }

    if (streams.length === 0) {
      throw new ExtractorError(
        'No se encontró un reproductor de video en esta página. El sitio puede requerir JavaScript.',
        'NO_VIDEO_FOUND',
        404,
      )
    }

    // Phase 4: try yt-dlp on the real stream URL to get actual metadata
    let qualities = buildGenericQualities(streams)
    let finalTitle = metadata.title
    let finalThumbnail = metadata.thumbnail

    if (this.ytAvailable !== false) {
      try {
        await YtDlp.checkAvailable()
        this.ytAvailable = true

        const streamUrl = streams[0].url
        const raw = await YtDlp.exec([
          '--dump-single-json',
          '--no-warnings',
          '--no-playlist',
          streamUrl,
        ])
        const parsed = JSON.parse(raw) as RawYtDlpOutput
        const ytInfo = parseYtDlpOutput(parsed)

        if (ytInfo.qualities.length > 0) {
          qualities = ytInfo.qualities.map((q, i) => ({
            ...q,
            id: `${streamUrl}||${q.id}`,
            isBest: i === 0,
          }))
        }

        if (ytInfo.title && !ytInfo.title.includes('video') && !ytInfo.title.includes(streamUrl)) {
          finalTitle = ytInfo.title
        }
        if (ytInfo.thumbnail) {
          finalThumbnail = ytInfo.thumbnail
        }
      } catch {
        this.ytAvailable = false
      }
    }

    const info: VideoInfo = {
      id: Buffer.from(url).toString('base64').slice(0, 16),
      title: finalTitle,
      thumbnail: finalThumbnail,
      description: metadata.description,
      duration: 0,
      durationString: 'N/A',
      season: metadata.season,
      episode: metadata.episode,
      year: metadata.year,
      language: 'es',
      subtitles: [],
      source: 'cuevana',
      uploader: '',
      uploadDate: '',
      qualities,
      extractor: 'cuevana',
      webpageUrl: url,
    }

    return { info }
  }

  async download(url: string, qualityId: string): Promise<NodeJS.ReadableStream> {
    const pipeIdx = qualityId.indexOf('||')
    if (pipeIdx !== -1) {
      const streamUrl = qualityId.slice(0, pipeIdx)
      const formatId = qualityId.slice(pipeIdx + 2)
      return YtDlp.execStream(['-f', formatId, '-o', '-', streamUrl])
    }

    if (isUrl(qualityId)) {
      if (qualityId.includes('.m3u8')) {
        const { FFmpeg } = await import('../../services/ffmpeg/index.js')
        return FFmpeg.convertUrl(qualityId)
      }
      return streamFromUrl(qualityId)
    }

    return YtDlp.execStream(['-f', qualityId, '-o', '-', url])
  }
}

function buildGenericQualities(streams: { url: string; type: string }[]): VideoQuality[] {
  return streams.map((s, i) => ({
    id: s.url,
    label: s.type === 'mp4' ? 'Video (Directo)' : s.type === 'm3u8' ? 'Video (HLS)' : `Fuente ${i + 1}`,
    extension: s.type === 'mp4' ? 'mp4' : s.type === 'm3u8' ? 'm3u8' : 'mp4',
    codec: 'H.264',
    fps: 30,
    width: 0,
    height: 0,
    bitrate: 0,
    filesize: 0,
    audioCodec: 'AAC',
    audioBitrate: 0,
    isHDR: false,
    isBest: i === 0,
  }))
}
