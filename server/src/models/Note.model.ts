import mongoose, { type InferSchemaType, type Model, Schema, type Types, model } from 'mongoose'

const noteSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, required: true, trim: true, maxlength: 10_000 },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true },
)

// _id is Types.ObjectId here, not string — that's what real query results
// actually have at runtime. toDTO() in queries.ts/mutations.ts converts it
// to a string for the API response; this type just has to match reality.
export type NoteDoc = InferSchemaType<typeof noteSchema> & { _id: Types.ObjectId }
// Guard against "Cannot overwrite model once compiled", using mongoose.models
// (property access, not a named import) with an explicit cast — see
// User.model.ts for why both of those matter.
type NoteModel = Model<NoteDoc>
export const Note = (mongoose.models.Note || model('Note', noteSchema)) as NoteModel
