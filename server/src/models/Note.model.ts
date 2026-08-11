import { type InferSchemaType, type Model, Schema, type Types, model, models } from 'mongoose'

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
// Guard against "Cannot overwrite model once compiled", with an explicit
// cast to keep real types on query call sites — see User.model.ts for why.
type NoteModel = Model<NoteDoc>
export const Note = (models.Note || model('Note', noteSchema)) as NoteModel
