import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import multer from 'multer'
import { join } from 'node:path'
import { existsSync, mkdirSync } from 'node:fs'
import { ClipService } from '../services/clipService.js'

const uploadsDir = join(process.cwd(), 'downloads', 'uploads')
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true })
}

const upload = multer({
  dest: uploadsDir,
  limits: { fileSize: 1024 * 1024 * 1024 * 5 },
  fileFilter: (_req, file, cb) => {
    const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'))
    const allowed = ['.mp4', '.mkv', '.webm', '.avi', '.mov', '.m4v']
    if (allowed.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error(`Formato no soportado: ${ext}. Usa: ${allowed.join(', ')}`))
    }
  },
})

const clipSchema = z.object({
  url: z.string().url({ message: 'URL inválida' }),
  qualityId: z.string().optional(),
  clipDuration: z.number().int().min(10).max(900).default(120),
  mode: z.enum(['fast', 'precise']).default('fast'),
})

export const uploadMiddleware: import('express').RequestHandler = upload.single('video')

export async function uploadAndClip(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No se envió ningún archivo', code: 'NO_FILE', status: 400 })
      return
    }

    const clipDuration = Math.min(Math.max(parseInt(req.body.clipDuration) || 120, 10), 900)
    const mode: 'fast' | 'precise' = req.body.mode === 'precise' ? 'precise' : 'fast'

    const result = await ClipService.clipLocalFile(
      req.file.path,
      req.file.originalname,
      clipDuration,
      mode,
    )
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export async function generateClips(req: Request, res: Response, next: NextFunction) {
  try {
    const { url, qualityId, clipDuration, mode } = clipSchema.parse(req.body)
    const result = await ClipService.generateClips(url, qualityId, clipDuration, mode)
    res.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Solicitud inválida. Verifica los campos.',
        code: 'INVALID_REQUEST',
        status: 400,
      })
      return
    }
    next(error)
  }
}

export async function downloadClip(req: Request, res: Response, next: NextFunction) {
  try {
    const videoId = req.params['videoId'] as string
    const filename = req.params['filename'] as string
    if (!filename || filename.includes('..') || filename.includes('/')) {
      res.status(400).json({ error: 'Filename inválido', code: 'INVALID_FILENAME', status: 400 })
      return
    }

    const filePath = await ClipService.getClipFile(videoId, filename)
    if (!filePath) {
      res.status(404).json({ error: 'Clip no encontrado', code: 'CLIP_NOT_FOUND', status: 404 })
      return
    }

    if (filename.endsWith('.jpg')) {
      res.sendFile(filePath)
    } else {
      res.download(filePath, filename)
    }
  } catch (error) {
    next(error)
  }
}

export async function downloadAllClips(req: Request, res: Response, next: NextFunction) {
  try {
    const videoId = req.params['videoId'] as string
    const zip = await ClipService.generateZip(videoId)
    if (!zip) {
      res.status(404).json({ error: 'Clips no encontrados', code: 'CLIPS_NOT_FOUND', status: 404 })
      return
    }

    res.download(zip.path, zip.filename)
  } catch (error) {
    next(error)
  }
}

export async function getClipStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const videoId = req.params['videoId'] as string
    const status = await ClipService.getClipStatus(videoId)
    res.json(status)
  } catch (error) {
    next(error)
  }
}
