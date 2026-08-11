import { type InferSchemaType, type Model, Schema, type Types, model, models } from 'mongoose'

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
// The `as Model<UserDoc>` here is necessary, not just convenient: mongoose's
// `models.User` is loosely typed as `Model<any>`, so without the assertion
// TypeScript infers a near-useless union type across both branches and
// every query call site (User.findOne(...), etc.) loses its real types.
// We know both branches really are the User model at runtime — this just
// tells the compiler what we already know.
export const User = (models.User || model('User', userSchema)) as Model<UserDoc>
