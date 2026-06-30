import { spawn } from 'node:child_process'

export class FFmpeg {
  static binary = process.env.FFMPEG_PATH || 'ffmpeg'

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
}
