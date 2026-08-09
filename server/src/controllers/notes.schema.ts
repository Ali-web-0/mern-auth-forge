import { z } from 'zod'

// Validating the id shape here means a malformed id (e.g. someone poking at
// the URL) fails with a clean 400 from Zod instead of a raw Mongoose
// CastError bubbling up as a 500.
export const NoteIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid note id'),
})

export const NoteInputSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  body: z.string().trim().min(1, 'Body is required').max(10_000),
})

export type NoteInput = z.infer<typeof NoteInputSchema>
