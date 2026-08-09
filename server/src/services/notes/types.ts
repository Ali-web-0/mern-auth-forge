export interface NoteInput {
  title: string
  body: string
}

export interface NoteDTO {
  id: string
  title: string
  body: string
  ownerId: string
  createdAt: Date
  updatedAt: Date
}
