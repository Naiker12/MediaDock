import type { Request, Response, NextFunction } from 'express'
import { ExtractorError } from '../extractor/types.js'

export interface AppError extends Error {
  status?: number
  code?: string
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  console.error('[Error]', err.code || '', err.message)

  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      error: 'JSON inválido en el cuerpo de la solicitud.',
      code: 'INVALID_JSON',
      status: 400,
    })
    return
  }

  if (err instanceof ExtractorError) {
    res.status(err.status).json({
      error: err.message,
      code: err.code,
      status: err.status,
    })
    return
  }

  const status = err.status || 500
  const code = err.code || 'INTERNAL_ERROR'

  res.status(status).json({ error: err.message || 'Error interno del servidor', code, status })
}
