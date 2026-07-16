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
      const duration = this.probeDuration(inputPath)
      const totalClips = Math.ceil(duration / segmentTime)
      let clipIndex = 0

      const runClip = () => {
        if (clipIndex >= totalClips) {
          resolve()
          return
        }

        const start = clipIndex * segmentTime
        const filename = `${outputDir}/clip_${String(clipIndex + 1).padStart(3, '0')}.mp4`

        const args = mode === 'fast'
          ? [
              '-y',
              '-ss', formatTime(start),
              '-i', inputPath,
              '-t', formatTime(segmentTime),
              '-c', 'copy',
              '-avoid_negative_ts', 'make_zero',
              filename,
            ]
          : [
              '-y',
              '-ss', formatTime(start),
              '-i', inputPath,
              '-t', formatTime(segmentTime),
              '-c:v', 'libx264',
              '-c:a', 'aac',
              filename,
            ]

        const proc = spawn(this.binary, args)
        let stderr = ''
        proc.stderr.on('data', (data: Buffer) => {
          stderr += data.toString()
        })

        proc.on('close', (code) => {
          if (code === 0) {
            clipIndex++
            setImmediate(runClip)
          } else {
            reject(new Error(`FFmpeg ${mode} clip ${clipIndex + 1} failed (exit ${code}): ${stderr.slice(-500)}`))
          }
        })

        proc.on('error', reject)
      }

      setImmediate(runClip)
    })
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
