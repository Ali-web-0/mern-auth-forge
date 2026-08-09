import { describe, expect, it, vi } from 'vitest'
import { actionResult, fail, ok } from '@/lib/actionResult.js'
import { BusinessError, NotFoundError } from '@/lib/errors.js'

describe('ok', () => {
  it('wraps data in a success result', () => {
    expect(ok({ id: 1 })).toEqual({ success: true, data: { id: 1 } })
  })
})

describe('fail', () => {
  it('preserves message and code for a BusinessError', () => {
    const result = fail(new NotFoundError('Note not found'))
    expect(result).toEqual({ success: false, error: { message: 'Note not found', code: 'NOT_FOUND' } })
  })

  it('masks unexpected errors and logs them', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const result = fail(new Error('database connection string leaked here'))

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.code).toBe('INTERNAL_ERROR')
      expect(result.error.message).not.toContain('leaked')
    }
    expect(spy).toHaveBeenCalled()

    spy.mockRestore()
  })
})

describe('actionResult', () => {
  it('resolves ok() when the function succeeds', async () => {
    const result = await actionResult(async () => 42)
    expect(result).toEqual({ success: true, data: 42 })
  })

  it('resolves fail() when the function throws a BusinessError', async () => {
    const result = await actionResult(async () => {
      throw new BusinessError('nope', 'CUSTOM_CODE')
    })
    expect(result).toEqual({ success: false, error: { message: 'nope', code: 'CUSTOM_CODE' } })
  })
})
