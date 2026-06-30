import { exec, spawn } from 'node:child_process'
import { promisify } from 'node:util'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { ExtractorError } from '../../extractor/types.js'

const execAsync = promisify(exec)

function getWingetPaths(): string[] {
  const local = process.env.LOCALAPPDATA || join(homedir(), 'AppData', 'Local')
  const base = join(local, 'Microsoft', 'WinGet', 'Packages')
  return [
    join(base, 'yt-dlp.yt-dlp_Microsoft.Winget.Source_8wekyb3d8bbwe', 'yt-dlp.exe'),
    join(base, 'yt-dlp.yt-dlp_Microsoft.Winget.Source_8wekyb3d8bbwe'),
    join(homedir(), 'AppData', 'Local', 'Microsoft', 'WinGet', 'Packages', 'yt-dlp.yt-dlp_Microsoft.Winget.Source_8wekyb3d8bbwe', 'yt-dlp.exe'),
    join(homedir(), 'AppData', 'Local', 'Microsoft', 'WinGet', 'Packages', 'yt-dlp.yt-dlp_Microsoft.Winget.Source_8wekyb3d8bbwe'),
  ]
}

function findBinary(): string {
  if (process.env.YT_DLP_PATH) {
    if (existsSync(process.env.YT_DLP_PATH)) return process.env.YT_DLP_PATH
    console.warn(`[yt-dlp] YT_DLP_PATH configurado pero no existe: ${process.env.YT_DLP_PATH}`)
  }

  for (const p of getWingetPaths()) {
    if (existsSync(p)) {
      const resolved = existsSync(p) && !p.endsWith('.exe')
        ? join(p, 'yt-dlp.exe')
        : p
      if (existsSync(resolved)) return resolved
      if (existsSync(p)) return p
    }
  }

  const pathDirs = (process.env.PATH || '').split(';')
  for (const dir of pathDirs) {
    const candidate = join(dir.trim(), 'yt-dlp.exe')
    if (existsSync(candidate)) return candidate
  }

  return 'yt-dlp'
}

export class YtDlp {
  static binary = findBinary()

  static async checkAvailable(): Promise<void> {
    try {
      await execAsync(`"${this.binary}" --version`, { timeout: 5000 })
    } catch {
      throw new ExtractorError(
        'yt-dlp no está instalado o no se encuentra en el servidor.',
        'YT_DLP_NOT_FOUND',
        503,
      )
    }
  }

  static async exec(args: string[]): Promise<string> {
    await this.checkAvailable()

    const cmd = `"${this.binary}" ${args.map(a => `"${a}"`).join(' ')}`
    const { stdout, stderr } = await execAsync(cmd, {
      maxBuffer: 1024 * 1024 * 50,
      timeout: 120000,
    })

    if (stderr) {
      const errStr = stderr.toString()
      if (errStr.includes('ERROR')) {
        throw this.parseError(errStr)
      }
      console.warn('[yt-dlp stderr]', errStr)
    }

    return stdout
  }

  static execStream(args: string[]): NodeJS.ReadableStream {
    const proc = spawn(this.binary, args, { stdio: ['ignore', 'pipe', 'pipe'] })

    proc.on('error', () => {
      proc.stdout.destroy()
      proc.stderr.destroy()
    })

    proc.stderr?.on('data', (data: Buffer) => {
      const msg = data.toString()
      if (msg.includes('ERROR')) {
        console.error('[yt-dlp]', msg.trim())
      }
    })

    return proc.stdout
  }

  private static parseError(stderr: string): Error {
    const lines = stderr.split('\n').filter(l => l.includes('ERROR'))
    const cleaned = lines.map(l => l.replace(/^.*ERROR:\s*/, '').trim()).filter(Boolean)
    const message = cleaned.join('. ') || 'Error desconocido al procesar el video'

    if (message.includes('Unsupported URL')) {
      return new ExtractorError(
        'Este sitio no es compatible con el extractor actual.',
        'UNSUPPORTED_SITE',
        400,
      )
    }

    return new ExtractorError(message, 'EXTRACTION_ERROR', 500)
  }
}
