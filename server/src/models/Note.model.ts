import { type InferSchemaType, Schema, model } from 'mongoose'

const noteSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, required: true, trim: true, maxlength: 10_000 },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true },
)

export type NoteDoc = InferSchemaType<typeof noteSchema> & { _id: string }
export const Note = model('Note', noteSchema)
