import { join } from 'node:path'
import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { extractorRegistry, YtDlpExtractor, DemoExtractor } from '../extractor/index.js'
import { YtDlp } from './yt-dlp/index.js'
import { videoCache } from '../cache/index.js'

const require = createRequire(import.meta.url)
const archiver = require('archiver')
import { FFMpegSegmenter, type ClipInfo } from '../processor/ffmpegSegmenter.js'

let initialized = false

async function ensureInit(): Promise<void> {
  if (initialized) return
  initialized = true

  try {
    await YtDlp.checkAvailable()
    extractorRegistry.register(new YtDlpExtractor())
    console.log('[ClipService] yt-dlp disponible')
  } catch {
    console.warn('[ClipService] yt-dlp no disponible, usando extractor demo')
    extractorRegistry.register(new DemoExtractor())
  }
}

export interface ClipResult {
  videoId: string
  totalClips: number
  clipDuration: number
  clips: ClipInfo[]
  zipUrl: string
}

export interface ClipJob {
  jobId: string
  status: 'processing' | 'done' | 'error'
  stage: 'preparing' | 'downloading' | 'segmenting' | 'finalizing' | 'done'
  clipsGenerated: number
  totalClips?: number
  clips: ClipInfo[]
  result?: ClipResult
  error?: string
}

const jobs = new Map<string, ClipJob>()

function createJob(): ClipJob {
  const job: ClipJob = {
    jobId: `clip_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    status: 'processing', stage: 'preparing', clipsGenerated: 0, clips: [],
  }
  jobs.set(job.jobId, job)
  return job
}

export class ClipService {
  static startUrlJob(url: string, qualityId?: string, clipDuration = 120, mode: 'fast' | 'precise' = 'fast'): ClipJob {
    const job = createJob()
    void this.generateClips(url, qualityId, clipDuration, mode, (event) => this.updateJob(job, event))
      .then((result) => Object.assign(job, { status: 'done' as const, stage: 'done' as const, result, clips: result.clips, clipsGenerated: result.clips.length }))
      .catch((error: unknown) => Object.assign(job, { status: 'error' as const, error: error instanceof Error ? error.message : 'No se pudieron generar los clips' }))
    return job
  }

  static startLocalJob(inputPath: string, originalName: string, clipDuration = 120, mode: 'fast' | 'precise' = 'fast'): ClipJob {
    const job = createJob()
    void this.clipLocalFile(inputPath, originalName, clipDuration, mode, (event) => this.updateJob(job, event))
      .then((result) => Object.assign(job, { status: 'done' as const, stage: 'done' as const, result, clips: result.clips, clipsGenerated: result.clips.length }))
      .catch((error: unknown) => Object.assign(job, { status: 'error' as const, error: error instanceof Error ? error.message : 'No se pudieron generar los clips' }))
    return job
  }

  static getJob(jobId: string): ClipJob | null {
    return jobs.get(jobId) || null
  }

  private static updateJob(job: ClipJob, event: { stage: ClipJob['stage']; clip?: ClipInfo; total?: number }) {
    job.stage = event.stage
    if (event.total) job.totalClips = event.total
    if (event.clip && !job.clips.some((clip) => clip.index === event.clip!.index)) {
      job.clips = [...job.clips, event.clip]
      job.clipsGenerated = job.clips.length
    }
  }

  static async clipLocalFile(
    inputPath: string,
    originalName: string,
    clipDuration: number = 120,
    mode: 'fast' | 'precise' = 'fast',
    onProgress?: (event: { stage: ClipJob['stage']; clip?: ClipInfo; total?: number }) => void,
  ): Promise<ClipResult> {
    const videoId = `upload_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const downloadDir = join(process.cwd(), 'downloads', videoId)
    const sourcePath = join(downloadDir, 'source.mp4')

    if (!existsSync(downloadDir)) {
      await mkdir(downloadDir, { recursive: true })
    }

    const { rename } = await import('node:fs/promises')
    await rename(inputPath, sourcePath)

    onProgress?.({ stage: 'segmenting' })
    const { clips } = await FFMpegSegmenter.segment(sourcePath, videoId, clipDuration, mode, (clip, total) => onProgress?.({ stage: 'segmenting', clip, total }))
    onProgress?.({ stage: 'finalizing' })
    await FFMpegSegmenter.cleanup(videoId)

    return {
      videoId,
      totalClips: clips.length,
      clipDuration,
      clips,
      zipUrl: `/api/clip/${videoId}/download-all`,
    }
  }

  static async generateClips(
    url: string,
    qualityId?: string,
    clipDuration: number = 120,
    mode: 'fast' | 'precise' = 'fast',
    onProgress?: (event: { stage: ClipJob['stage']; clip?: ClipInfo; total?: number }) => void,
  ): Promise<ClipResult> {
    onProgress?.({ stage: 'preparing' })
    await ensureInit()

    const cached = await videoCache.get(url)
    let videoInfo = cached
    if (!videoInfo) {
      const result = await extractorRegistry.extract(url)
      videoInfo = result.info
      await videoCache.set(url, videoInfo)
    }

    const videoId = videoInfo.id
    const downloadDir = join(process.cwd(), 'downloads', videoId)
    const sourcePath = join(downloadDir, 'source.mp4')
    const clipDir = join(downloadDir, 'clips')

    if (!existsSync(downloadDir)) {
      await mkdir(downloadDir, { recursive: true })
    }

    const format = qualityId
      ? (/^\d+$/.test(qualityId) ? qualityId : getFormatForQuality(qualityId))
      : 'bestvideo+bestaudio/best'

    onProgress?.({ stage: 'downloading' })
    console.log(`[ClipService] Downloading full video to ${sourcePath}`)
    await YtDlp.exec(['-f', format, '-o', sourcePath, url])

    onProgress?.({ stage: 'segmenting' })
    const { clips } = await FFMpegSegmenter.segment(sourcePath, videoId, clipDuration, mode, (clip, total) => onProgress?.({ stage: 'segmenting', clip, total }))
    onProgress?.({ stage: 'finalizing' })

    await FFMpegSegmenter.cleanup(videoId)

    return {
      videoId,
      totalClips: clips.length,
      clipDuration,
      clips,
      zipUrl: `/api/clip/${videoId}/download-all`,
    }
  }

  static async getClipFile(videoId: string, filename: string): Promise<string | null> {
    const filePath = join(process.cwd(), 'downloads', videoId, 'clips', filename)
    if (!existsSync(filePath)) return null
    return filePath
  }

  static async generateZip(videoId: string): Promise<{ path: string; filename: string } | null> {
    const clipDir = join(process.cwd(), 'downloads', videoId, 'clips')
    if (!existsSync(clipDir)) return null

    const { createWriteStream } = await import('node:fs')
    const { readdir } = await import('node:fs/promises')

    const zipPath = join(clipDir, 'clips.zip')
    const output = createWriteStream(zipPath)
    const archive = archiver('zip', { zlib: { level: 5 } })

    return new Promise((resolve, reject) => {
      output.on('close', () => {
        resolve({ path: zipPath, filename: `${videoId}-clips.zip` })
      })
      archive.on('error', reject)

      archive.pipe(output)

      readdir(clipDir).then(files => {
        const clips = files.filter(f => f.endsWith('.mp4')).sort()
        for (const clip of clips) {
          archive.file(join(clipDir, clip), { name: clip })
        }
        archive.finalize()
      }).catch(reject)
    })
  }

  static async getClipStatus(videoId: string): Promise<{
    status: 'processing' | 'done' | 'not_found'
    clipsGenerated?: number
    totalClips?: number
  }> {
    const clipDir = join(process.cwd(), 'downloads', videoId, 'clips')
    if (!existsSync(clipDir)) {
      return { status: 'not_found' }
    }
    const { readdir } = await import('node:fs/promises')
    const files = await readdir(clipDir)
    const clips = files.filter(f => f.endsWith('.mp4'))
    return {
      status: clips.length > 0 ? 'done' : 'processing',
      clipsGenerated: clips.length,
    }
  }
}

function getFormatForQuality(qualityId: string): string {
  const map: Record<string, string> = {
    '2160p': 'bestvideo[height<=2160]+bestaudio/best[height<=2160]',
    '1440p': 'bestvideo[height<=1440]+bestaudio/best[height<=1440]',
    '1080p': 'bestvideo[height<=1080]+bestaudio/best[height<=1080]',
    '720p': 'bestvideo[height<=720]+bestaudio/best[height<=720]',
    '480p': 'bestvideo[height<=480]+bestaudio/best[height<=480]',
    '360p': 'bestvideo[height<=360]+bestaudio/best[height<=360]',
    'Audio': 'bestaudio/best',
  }
  return map[qualityId] || 'bestvideo+bestaudio/best'
}
