import type { Extractor, ExtractResult } from './types.js'
import type { VideoInfo, VideoQuality } from '../services/types.js'

export class DemoExtractor implements Extractor {
  readonly name = 'demo'

  canHandle(): boolean {
    return true
  }

  async extract(url: string): Promise<ExtractResult> {
    const domain = extractDomain(url)
    const domainName = domain || 'sitio'

    const qualities: VideoQuality[] = [
      {
        id: '1080p',
        label: '1080p',
        extension: 'mp4',
        codec: 'H.264',
        fps: 30,
        width: 1920,
        height: 1080,
        bitrate: 5_000_000,
        filesize: 512_000_000,
        audioCodec: 'AAC',
        audioBitrate: 128_000,
        isHDR: false,
        isBest: true,
      },
      {
        id: '720p',
        label: '720p',
        extension: 'mp4',
        codec: 'H.264',
        fps: 30,
        width: 1280,
        height: 720,
        bitrate: 2_500_000,
        filesize: 256_000_000,
        audioCodec: 'AAC',
        audioBitrate: 128_000,
        isHDR: false,
        isBest: false,
      },
      {
        id: '480p',
        label: '480p',
        extension: 'mp4',
        codec: 'H.264',
        fps: 30,
        width: 854,
        height: 480,
        bitrate: 1_000_000,
        filesize: 128_000_000,
        audioCodec: 'AAC',
        audioBitrate: 96_000,
        isHDR: false,
        isBest: false,
      },
    ]

    const info: VideoInfo = {
      id: 'demo-' + Buffer.from(url).toString('base64').slice(0, 8),
      title: `Video de ${domainName}`,
      thumbnail: `https://placehold.co/1280x720/1a1a2e/e0e0e0?text=${encodeURIComponent(domainName)}`,
      description: `Vista previa generada para ${url}. yt-dlp no está disponible en este entorno.`,
      duration: 0,
      durationString: 'N/A',
      language: 'es',
      subtitles: ['Español', 'English'],
      source: 'demo',
      uploader: 'Demo',
      uploadDate: '',
      qualities,
      extractor: 'demo',
      webpageUrl: url,
    }

    return { info }
  }

  async download(): Promise<NodeJS.ReadableStream> {
    throw new Error(
      'Descarga no disponible en modo demo. ' +
      'Instala yt-dlp en el servidor para habilitar descargas reales.'
    )
  }
}

export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '').split('.')[0]
  } catch {
    return ''
  }
}
