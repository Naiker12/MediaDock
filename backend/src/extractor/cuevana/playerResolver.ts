import * as cheerio from 'cheerio'
import type { CheerioAPI } from 'cheerio'

export interface StreamInfo {
  url: string
  type: 'mp4' | 'm3u8' | 'direct'
}

export function findStreams(html: string, baseUrl: string): StreamInfo[] {
  const found: StreamInfo[] = []
  const $ = cheerio.load(html)
  const seen = new Set<string>()

  function add(url: string, type: StreamInfo['type']) {
    try {
      const resolved = url.startsWith('http') ? url : new URL(url, baseUrl).href
      if (!seen.has(resolved)) {
        seen.add(resolved)
        found.push({ url: resolved, type })
      }
    } catch { /* skip invalid */ }
  }

  // <video> and <source> tags
  $('video source[src]').each((_, el) => add($(el).attr('src')!, 'mp4'))
  $('video[src]').each((_, el) => add($(el).attr('src')!, 'mp4'))
  $('source[src][type*="mp4"]').each((_, el) => add($(el).attr('src')!, 'mp4'))
  $('source[src][type*="m3u8"]').each((_, el) => add($(el).attr('src')!, 'm3u8'))
  $('source[src][type*="application/x-mpegURL"]').each((_, el) => add($(el).attr('src')!, 'm3u8'))

  // data attributes (common in JS players)
  $('[data-url]').each((_, el) => {
    const val = $(el).attr('data-url')!
    if (val.includes('.m3u8')) add(val, 'm3u8')
    else if (val.includes('.mp4')) add(val, 'mp4')
    else add(val, 'direct')
  })
  $('[data-src]').each((_, el) => {
    const val = $(el).attr('data-src')!
    if (val.includes('.m3u8')) add(val, 'm3u8')
    else if (val.includes('.mp4')) add(val, 'mp4')
  })
  $('[data-file]').each((_, el) => {
    const val = $(el).attr('data-file')!
    if (val.includes('.m3u8')) add(val, 'm3u8')
    else if (val.includes('.mp4')) add(val, 'mp4')
  })

  // JSON-LD
  $('script[type="application/json"]').each((_, el) => {
    try {
      const parsed = JSON.parse($(el).html() || '{}')
      crawlJson(parsed, baseUrl, add)
    } catch { /* skip */ }
  })

  // Inline scripts with URL patterns
  $('script').each((_, el) => {
    const text = $(el).html() || ''
    const urlPatterns = [
      /(https?:\/\/[^"'\s<>]+\.(?:m3u8|mp4)[^"'\s<>]*)/gi,
      /["'](https?:\/\/[^"']*(?:video|stream|play|embed|file)[^"']*\.(?:php|html)[^"']*)["']/gi,
    ]
    for (const pattern of urlPatterns) {
      let m: RegExpExecArray | null
      while ((m = pattern.exec(text)) !== null) {
        const matchedUrl = m[0].replace(/^["']|["']$/g, '')
        if (matchedUrl.includes('.m3u8')) add(matchedUrl, 'm3u8')
        else if (matchedUrl.includes('.mp4')) add(matchedUrl, 'mp4')
        else add(matchedUrl, 'direct')
      }
    }
  })

  return found
}

function crawlJson(obj: unknown, baseUrl: string, add: (url: string, type: StreamInfo['type']) => void): void {
  if (typeof obj === 'string') {
    if (obj.startsWith('http') && (obj.includes('.m3u8') || obj.includes('.mp4'))) {
      add(obj, obj.includes('.m3u8') ? 'm3u8' : 'mp4')
    }
  } else if (Array.isArray(obj)) {
    for (const item of obj) crawlJson(item, baseUrl, add)
  } else if (obj && typeof obj === 'object') {
    for (const val of Object.values(obj as Record<string, unknown>)) {
      crawlJson(val, baseUrl, add)
    }
  }
}
