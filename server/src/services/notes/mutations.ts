import { NotFoundError } from '@/lib/errors.js'
import { Note, type NoteDoc } from '@/models/Note.model.js'
import type { NoteDTO, NoteInput } from '@/services/notes/types.js'

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

export async function createNote(ownerId: string, input: NoteInput): Promise<NoteDTO> {
  const note = await Note.create({ ...input, ownerId })
  return toDTO(note)
}

export async function updateNote(noteId: string, ownerId: string, input: NoteInput): Promise<NoteDTO> {
  // findOneAndUpdate with ownerId in the filter — a non-owner's request
  // simply matches nothing, it can never overwrite someone else's note.
  const note = await Note.findOneAndUpdate({ _id: noteId, ownerId }, { $set: input }, { returnDocument: 'after' })

  if (!note) {
    throw new NotFoundError('Note not found')
  }

  return toDTO(note)
}

export async function deleteNote(noteId: string, ownerId: string): Promise<void> {
  const result = await Note.deleteOne({ _id: noteId, ownerId })

  if (result.deletedCount === 0) {
    throw new NotFoundError('Note not found')
  }
}
