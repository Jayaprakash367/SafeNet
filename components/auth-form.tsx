'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, LoaderCircle, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getSafeNextPath, validateEmail, validatePassword } from '@/lib/auth'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type AuthMode = 'sign-in' | 'sign-up'

interface AuthFormProps {
  mode: AuthMode
  nextPath?: string
  callbackError?: string
}

function signInErrorMessage(error: unknown) {
  const details = (error ?? {}) as { code?: string; status?: number }

  if (details.code === 'email_not_confirmed') {
    return 'Confirm your email address using the link we sent, then sign in again.'
  }
  if (details.code === 'over_request_rate_limit' || details.status === 429) {
    return 'Too many attempts. Wait a moment and try again.'
  }
  if (details.code === 'invalid_credentials') {
    return 'Invalid email or password.'
  }
  return 'Sign-in could not be completed. Please try again.'
}

function signUpErrorMessage(error: unknown) {
  const details = (error ?? {}) as { code?: string; status?: number }

  if (details.code === 'weak_password') {
    return 'Choose a stronger password and try again.'
  }
  if (details.code === 'email_address_invalid') {
    return 'Enter a valid email address.'
  }
  if (details.code === 'email_address_not_authorized') {
    return 'This project cannot send a confirmation email to that address.'
  }
  if (details.code === 'over_email_send_rate_limit' || details.status === 429) {
    return 'Too many confirmation requests. Wait a moment and try again.'
  }
  return 'Sign-up could not be completed. Please try again.'
}

export function AuthForm({ mode, nextPath, callbackError }: AuthFormProps) {
  const router = useRouter()
  const destination = getSafeNextPath(nextPath, mode === 'sign-up' ? '/profile' : '/')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmationSent, setConfirmationSent] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    const emailValidation = validateEmail(email.trim())
    if (!emailValidation.valid) {
      setError(emailValidation.message)
      return
    }
    if (!password) {
      setError('Password is required.')
      return
    }
    if (mode === 'sign-up') {
      const passwordValidation = validatePassword(password)
      if (!passwordValidation.valid) {
        setError(passwordValidation.message)
        return
      }
    }
    if (mode === 'sign-up' && password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsSubmitting(true)
    const supabase = createClient()

    try {
      if (mode === 'sign-in') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (signInError) throw signInError
        router.replace(destination)
        router.refresh()
        return
      }

      const emailRedirectTo =
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
        `${window.location.origin}/auth/callback?next=${encodeURIComponent('/profile')}`
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo },
      })
      if (signUpError) throw signUpError

      if (data.session) {
        router.replace(destination)
        router.refresh()
        return
      }

      setConfirmationSent(true)
    } catch (submissionError) {
      console.error('[v0] Account authentication failed:', submissionError instanceof Error ? submissionError.name : 'UnknownError')
      setError(mode === 'sign-in' ? signInErrorMessage(submissionError) : signUpErrorMessage(submissionError))
    } finally {
      setIsSubmitting(false)
    }
  }

  const isSignUp = mode === 'sign-up'

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to SafeNet
        </Link>
        <Card className="border-primary/15 shadow-xl shadow-primary/5">
          <CardHeader className="space-y-4">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck aria-hidden="true" className="size-6" />
            </div>
            <div>
              <CardTitle className="text-2xl">{isSignUp ? 'Create your SafeNet account' : 'Sign in to SafeNet'}</CardTitle>
              <CardDescription className="mt-2">
                {isSignUp
                  ? 'Create an account to save your emergency profile and contact preferences.'
                  : 'Access your private emergency profile and saved safety tools.'}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {callbackError && !confirmationSent && (
              <Alert className="mb-4 border-destructive/30 bg-destructive/10" role="alert">
                <AlertDescription>The confirmation link could not be verified. Request a new email and try again.</AlertDescription>
              </Alert>
            )}
            {confirmationSent ? (
              <div className="space-y-4" role="status">
                <Alert className="border-primary/20 bg-primary/5">
                  <AlertDescription>
                    If an account can be created for this address, a confirmation link will arrive in your inbox. Confirm it to finish setup, then sign in to complete your emergency profile.
                  </AlertDescription>
                </Alert>
                <Button asChild className="w-full">
                  <Link href="/login">Go to sign in</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="account-email">Email address</Label>
                  <Input
                    id="account-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    required
                    maxLength={254}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account-password">Password</Label>
                  <Input
                    id="account-password"
                    name="password"
                    type="password"
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    minLength={isSignUp ? 8 : undefined}
                    maxLength={128}
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  {isSignUp && <p className="text-xs text-muted-foreground">Use at least 8 characters.</p>}
                </div>
                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="account-password-confirm">Confirm password</Label>
                    <Input
                      id="account-password-confirm"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                      maxLength={128}
                      required
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                    />
                  </div>
                )}
                {error && (
                  <Alert className="border-destructive/30 bg-destructive/10" role="alert">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
                  {isSubmitting ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  {isSignUp ? 'Already have an account?' : 'New to SafeNet?'}{' '}
                  <Link
                    href={isSignUp ? `/login?next=${encodeURIComponent(destination)}` : `/sign-up?next=${encodeURIComponent(destination)}`}
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {isSignUp ? 'Sign in' : 'Create an account'}
                  </Link>
                </p>
              </form>
            )}
          </CardContent>
        </Card>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          For immediate danger, contact your local emergency services. SafeNet does not dispatch emergency responders.
        </p>
      </div>
    </main>
  )
}
