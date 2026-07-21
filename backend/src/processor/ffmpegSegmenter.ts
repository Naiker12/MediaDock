import { readdir, rename, stat, unlink, rmdir } from 'node:fs/promises'
import { join } from 'node:path'
import { FFmpeg } from '../services/ffmpeg/index.js'
import { secondsToLabel, secondsToTimestamp } from '../utils/timeFormat.js'

export interface ClipInfo {
  index: number
  start: number
  end: number
  label: string
  filename: string
  sizeBytes: number
  durationSec: number
  thumbnailUrl?: string
}

export class FFMpegSegmenter {
  static async segment(
    inputPath: string,
    videoId: string,
    clipDuration: number,
    mode: 'fast' | 'precise',
  ): Promise<{ clips: ClipInfo[]; clipDir: string }> {
    const clipDir = join(process.cwd(), 'downloads', videoId, 'clips')
    const { mkdir, rm } = await import('node:fs/promises')
    await rm(clipDir, { recursive: true, force: true })
    await mkdir(clipDir, { recursive: true })

    const sourceDuration = FFmpeg.probeDuration(inputPath)
    const segResult = await FFmpeg.runSegment(inputPath, clipDir, clipDuration, mode)

    if (segResult.failedClips.length > 0) {
      console.warn(`[FFmpegSegmenter] ${segResult.failedClips.length} clips fallaron: ${segResult.failedClips.join(', ')}`)
    }

    let clips = await FFMpegSegmenter.labelClips(clipDir, clipDuration)

    if (clips.length > 0) {
      const lastClip = clips[clips.length - 1]
      const processedDuration = lastClip.end
      if (processedDuration < sourceDuration - 1) {
        console.warn(`[FFmpegSegmenter] Solo se procesaron ${Math.round(processedDuration / 60)} min de ${Math.round(sourceDuration / 60)} min totales.`)
      }
    }
    clips = await FFMpegSegmenter.generateClipThumbnails(clips, clipDir, videoId)

    return { clips, clipDir }
  }

  private static async labelClips(clipDir: string, clipDuration: number): Promise<ClipInfo[]> {
    const files = await readdir(clipDir)
    const mp4Files = files.filter(f => f.endsWith('.mp4')).sort((a, b) => {
      const numA = parseInt(a.match(/clip_(\d+)/)?.[1] || '0', 10)
      const numB = parseInt(b.match(/clip_(\d+)/)?.[1] || '0', 10)
      return numA - numB
    })

    const clips: ClipInfo[] = []
    let currentTime = 0
    let reindex = 0

    for (let i = 0; i < mp4Files.length; i++) {
      const oldName = mp4Files[i]
      const oldPath = join(clipDir, oldName)

      let stats
      try {
        stats = await stat(oldPath)
      } catch {
        console.warn(`[FFmpegSegmenter] No se pudo leer ${oldName}, saltando.`)
        continue
      }

      if (stats.size === 0) {
        console.warn(`[FFmpegSegmenter] ${oldName} está vacío (0 bytes), eliminando.`)
        await unlink(oldPath).catch(() => {})
        continue
      }

      const actualDuration = FFmpeg.probeDurationSafe(oldPath)
      if (actualDuration === null || actualDuration < 0.1) {
        console.warn(`[FFmpegSegmenter] ${oldName} tiene duración inválida (${actualDuration}), eliminando.`)
        await unlink(oldPath).catch(() => {})
        continue
      }

      const start = currentTime
      currentTime += actualDuration
      const end = currentTime
      reindex++

      const labelStart = secondsToTimestamp(start)
      const labelEnd = secondsToTimestamp(end)
      const newName = `clip_${String(reindex).padStart(3, '0')}_${secondsToLabel(start)}-${secondsToLabel(end)}.mp4`
      const newPath = join(clipDir, newName)

      if (oldName !== newName) {
        await rename(oldPath, newPath)
      }

      clips.push({
        index: reindex,
        start: Math.floor(start),
        end: Math.floor(end),
        label: `${labelStart} - ${labelEnd}`,
        filename: newName,
        sizeBytes: stats.size,
        durationSec: Math.floor(actualDuration),
      })
    }

    return clips
  }

  private static async generateClipThumbnails(
    clips: ClipInfo[],
    clipDir: string,
    videoId: string,
  ): Promise<ClipInfo[]> {
    const results: ClipInfo[] = []
    const queue = [...clips]
    const running = new Set<Promise<void>>()
    const concurrency = 4

    const processOne = async (clip: ClipInfo) => {
      try {
        const clipPath = join(clipDir, clip.filename)
        const thumbFilename = clip.filename.replace('.mp4', '.jpg')
        const thumbPath = join(clipDir, thumbFilename)
        const thirdPoint = Math.floor(clip.durationSec / 3)
        const seekTime = Math.min(
          thirdPoint >= 1 ? thirdPoint : 0.5,
          Math.max(0.5, clip.durationSec - 0.5),
        )

        await FFMpegSegmenter.generateThumbnail(clipPath, thumbPath, seekTime)

        results.push({
          ...clip,
          thumbnailUrl: `/api/clip/${videoId}/${thumbFilename}`,
        })
      } catch {
        results.push(clip)
      }
    }

    const startNext = () => {
      while (running.size < concurrency && queue.length > 0) {
        const clip = queue.shift()!
        const p = processOne(clip).finally(() => {
          running.delete(p)
          startNext()
        })
        running.add(p)
      }
    }

    startNext()

    if (running.size > 0) {
      await Promise.all([...running])
    }

    return results
  }

  static async generateThumbnail(clipPath: string, thumbPath: string, seekTime = 1): Promise<void> {
    const { spawn } = await import('node:child_process')
    return new Promise((resolve, reject) => {
      const proc = spawn(FFmpeg.ffprobeBinary.replace('ffprobe', 'ffmpeg'), [
        '-y',
        '-ss', String(seekTime),
        '-i', clipPath,
        '-frames:v', '1',
        '-q:v', '5',
        thumbPath,
      ])
      proc.on('close', (code) => {
        if (code === 0) resolve()
        else reject(new Error(`Thumbnail generation failed with code ${code}`))
      })
      proc.on('error', reject)
    })
  }

  static async cleanup(videoId: string): Promise<void> {
    const { rm } = await import('node:fs/promises')
    const sourcePath = join(process.cwd(), 'downloads', videoId, 'source.mp4')
    try {
      await unlink(sourcePath)
    } catch {
      // source may already be deleted
    }
  }
}
