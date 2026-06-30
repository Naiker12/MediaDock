export interface PlatformInfo {
  id: string
  name: string
  emoji: string
  color: string
  bg: string
  border: string
  domains: string[]
}

export const PLATFORMS: PlatformInfo[] = [
  { id: 'youtube', name: 'YouTube', emoji: '▶️', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30', domains: ['youtube.com', 'youtu.be'] },
  { id: 'tiktok', name: 'TikTok', emoji: '🎵', color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/30', domains: ['tiktok.com'] },
  { id: 'instagram', name: 'Instagram', emoji: '📷', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', domains: ['instagram.com'] },
  { id: 'facebook', name: 'Facebook', emoji: '👍', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30', domains: ['facebook.com', 'fb.watch'] },
  { id: 'vimeo', name: 'Vimeo', emoji: '🔵', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/30', domains: ['vimeo.com'] },
  { id: 'twitter', name: 'X', emoji: '🐦', color: 'text-zinc-300', bg: 'bg-zinc-300/10', border: 'border-zinc-300/30', domains: ['twitter.com', 'x.com'] },
  { id: 'twitch', name: 'Twitch', emoji: '🎮', color: 'text-purple-600', bg: 'bg-purple-600/10', border: 'border-purple-600/30', domains: ['twitch.tv'] },
  { id: 'kick', name: 'Kick', emoji: '⏩', color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/30', domains: ['kick.com'] },
]

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export function formatSize(bytes: number): string {
  if (!bytes) return 'N/A'
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let i = 0
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024
    i++
  }
  return `${value.toFixed(i > 0 ? 1 : 0)} ${units[i]}`
}

export function formatBitrate(bitrate: number): string {
  if (!bitrate) return 'N/A'
  if (bitrate >= 1000000) return `${(bitrate / 1000000).toFixed(1)} Mbps`
  if (bitrate >= 1000) return `${(bitrate / 1000).toFixed(0)} kbps`
  return `${bitrate} bps`
}

export function formatResolution(width: number, height: number): string {
  if (!width || !height) return 'N/A'
  return `${width}x${height}`
}

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

export function extractDomain(url: string): string {
  try { return new URL(url).hostname.replace('www.', '') }
  catch { return url }
}

export function parseUploadDate(date: string): string {
  if (!date || date.length < 8) return ''
  const y = date.slice(0, 4)
  const m = date.slice(4, 6)
  const d = date.slice(6, 8)
  return `${d}/${m}/${y}`
}

export function detectPlatform(url: string): PlatformInfo | null {
  const domain = extractDomain(url)
  return PLATFORMS.find(p => p.domains.some(d => domain.includes(d))) || null
}

export function guessPlatformFromText(text: string): PlatformInfo | null {
  const lower = text.toLowerCase()
  return PLATFORMS.find(p =>
    p.domains.some(d => lower.includes(d))
  ) || null
}
