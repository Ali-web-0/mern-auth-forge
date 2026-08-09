import { NotFoundError } from '@/lib/errors.js'
import { Note, type NoteDoc } from '@/models/Note.model.js'
import type { NoteDTO } from '@/services/notes/types.js'

/**
 * Ownership scoping lives IN THE QUERY, not as a check bolted on after
 * fetching. `ownerId` is part of every filter below — there is no code path
 * that can return another user's note, even if a future controller forgets
 * to check who's asking. This is the "scoped query" pattern.
 * See: MERN_Best_Practices_Checklist.md, section 5.
 */

function toDTO(doc: NoteDoc): NoteDTO {
  return {
    id: String(doc._id),
    title: doc.title,
    body: doc.body,
    ownerId: String(doc.ownerId),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

export async function listNotesForOwner(ownerId: string): Promise<NoteDTO[]> {
  const notes = await Note.find({ ownerId }).sort({ createdAt: -1 })
  return notes.map(toDTO)
}

export async function getNoteForOwner(noteId: string, ownerId: string): Promise<NoteDTO> {
  const note = await Note.findOne({ _id: noteId, ownerId })

  // Same "not found" whether the note doesn't exist or belongs to someone
  // else — never confirm to a client that a resource they don't own exists.
  if (!note) {
    throw new NotFoundError('Note not found')
  }

  return toDTO(note)
}
