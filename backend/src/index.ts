import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import { videoRouter } from './routes/video.js'
import { clipRouter } from './routes/clip.js'
import { errorHandler } from './middlewares/errorHandler.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(helmet())
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }))
app.use(morgan('dev'))
app.use(express.json({ limit: '1mb' }))

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many requests. Try again later.', code: 'RATE_LIMIT', status: 429 },
})
const postLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many requests. Try again later.', code: 'RATE_LIMIT', status: 429 },
})

app.use('/api', apiLimiter)
app.post('/api/*', postLimiter)
app.use('/api', videoRouter)
app.use('/api', clipRouter)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`)
})
