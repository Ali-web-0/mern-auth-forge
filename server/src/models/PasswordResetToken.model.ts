import { type InferSchemaType, Schema, model } from 'mongoose'

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

export type PasswordResetTokenDoc = InferSchemaType<typeof passwordResetTokenSchema> & { _id: string }
export const PasswordResetToken = model('PasswordResetToken', passwordResetTokenSchema)
