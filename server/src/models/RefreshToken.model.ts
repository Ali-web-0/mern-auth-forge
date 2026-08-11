import mongoose, { type InferSchemaType, type Model, Schema, type Types, model } from 'mongoose'

/**
 * We never store raw refresh tokens — only a SHA-256 hash (see lib/tokens.ts
 * hashToken()). A DB leak alone should never hand out a usable token.
 *
 * `familyId` groups every token produced by one rotation chain, starting at
 * login. Rotating a token creates a new document in the SAME family and
 * marks the old one revoked + `replacedByHash`. If a revoked token is ever
 * presented again, that's a signal the token was stolen and reused — we
 * revoke the entire family, forcing re-login on every device in that chain.
 * See: MERN_Best_Practices_Checklist.md, section 7 (defense in depth).
 */
const refreshTokenSchema = new Schema(
  {
    tokenHash: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    familyId: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    replacedByHash: { type: String, default: null },
  },
  { timestamps: true },
)

// TTL index — Mongo automatically deletes the document once expiresAt passes.
// Revoked-but-not-yet-expired tokens are kept around intentionally so reuse
// detection above still has something to compare against.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

// _id is Types.ObjectId at runtime, not string — see Note.model.ts for why.
export type RefreshTokenDoc = InferSchemaType<typeof refreshTokenSchema> & { _id: Types.ObjectId }
// Guard against "Cannot overwrite model once compiled", using mongoose.models
// (property access, not a named import) with an explicit cast — see
// User.model.ts for why both of those matter.
type RefreshTokenModel = Model<RefreshTokenDoc>
export const RefreshToken = (mongoose.models.RefreshToken ||
  model('RefreshToken', refreshTokenSchema)) as RefreshTokenModel
