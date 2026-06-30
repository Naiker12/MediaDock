import type { Extractor, ExtractResult } from './types.js'

export class ExtractorRegistry {
  private extractors: Extractor[] = []

  register(extractor: Extractor): void {
    this.extractors.push(extractor)
  }

  getExtractor(url: string): Extractor | null {
    return this.extractors.find(e => e.canHandle(url)) || null
  }

  async extract(url: string): Promise<ExtractResult> {
    const extractor = this.getExtractor(url)
    if (!extractor) {
      throw new Error(`No hay extractor disponible para esta URL: ${url}`)
    }
    return extractor.extract(url)
  }

  async download(url: string, qualityId: string): Promise<NodeJS.ReadableStream> {
    const extractor = this.getExtractor(url)
    if (!extractor) {
      throw new Error('No hay extractor disponible para descargar esta URL')
    }
    return extractor.download(url, qualityId)
  }
}

export const extractorRegistry = new ExtractorRegistry()
