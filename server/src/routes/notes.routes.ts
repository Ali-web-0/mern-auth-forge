import { Router } from 'express'
import {
  createNoteHandler,
  deleteNoteHandler,
  getNote,
  listNotes,
  updateNoteHandler,
} from '@/controllers/notes.controller.js'
import { authenticate } from '@/middleware/authenticate.js'

// Example ownership-scoped resource. Any authenticated user can manage
// their OWN notes; the ownership check happens inside the service layer's
// queries (see services/notes/queries.ts), not here.
export const notesRoutes = Router()

notesRoutes.use(authenticate)
notesRoutes.get('/', listNotes)
notesRoutes.post('/', createNoteHandler)
notesRoutes.get('/:id', getNote)
notesRoutes.patch('/:id', updateNoteHandler)
notesRoutes.delete('/:id', deleteNoteHandler)
