import { z } from 'zod'

// Mirrors server/src/controllers/auth.schema.ts exactly. The server always
// re-validates — this copy exists purely for fast client-side feedback via
// React Hook Form. See: MERN_Best_Practices_Checklist.md, section 3.

export const RegisterSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
})

export const LoginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address'),
})

export const ResetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
})

export type RegisterFormValues = z.infer<typeof RegisterSchema>
export type LoginFormValues = z.infer<typeof LoginSchema>
export type ForgotPasswordFormValues = z.infer<typeof ForgotPasswordSchema>
export type ResetPasswordFormValues = z.infer<typeof ResetPasswordSchema>
