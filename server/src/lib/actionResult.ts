import { BusinessError } from '@/lib/errors.js'

/**
 * Every API response uses this shape. The client never has to guess whether
 * an endpoint returns raw data, a string error, or throws — it's always this.
 *
 * See: MERN_Best_Practices_Checklist.md, section 6.
 */
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; code: string } }

export function ok<T>(data: T): ActionResult<T> {
  return { success: true, data }
}

export function fail(error: unknown): ActionResult<never> {
  if (error instanceof BusinessError) {
    return { success: false, error: { message: error.message, code: error.code } }
  }

  // Unexpected error — never leak internals to the client.
  console.error('Unexpected error:', error)
  return {
    success: false,
    error: { message: 'Something went wrong. Please try again.', code: 'INTERNAL_ERROR' },
  }
}

/**
 * Wraps an async service call: expected BusinessErrors become a clean
 * `{ success: false, error }` result; unexpected errors are logged and masked.
 */
export async function actionResult<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    const data = await fn()
    return ok(data)
  } catch (error) {
    return fail(error)
  }
}
