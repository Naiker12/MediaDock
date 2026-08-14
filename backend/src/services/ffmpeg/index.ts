import { join } from 'node:path'
import { spawn, execSync } from 'node:child_process'

export interface SegmentResult {
  totalExpected: number
  generated: number
  failedClips: number[]
}

export interface SegmentProgress {
  index: number
  total: number
  start: number
  duration: number
  outputPath: string
}

export class FFmpeg {
  static binary = process.env.FFMPEG_PATH || 'ffmpeg'
  static ffprobeBinary = process.env.FFPROBE_PATH || 'ffprobe'

  static convert(input: NodeJS.ReadableStream, args: string[]): NodeJS.ReadableStream {
    const proc = spawn(this.binary, [
      '-i', 'pipe:0',
      ...args,
      '-f', 'mp4',
      'pipe:1',
    ])
    input.pipe(proc.stdin)
    proc.stderr.on('data', (data: Buffer) => {
      console.warn('[ffmpeg stderr]', data.toString())
    })
    return proc.stdout
  }

  static convertUrl(inputUrl: string, args: string[] = []): NodeJS.ReadableStream {
    const proc = spawn(this.binary, [
      '-i', inputUrl,
      '-c', 'copy',
      ...args,
      '-f', 'mp4',
      'pipe:1',
    ])
    proc.stderr.on('data', (data: Buffer) => {
      console.warn('[ffmpeg stderr]', data.toString())
    })
    proc.on('error', () => {
      proc.stdout.destroy()
    })
    return proc.stdout
  }

  static probeDuration(inputPath: string): number {
    const cmd = `"${this.ffprobeBinary}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${inputPath}"`
    const output = execSync(cmd, { timeout: 10000, encoding: 'utf-8' })
    const seconds = parseFloat(output.trim())
    if (isNaN(seconds)) {
      throw new Error(`ffprobe returned invalid duration: ${output.trim()}`)
    }
    return seconds
  }

  static probeDurationSafe(inputPath: string): number | null {
    try {
      return this.probeDuration(inputPath)
    } catch {
      return null
    }
  }

  private static buildArgs(
    inputPath: string,
    outputPath: string,
    start: number,
    duration: number,
    mode: 'fast' | 'precise',
  ): string[] {
    const base = [
      '-y',
      '-ss', formatTime(start),
      '-i', inputPath,
      '-t', formatTime(duration),
    ]
    if (mode === 'fast') {
      return [...base, '-c', 'copy', '-avoid_negative_ts', 'make_zero', outputPath]
    }
    return [...base, '-c:v', 'libx264', '-c:a', 'aac', outputPath]
  }

  private static runSingleClip(
    inputPath: string,
    outputPath: string,
    start: number,
    duration: number,
    mode: 'fast' | 'precise',
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const args = this.buildArgs(inputPath, outputPath, start, duration, mode)
      const proc = spawn(this.binary, args)
      let stderr = ''
      proc.stderr.on('data', (data: Buffer) => {
        stderr += data.toString()
      })
      proc.on('close', (code) => {
        if (code === 0) {
          resolve(true)
        } else {
          console.warn(`[FFmpeg] clip at ${formatTime(start)} failed (${mode}, exit ${code}): ${stderr.slice(-300)}`)
          resolve(false)
        }
      })
      proc.on('error', (err) => {
        console.warn(`[FFmpeg] clip at ${formatTime(start)} spawn error: ${err.message}`)
        resolve(false)
      })
    })
  }

  static async runSegment(
    inputPath: string,
    outputDir: string,
    segmentTime: number,
    mode: 'fast' | 'precise' = 'fast',
    onClipGenerated?: (progress: SegmentProgress) => void | Promise<void>,
  ): Promise<SegmentResult> {
    const duration = this.probeDuration(inputPath)
    const totalClips = Math.ceil(duration / segmentTime)
    const failedClips: number[] = []

    for (let i = 0; i < totalClips; i++) {
      const clipNum = i + 1
      const start = i * segmentTime
      const outputPath = join(outputDir, `clip_${String(clipNum).padStart(3, '0')}.mp4`)

      let ok = await this.runSingleClip(inputPath, outputPath, start, segmentTime, mode)

      if (!ok && mode === 'fast') {
        console.log(`[FFmpeg] Retrying clip ${clipNum} at ${formatTime(start)} in precise mode...`)
        ok = await this.runSingleClip(inputPath, outputPath, start, segmentTime, 'precise')
      }

      if (!ok) {
        failedClips.push(clipNum)
        console.warn(`[FFmpeg] Clip ${clipNum} (${formatTime(start)}) failed in both modes, skipping.`)
      } else {
        await onClipGenerated?.({ index: clipNum, total: totalClips, start, duration: Math.min(segmentTime, duration - start), outputPath })
      }
    }

    return { totalExpected: totalClips, generated: totalClips - failedClips.length, failedClips }
  }
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const sInt = Math.floor(s)
  const sFrac = s - sInt
  const sStr = sFrac > 0.001
    ? `${String(sInt).padStart(2, '0')}.${Math.round(sFrac * 1000)}`
    : `${String(sInt).padStart(2, '0')}`
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${sStr}`
}
