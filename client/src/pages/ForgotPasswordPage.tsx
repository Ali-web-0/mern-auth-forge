import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Terminal } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { Button } from '@/components/shadcn/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadcn/card'
import { Input } from '@/components/shadcn/input'
import { Label } from '@/components/shadcn/label'
import { forgotPasswordRequest } from '@/features/auth/api'
import { ForgotPasswordSchema, type ForgotPasswordFormValues } from '@/lib/auth.schema'

export function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({ resolver: zodResolver(ForgotPasswordSchema) })

  const requestReset = useMutation({ mutationFn: forgotPasswordRequest })

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Reset your password</CardTitle>
          <CardDescription>We'll email you a link to reset it.</CardDescription>
        </CardHeader>
        <CardContent>
          {requestReset.isSuccess ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">
                If an account exists for that email, we've sent a link to reset your password. It's valid for 1
                hour — check your inbox (and spam folder) for an email from us.
              </p>
              {/* Dev-only: strips out of production builds entirely, so real users
                  never see an implementation detail that's meaningless to them. */}
              {import.meta.env.DEV && (
                <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                  <Terminal className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <p>
                    <span className="font-medium">Dev mode:</span> we haven't configured a real email provider yet.
                    Follow the <span className="font-medium">"Email setup"</span> section in README.md to add one
                    yourself — until then, the reset link is logged to the server terminal instead, so check there.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit((values) => requestReset.mutate(values))} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" autoComplete="email" {...register('email')} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <Button type="submit" disabled={requestReset.isPending} className="mt-2">
                {requestReset.isPending ? 'Sending…' : 'Send reset link'}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                <Link to="/login" className="text-foreground hover:underline">
                  Back to log in
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
