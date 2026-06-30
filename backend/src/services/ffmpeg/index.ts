import { spawn, execSync } from 'node:child_process'

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

  static runSegment(
    inputPath: string,
    outputDir: string,
    segmentTime: number,
    mode: 'fast' | 'precise' = 'fast',
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const outputPattern = `${outputDir}/clip_%03d.mp4`

      if (mode === 'fast') {
        const proc = spawn(this.binary, [
          '-y',
          '-i', inputPath,
          '-c', 'copy',
          '-map', '0',
          '-f', 'segment',
          '-segment_time', String(segmentTime),
          '-reset_timestamps', '1',
          '-segment_format', 'mp4',
          outputPattern,
        ])
        let stderr = ''
        proc.stderr.on('data', (data: Buffer) => {
          stderr += data.toString()
        })
        proc.on('close', (code) => {
          if (code === 0) resolve()
          else reject(new Error(`FFmpeg segment failed (exit ${code}): ${stderr.slice(-500)}`))
        })
        proc.on('error', reject)
      } else {
        const clipDir = outputDir
        const duration = this.probeDuration(inputPath)
        const totalClips = Math.ceil(duration / segmentTime)

        let clipIndex = 0
        const runPrecise = () => {
          if (clipIndex >= totalClips) {
            resolve()
            return
          }

          const start = clipIndex * segmentTime
          const end = Math.min((clipIndex + 1) * segmentTime, duration)
          const filename = `${clipDir}/clip_${String(clipIndex).padStart(3, '0')}.mp4`

          const proc = spawn(this.binary, [
            '-y',
            '-i', inputPath,
            '-ss', formatTime(start),
            '-to', formatTime(end),
            '-c:v', 'libx264',
            '-c:a', 'aac',
            filename,
          ])

          let stderr = ''
          proc.stderr.on('data', (data: Buffer) => {
            stderr += data.toString()
          })

          proc.on('close', (code) => {
            if (code === 0) {
              clipIndex++
              setImmediate(runPrecise)
            } else {
              reject(new Error(`FFmpeg precise clip failed (exit ${code}): ${stderr.slice(-500)}`))
            }
          })

          proc.on('error', reject)
        }

        setImmediate(runPrecise)
      }
    })
  }
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
