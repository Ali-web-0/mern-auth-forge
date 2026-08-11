import path from 'node:path'
import { fileURLToPath } from 'node:url'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express, { type Express } from 'express'
import helmet from 'helmet'
import { env } from '@/lib/env.js'
import { errorHandler } from '@/middleware/errorHandler.js'
import { adminRoutes } from '@/routes/admin.routes.js'
import { authRoutes } from '@/routes/auth.routes.js'
import { notesRoutes } from '@/routes/notes.routes.js'

// Compiled output lives at server/dist/app.js, so two levels up is the repo
// root, and the client's production build sits at client/dist from there.
// This is what lets a single deployed process serve both the API and the
// React app from one origin — see "why" note below.
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CLIENT_DIST_PATH = path.resolve(__dirname, '../../client/dist')

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

  // Production only: serve the built React app from the same origin as the
  // API. This is deliberate, not just convenient — it means the browser
  // never sees this as a cross-site request, so the httpOnly refresh
  // cookie (sameSite: 'lax') just works with no CORS/cookie tradeoffs to
  // reason about. In dev, Vite's own dev server handles the frontend on a
  // different port instead, so this block is skipped entirely.
  if (env.NODE_ENV === 'production') {
    app.use(express.static(CLIENT_DIST_PATH))

    // Express 5's catch-all syntax. Anything under /api that didn't match a
    // route above falls through to `next()` instead of being served the
    // SPA's index.html — a typo'd API path should still 404, not silently
    // render the frontend.
    app.get('/*splat', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        next()
        return
      }
      res.sendFile(path.join(CLIENT_DIST_PATH, 'index.html'))
    })
  }

  // Must be registered last.
  app.use(errorHandler)

  return app
}
