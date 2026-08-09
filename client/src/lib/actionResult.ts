// Mirrors server/src/lib/actionResult.ts — every API response has this
// shape, so the client never has to guess what an endpoint returns.
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; code: string } }
