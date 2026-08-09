import { Resend } from 'resend'
import { env } from '@/lib/env.js'

// Lazily construct the client only if a key is configured — this is what
// makes RESEND_API_KEY optional. Cloning the repo and running the app with
// zero external accounts still works; you just get console-logged links
// instead of real email until you add a key.
const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null

/**
 * Sends the password reset email, or falls back to logging it if no
 * RESEND_API_KEY is configured. Deliberately never throws: this is called
 * from services/auth/passwordReset.ts, which must resolve the same way
 * whether or not the account exists (see that file for why) — a mail
 * provider outage or misconfiguration should degrade to "logged, not sent"
 * rather than turn into a 500 that leaks account existence.
 */
export async function sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
  if (!resend) {
    console.log(`[mailer stub] Password reset link for ${to}: ${resetLink}`)
    console.log('(Set RESEND_API_KEY in server/.env to send this for real — see README.)')
    return
  }

  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject: 'Reset your password',
    text: `Someone requested a password reset for your account.\n\nReset it here: ${resetLink}\n\nIf you didn't request this, you can safely ignore this email — your password won't change.`,
    html: `
      <p>Someone requested a password reset for your account.</p>
      <p><a href="${resetLink}">Click here to reset your password</a></p>
      <p>Or paste this link into your browser:<br>${resetLink}</p>
      <p style="color:#666">If you didn't request this, you can safely ignore this email — your password won't change.</p>
    `.trim(),
  })

  if (error) {
    // Logged, not thrown — see the doc comment above for why.
    console.error('Failed to send password reset email:', error)
  }
}
