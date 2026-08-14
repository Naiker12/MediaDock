import type { VideoInfo, VideoQuality } from '../services/types.js'
import type { RawYtDlpOutput } from '../extractor/yt-dlp.js'

function parseDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

function getBestThumbnail(raw: RawYtDlpOutput): string {
  if (raw.thumbnails?.length) {
    const sorted = [...raw.thumbnails].sort((a, b) => (b.height || 0) - (a.height || 0))
    return sorted[0].url
  }
  return raw.thumbnail || ''
}

function getHDThumbnail(raw: RawYtDlpOutput): string | undefined {
  const hd = raw.thumbnails?.find(t => (t.height || 0) >= 720)
  return hd?.url
}

function mapQualities(raw: RawYtDlpOutput): VideoQuality[] {
  if (!raw.formats?.length) return []

  const seen = new Set<string>()
  const qualities: VideoQuality[] = []

  const videoFormats = raw.formats.filter(f => f.vcodec !== 'none' && f.height)

  videoFormats.sort((a, b) => (b.height || 0) - (a.height || 0))

  for (const f of videoFormats) {
    if (!f.height) continue
    const height = f.height <= 360 ? 360 : f.height <= 480 ? 480 : f.height <= 720 ? 720 : f.height <= 1080 ? 1080 : f.height <= 1440 ? 1440 : 2160
    const label = height >= 1000 ? `${height / 1000}k` : `${height}p`
    if (seen.has(label)) continue
    seen.add(label)

    const filesize = f.filesize || f.filesize_approx || 0
    const isBest = qualities.length === 0
    const isHDR = f.dynamic_range === 'HDR' || f.dynamic_range === 'HDR10' || f.dynamic_range === 'HLG' || false

    qualities.push({
      id: f.format_id,
      label,
      extension: f.ext || 'mp4',
      codec: f.vcodec?.startsWith('av01') ? 'AV1' : f.vcodec?.startsWith('vp09') ? 'VP9' : f.vcodec?.startsWith('vp9') ? 'VP9' : f.vcodec || 'H.264',
      fps: f.fps || 30,
      width: f.width || 0,
      height: f.height || 0,
      bitrate: Math.round((f.tbr || 0) * 1000),
      filesize,
      audioCodec: f.acodec === 'none' ? 'N/A' : f.acodec || 'AAC',
      audioBitrate: f.audio_bitrate || 0,
      isHDR,
      isBest,
    })
  }

  const audioFormat = raw.formats.find(f => f.vcodec === 'none' && f.acodec !== 'none')
  if (audioFormat) {
    qualities.push({
      id: audioFormat.format_id,
      label: 'Audio',
      extension: audioFormat.ext || 'm4a',
      codec: audioFormat.acodec || 'AAC',
      fps: 0,
      width: 0,
      height: 0,
      bitrate: Math.round((audioFormat.tbr || 0) * 1000),
      filesize: audioFormat.filesize || audioFormat.filesize_approx || 0,
      audioCodec: audioFormat.acodec || 'AAC',
      audioBitrate: audioFormat.audio_bitrate || 0,
      isHDR: false,
      isBest: false,
    })
  }

  return qualities
}

function getSubtitleLanguages(raw: RawYtDlpOutput): string[] {
  const subs = raw.subtitles || raw.automatic_captions || {}
  return Object.keys(subs)
}

export function parseYtDlpOutput(raw: RawYtDlpOutput): VideoInfo {
  const qualities = mapQualities(raw)

  return {
    id: raw.id,
    title: raw.title || 'Sin t\u00edtulo',
    thumbnail: getBestThumbnail(raw),
    description: raw.description || '',
    duration: raw.duration || 0,
    durationString: parseDuration(raw.duration || 0),
    season: raw.season_number,
    episode: raw.episode_number,
    year: raw.release_year,
    language: raw.language,
    subtitles: getSubtitleLanguages(raw),
    source: raw.extractor_key?.toLowerCase() || raw.extractor?.toLowerCase() || '',
    uploader: raw.uploader || raw.channel || '',
    uploadDate: raw.upload_date || '',
    qualities,
    thumbnailHD: getHDThumbnail(raw),
    poster: raw.thumbnails?.find(t => t.preference && t.preference > 0)?.url,
    banner: undefined,
    extractor: raw.extractor || '',
    webpageUrl: raw.webpage_url || '',
  }
}
