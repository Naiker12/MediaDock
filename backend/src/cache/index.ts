import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, extname } from 'node:path'
import { createHash } from 'node:crypto'
import type { VideoInfo } from '../services/types.js'

const CACHE_DIR = join(process.cwd(), '.cache')
const CACHE_TTL = 10 * 60 * 1000 // 10 minutes
const CLEANUP_INTERVAL = 30 * 60 * 1000 // 30 minutes

interface CacheEntry {
  key: string
  data: VideoInfo
  timestamp: number
}

class VideoCache {
  private memory: Map<string, CacheEntry> = new Map()
  private cleanupTimer: ReturnType<typeof setInterval> | null = null

  constructor() {
    this.initCleanup()
    this.ensureCacheDir()
  }

  private async ensureCacheDir() {
    if (!existsSync(CACHE_DIR)) {
      await mkdir(CACHE_DIR, { recursive: true })
    }
  }

  private hashUrl(url: string): string {
    return createHash('sha256').update(url).digest('hex').slice(0, 16)
  }

  private filePath(key: string): string {
    return join(CACHE_DIR, `${key}.json`)
  }

  async get(url: string): Promise<VideoInfo | null> {
    const key = this.hashUrl(url)

    const memEntry = this.memory.get(key)
    if (memEntry && Date.now() - memEntry.timestamp < CACHE_TTL) {
      return memEntry.data
    }
    this.memory.delete(key)

    try {
      const filePath = this.filePath(key)
      if (!existsSync(filePath)) return null

      const content = await readFile(filePath, 'utf-8')
      const entry: CacheEntry = JSON.parse(content)

      if (Date.now() - entry.timestamp < CACHE_TTL) {
        this.memory.set(key, entry)
        return entry.data
      }

      await writeFile(filePath, JSON.stringify({ ...entry, timestamp: Date.now() }))
      return null
    } catch {
      return null
    }
  }

  async set(url: string, data: VideoInfo): Promise<void> {
    const key = this.hashUrl(url)
    const entry: CacheEntry = { key, data, timestamp: Date.now() }

    this.memory.set(key, entry)

    try {
      await writeFile(this.filePath(key), JSON.stringify(entry), 'utf-8')
    } catch {
      // Silent fail for cache write
    }
  }

  private initCleanup() {
    this.cleanupTimer = setInterval(() => {
      const now = Date.now()
      for (const [key, entry] of this.memory) {
        if (now - entry.timestamp > CACHE_TTL) {
          this.memory.delete(key)
        }
      }
    }, CLEANUP_INTERVAL)
  }

  destroy() {
    if (this.cleanupTimer) clearInterval(this.cleanupTimer)
  }
}

export const videoCache = new VideoCache()
