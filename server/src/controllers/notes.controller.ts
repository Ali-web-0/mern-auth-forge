import type { Request, Response } from 'express'
import { ok } from '@/lib/actionResult.js'
import { AuthenticationError } from '@/lib/errors.js'
import { NoteIdParamSchema, NoteInputSchema } from '@/controllers/notes.schema.js'
import { createNote, deleteNote, getNoteForOwner, listNotesForOwner, updateNote } from '@/services/notes/index.js'

// Every handler requires req.user — the `authenticate` middleware runs for
// all of notes.routes.ts, so this should never actually be undefined, but
// we check anyway rather than trusting middleware ordering silently.
function requireUserId(req: Request): string {
  if (!req.user) {
    throw new AuthenticationError('Authentication required')
  }
  return req.user.sub
}

export async function listNotes(req: Request, res: Response) {
  const ownerId = requireUserId(req)
  const notes = await listNotesForOwner(ownerId)
  res.status(200).json(ok({ notes }))
}

export async function getNote(req: Request, res: Response) {
  const ownerId = requireUserId(req)
  const { id } = NoteIdParamSchema.parse(req.params)
  const note = await getNoteForOwner(id, ownerId)
  res.status(200).json(ok({ note }))
}

export async function createNoteHandler(req: Request, res: Response) {
  const ownerId = requireUserId(req)
  const input = NoteInputSchema.parse(req.body)
  const note = await createNote(ownerId, input)
  res.status(201).json(ok({ note }))
}

export async function updateNoteHandler(req: Request, res: Response) {
  const ownerId = requireUserId(req)
  const { id } = NoteIdParamSchema.parse(req.params)
  const input = NoteInputSchema.parse(req.body)
  const note = await updateNote(id, ownerId, input)
  res.status(200).json(ok({ note }))
}

export async function deleteNoteHandler(req: Request, res: Response) {
  const ownerId = requireUserId(req)
  const { id } = NoteIdParamSchema.parse(req.params)
  await deleteNote(id, ownerId)
  res.status(200).json(ok({ deleted: true }))
}
