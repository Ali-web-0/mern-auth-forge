import cookieParser from 'cookie-parser'
import cors from 'cors'
import express, { type Express } from 'express'
import helmet from 'helmet'
import { env } from '@/lib/env.js'
import { errorHandler } from '@/middleware/errorHandler.js'
import { adminRoutes } from '@/routes/admin.routes.js'
import { authRoutes } from '@/routes/auth.routes.js'
import { notesRoutes } from '@/routes/notes.routes.js'

export function createApp(): Express {
  const app = express()

  app.use(helmet())
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    }),
  )
  app.use(express.json())
  app.use(cookieParser())

  app.get('/api/health', (_req, res) => {
    res.json({ success: true, data: { status: 'ok' } })
  })

  app.use('/api/auth', authRoutes)
  app.use('/api/admin', adminRoutes)
  app.use('/api/notes', notesRoutes)

  // Must be registered last.
  app.use(errorHandler)

  return app
}
