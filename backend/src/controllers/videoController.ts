import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { VideoService } from '../services/videoService.js'

const urlSchema = z.object({
  url: z.string().url({ message: 'URL inv\u00e1lida' }),
})

const downloadSchema = z.object({
  url: z.string().url({ message: 'URL inv\u00e1lida' }),
  qualityId: z.string().min(1),
})

export async function analyzeVideo(req: Request, res: Response, next: NextFunction) {
  try {
    const { url } = urlSchema.parse(req.body)
    const result = await VideoService.analyze(url)
    res.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'URL inv\u00e1lida. Debe incluir http:// o https://',
        code: 'INVALID_URL',
        status: 400,
      })
      return
    }
    next(error)
  }
}

export async function downloadVideo(req: Request, res: Response, next: NextFunction) {
  try {
    const { url, qualityId } = downloadSchema.parse(req.body)
    const stream = await VideoService.download(url, qualityId)

    res.setHeader('Content-Type', 'video/mp4')
    res.setHeader('Content-Disposition', 'attachment; filename="video.mp4"')

    stream.on('error', (err) => {
      console.error('[Download stream error]', err.message)
      if (!res.headersSent) {
        res.status(500).json({
          error: 'Error durante la descarga del video.',
          code: 'DOWNLOAD_ERROR',
          status: 500,
        })
      }
      if (!res.destroyed) res.end()
    })

    stream.pipe(res)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Solicitud inv\u00e1lida.',
        code: 'INVALID_REQUEST',
        status: 400,
      })
      return
    }
    if (error instanceof Error && error.name === 'ValidationError') {
      res.status(400).json({
        error: error.message,
        code: 'INVALID_QUALITY',
        status: 400,
      })
      return
    }
    next(error)
  }
}
