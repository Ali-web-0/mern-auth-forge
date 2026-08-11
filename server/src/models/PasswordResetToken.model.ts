import mongoose, { type InferSchemaType, type Model, Schema, type Types, model } from 'mongoose'

// Same "never store the raw token" rule as RefreshToken — only the hash
// lives in the DB. `usedAt` prevents a token being replayed after a
// successful reset even if it hasn't expired yet.
const passwordResetTokenSchema = new Schema(
  {
    tokenHash: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true },
)

passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

// _id is Types.ObjectId at runtime, not string — see Note.model.ts for why.
export type PasswordResetTokenDoc = InferSchemaType<typeof passwordResetTokenSchema> & { _id: Types.ObjectId }
// Guard against "Cannot overwrite model once compiled", using mongoose.models
// (property access, not a named import) with an explicit cast — see
// User.model.ts for why both of those matter.
type PasswordResetTokenModel = Model<PasswordResetTokenDoc>
export const PasswordResetToken = (mongoose.models.PasswordResetToken ||
  model('PasswordResetToken', passwordResetTokenSchema)) as PasswordResetTokenModel
