import { apiFetch } from '@/lib/api'

export interface Note {
  id: string
  title: string
  body: string
  ownerId: string
  createdAt: string
  updatedAt: string
}

export interface NoteInput {
  title: string
  body: string
}

export async function listNotesRequest(): Promise<Note[]> {
  const data = await apiFetch<{ notes: Note[] }>('/notes')
  return data.notes
}

export async function createNoteRequest(input: NoteInput): Promise<Note> {
  const data = await apiFetch<{ note: Note }>('/notes', { method: 'POST', body: input })
  return data.note
}

export async function deleteNoteRequest(id: string): Promise<void> {
  await apiFetch(`/notes/${id}`, { method: 'DELETE' })
}
