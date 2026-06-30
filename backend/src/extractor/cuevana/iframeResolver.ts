import * as cheerio from 'cheerio'
import type { CheerioAPI } from 'cheerio'
import { fetchUrl } from './network.js'

export interface IframeResult {
  src: string
  html?: string
}

export async function resolveIframes(html: string, baseUrl: string, depth = 2): Promise<IframeResult[]> {
  const results: IframeResult[] = []
  const $ = cheerio.load(html)

  const iframes: string[] = []
  $('iframe').each((_, el) => {
    const src = $(el).attr('src')
    if (src) iframes.push(src)
  })
  $('embed').each((_, el) => {
    const src = $(el).attr('src')
    if (src) iframes.push(src)
  })

  for (const src of iframes.slice(0, 5)) {
    try {
      const resolved = src.startsWith('http') ? src : new URL(src, baseUrl).href
      const iframeHtml = await fetchUrl(resolved, baseUrl)
      results.push({ src: resolved, html: iframeHtml })

      if (depth > 1 && iframeHtml.length > 100) {
        const nested = await resolveIframes(iframeHtml, resolved, depth - 1)
        results.push(...nested)
      }
    } catch {
      continue
    }
  }

  return results
}
