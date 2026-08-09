import { Router } from 'express'
import {
  forgotPassword,
  login,
  logout,
  logoutAll,
  me,
  refresh,
  register,
  resetPasswordHandler,
} from '@/controllers/auth.controller.js'
import { authenticate } from '@/middleware/authenticate.js'
import { authAttemptLimiter, refreshLimiter } from '@/middleware/rateLimit.js'

export const authRoutes = Router()

authRoutes.post('/register', authAttemptLimiter, register)
authRoutes.post('/login', authAttemptLimiter, login)
authRoutes.post('/refresh', refreshLimiter, refresh)
authRoutes.post('/logout', logout)
authRoutes.post('/logout-all', authenticate, logoutAll)
authRoutes.get('/me', authenticate, me)
authRoutes.post('/forgot-password', authAttemptLimiter, forgotPassword)
authRoutes.post('/reset-password', authAttemptLimiter, resetPasswordHandler)
