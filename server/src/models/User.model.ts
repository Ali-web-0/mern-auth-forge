import mongoose, { type InferSchemaType, type Model, Schema, type Types, model } from 'mongoose'

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
  },
  { timestamps: true },
)

// _id is Types.ObjectId at runtime, not string — see Note.model.ts for why.
export type UserDoc = InferSchemaType<typeof userSchema> & { _id: Types.ObjectId }

// Guard against "Cannot overwrite model once compiled" — this file can get
// re-imported in the same process more than once (multiple integration
// test files sharing one process, or dev-server hot reload), and Mongoose
// throws if you call model() twice for the same name. Reuse the existing
// registration instead of re-declaring it.
//
// Two non-obvious things here:
// 1. `mongoose.models.User` (property access on the default import), not a
//    named `{ models }` import — mongoose defines `.models` as a getter, and
//    Node's native ESM loader doesn't reliably detect that as a named export
//    on a CJS package, even though the types say it's fine. This only shows
//    up in the actual compiled/deployed build, not under tsx or Vitest.
// 2. The `as Model<UserDoc>` is necessary, not just convenient: without it,
//    TypeScript infers a near-useless union type across both branches and
//    every query call site (User.findOne(...), etc.) loses its real types.
export const User = (mongoose.models.User || model('User', userSchema)) as Model<UserDoc>
