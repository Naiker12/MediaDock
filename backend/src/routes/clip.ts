import { Router, type Router as RouterType } from 'express'
import {
  generateClips,
  uploadAndClip,
  uploadMiddleware,
  downloadClip,
  downloadAllClips,
  getClipStatus,
} from '../controllers/clipController.js'

const router: RouterType = Router()

router.post('/clip', generateClips)
router.post('/clip/upload', uploadMiddleware, uploadAndClip)
router.get('/clip/:videoId/download-all', downloadAllClips)
router.get('/clip/:videoId/status', getClipStatus)
router.get('/clip/:videoId/:filename', downloadClip)

export { router as clipRouter }
