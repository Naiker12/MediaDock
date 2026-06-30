import { Router, type Router as RouterType } from 'express'
import { analyzeVideo, downloadVideo } from '../controllers/videoController.js'

const router: RouterType = Router()

router.post('/analyze', analyzeVideo)
router.post('/download', downloadVideo)

export { router as videoRouter }
