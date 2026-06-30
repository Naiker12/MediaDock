import type { VideoInfo } from '../services/types.js'

export interface ExtractResult {
  info: VideoInfo
  raw?: unknown
}

export interface Extractor {
  readonly name: string
  canHandle(url: string): boolean
  extract(url: string): Promise<ExtractResult>
  download(url: string, qualityId: string): Promise<NodeJS.ReadableStream>
}

export class ExtractorError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 500,
  ) {
    super(message)
    this.name = 'ExtractorError'
  }
}
