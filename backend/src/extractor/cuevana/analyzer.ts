import * as cheerio from 'cheerio'
import type { CheerioAPI } from 'cheerio'

export interface PageMetadata {
  title: string
  thumbnail: string
  description: string
  year?: number
  season?: number
  episode?: number
}

export function analyzePage(html: string, url: string): PageMetadata {
  const $ = cheerio.load(html)
  const title = extractTitle($)
  const thumbnail = extractThumbnail($)
  const description = extractDescription($)
  const year = extractYear($)
  const se = extractSeasonEpisode($, url)
  return { title, thumbnail, description, year, ...se }
}

function extractTitle($: CheerioAPI): string {
  const og = $('meta[property="og:title"]').attr('content')
  if (og) return cleanTitle(og)

  const title = $('title').text()
  if (title) return cleanTitle(title)

  const h1 = $('h1').first().text()
  if (h1) return cleanTitle(h1)

  return 'Video sin título'
}

function cleanTitle(raw: string): string {
  return raw.replace(/\s*[-|]\s*.+$/, '').trim()
}

function extractThumbnail($: CheerioAPI): string {
  const og = $('meta[property="og:image"]').attr('content')
  if (og) return og

  const twitter = $('meta[name="twitter:image"]').attr('content')
  if (twitter) return twitter

  const poster = $('img.poster, img.thumbnail, img.cover, img.featured').first().attr('src')
  if (poster) return poster

  const anyImg = $('article img, .entry-content img, .post img').first().attr('src')
  return anyImg || ''
}

function extractDescription($: CheerioAPI): string {
  const og = $('meta[property="og:description"]').attr('content')
  if (og) return og

  const meta = $('meta[name="description"]').attr('content')
  if (meta) return meta

  return ''
}

function extractYear($: CheerioAPI): number | undefined {
  const text = $('body').text()
  const match = /\b(19\d{2}|20\d{2})\b/.exec(text)
  return match ? parseInt(match[1]) : undefined
}

function extractSeasonEpisode($: CheerioAPI, url: string): { season?: number; episode?: number } {
  const result: { season?: number; episode?: number } = {}
  const text = $('body').text()

  const urlSE = /(?:temporada|season|temp)[\s-]*(\d+).*?(?:episodio|episode|capitulo|cap|ep)[\s-]*(\d+)/i.exec(url + ' ' + text)
  if (urlSE) {
    result.season = parseInt(urlSE[1])
    result.episode = parseInt(urlSE[2])
    return result
  }

  const urlX = /[-\/](\d+)x(\d+)/i.exec(url)
  if (urlX) {
    result.season = parseInt(urlX[1])
    result.episode = parseInt(urlX[2])
    return result
  }

  const s = /(?:temporada|season|temp)[:\s]*(\d+)/i.exec(text)
  const e = /(?:episodio|episode|capitulo|cap|ep)[:\s]*(\d+)/i.exec(text)
  if (s) result.season = parseInt(s[1])
  if (e) result.episode = parseInt(e[1])

  return result
}
