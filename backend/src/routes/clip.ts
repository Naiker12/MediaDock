import { Router, type Router as RouterType } from 'express'
import rateLimit from 'express-rate-limit'
import {
  generateClips,
  uploadAndClip,
  uploadMiddleware,
  downloadClip,
  downloadAllClips,
  getClipStatus,
} from '../controllers/clipController.js'

const router: RouterType = Router()

const clipStatusLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas consultas de progreso. Inténtalo de nuevo en un momento.', code: 'RATE_LIMIT', status: 429 },
})

router.post('/clip', generateClips)
router.post('/clip/upload', uploadMiddleware, uploadAndClip)
router.get('/clip/:videoId/download-all', downloadAllClips)
router.get('/clip/:videoId/status', clipStatusLimiter, getClipStatus)
router.get('/clip/:videoId/:filename', downloadClip)

export { router as clipRouter }
