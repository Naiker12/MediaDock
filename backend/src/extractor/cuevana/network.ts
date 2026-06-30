import { get } from 'node:https'
import { get as httpGet } from 'node:http'

const BROWSER_HEADERS: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
  'Accept-Encoding': 'gzip, deflate',
  'DNT': '1',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
}

export function fetchUrl(url: string, referer = ''): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? get : httpGet
    const headers: Record<string, string> = { ...BROWSER_HEADERS }
    if (referer) headers['Referer'] = referer

    client(url, { headers, timeout: 20000 }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirect = new URL(res.headers.location, url).href
        fetchUrl(redirect, url).then(resolve).catch(reject)
        return
      }
      if (!res.statusCode || res.statusCode >= 400) {
        reject(Object.assign(new Error(`HTTP ${res.statusCode}`), { status: res.statusCode }))
        return
      }
      let data = ''
      res.on('data', (chunk: Buffer) => { data += chunk.toString() })
      res.on('end', () => resolve(data))
    })
      .on('error', reject)
      .on('timeout', function (this: import('node:http').ClientRequest) { this.destroy(); reject(new Error('Timeout')) })
  })
}

export function streamFromUrl(url: string): Promise<NodeJS.ReadableStream> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? get : httpGet
    client(url, {
      headers: { ...BROWSER_HEADERS, 'Referer': url },
      timeout: 30000,
    }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirect = new URL(res.headers.location, url).href
        streamFromUrl(redirect).then(resolve).catch(reject)
        return
      }
      if (!res.statusCode || res.statusCode >= 400) {
        reject(new Error(`HTTP ${res.statusCode}`))
        return
      }
      resolve(res as unknown as NodeJS.ReadableStream)
    }).on('error', reject)
  })
}
