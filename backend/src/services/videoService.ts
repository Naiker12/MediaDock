import { videoCache } from '../cache/index.js'
import {
  extractorRegistry,
  YtDlpExtractor,
  CuevanaExtractor,
  DemoExtractor,
} from '../extractor/index.js'
import { YtDlp } from './yt-dlp/index.js'
import type { AnalyzeResult } from './types.js'

let initialized = false

async function ensureInit(): Promise<void> {
  if (initialized) return
  initialized = true

  extractorRegistry.register(new CuevanaExtractor())

  try {
    await YtDlp.checkAvailable()
    extractorRegistry.register(new YtDlpExtractor())
    console.log('[VideoService] yt-dlp disponible')
  } catch {
    console.warn('[VideoService] yt-dlp no disponible, usando extractor demo')
    console.warn('[VideoService] Las descargas reales solo funcionarán con yt-dlp instalado')
    extractorRegistry.register(new DemoExtractor())
  }
}

export class VideoService {
  static async analyze(url: string): Promise<AnalyzeResult> {
    await ensureInit()

    const cached = await videoCache.get(url)
    if (cached) {
      return { info: cached, cached: true }
    }

    const result = await extractorRegistry.extract(url)

    await videoCache.set(url, result.info)

    return { info: result.info, cached: false }
  }

  static async download(url: string, qualityId: string): Promise<NodeJS.ReadableStream> {
    await ensureInit()
    return extractorRegistry.download(url, qualityId)
  }
}
