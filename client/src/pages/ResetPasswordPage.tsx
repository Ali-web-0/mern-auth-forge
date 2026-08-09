import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/shadcn/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadcn/card'
import { Input } from '@/components/shadcn/input'
import { Label } from '@/components/shadcn/label'
import { resetPasswordRequest } from '@/features/auth/api'
import { ApiError } from '@/lib/api'
import { ResetPasswordSchema, type ResetPasswordFormValues } from '@/lib/auth.schema'

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({ resolver: zodResolver(ResetPasswordSchema) })

  const resetPassword = useMutation({
    mutationFn: (values: ResetPasswordFormValues) => resetPasswordRequest(token, values.password),
    onSuccess: () => navigate('/login', { replace: true }),
  })

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Set a new password</CardTitle>
          <CardDescription>Choose something you haven't used before.</CardDescription>
        </CardHeader>
        <CardContent>
          {!token ? (
            <p className="text-sm text-destructive">
              This link is missing its reset token.{' '}
              <Link to="/forgot-password" className="underline">
                Request a new one
              </Link>
              .
            </p>
          ) : (
            <form
              onSubmit={handleSubmit((values) => resetPassword.mutate(values))}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">New password</Label>
                <Input id="password" type="password" autoComplete="new-password" {...register('password')} />
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>

              {resetPassword.error && (
                <p className="text-xs text-destructive">
                  {resetPassword.error instanceof ApiError ? resetPassword.error.message : 'Something went wrong.'}
                </p>
              )}

              <Button type="submit" disabled={resetPassword.isPending} className="mt-2">
                {resetPassword.isPending ? 'Updating…' : 'Update password'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
