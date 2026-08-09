import { Router } from 'express'
import { getUsers } from '@/controllers/admin.controller.js'
import { authenticate } from '@/middleware/authenticate.js'
import { authorize } from '@/middleware/authorize.js'

// Example route demonstrating the RBAC pattern: authenticate first (who are
// you), then authorize (what are you allowed to do). Every route in this
// file requires the 'admin' role.
export const adminRoutes = Router()

adminRoutes.use(authenticate, authorize('admin'))
adminRoutes.get('/users', getUsers)
