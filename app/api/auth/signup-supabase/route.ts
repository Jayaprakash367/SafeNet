import { NextRequest, NextResponse } from 'next/server'
import { validateEmail, validateName, validatePassword } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

function getSignupError(error: {
  code?: string
  message: string
  name?: string
  status?: number | null
}) {
  const details = `${error.code ?? ''} ${error.message}`.toLowerCase()

  if (error.status === 429) {
    return { status: 429, message: 'Too many sign-up attempts. Please wait and try again.' }
  }

  if (
    error.name === 'AuthRetryableFetchError' ||
    error.status === 0 ||
    details.includes('fetch failed') ||
    details.includes('network request failed')
  ) {
    return {
      status: 503,
      message: 'Authentication is temporarily unavailable. Please try again shortly.',
    }
  }

  if (error.code === 'weak_password' || details.includes('weak password')) {
    return { status: 400, message: 'Choose a stronger password and try again.' }
  }

  if (error.code === 'email_address_invalid') {
    return { status: 400, message: 'Please use a valid email address.' }
  }

  if (error.status !== undefined && error.status !== null && error.status >= 500) {
    return {
      status: 503,
      message: 'Authentication is temporarily unavailable. Please try again shortly.',
    }
  }

  return {
    status: 400,
    message: 'We could not create the account. Check your details or try signing in.',
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const confirmPassword =
      typeof body.confirmPassword === 'string' ? body.confirmPassword : ''

    const nameValidation = validateName(name)
    if (!nameValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          message: nameValidation.message,
          errors: { name: nameValidation.message },
        },
        { status: 400, headers: { 'Cache-Control': 'no-store' } },
      )
    }

    const emailValidation = validateEmail(email)
    if (!emailValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          message: emailValidation.message,
          errors: { email: emailValidation.message },
        },
        { status: 400, headers: { 'Cache-Control': 'no-store' } },
      )
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          message: passwordValidation.message,
          errors: { password: passwordValidation.message },
        },
        { status: 400, headers: { 'Cache-Control': 'no-store' } },
      )
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          message: 'Passwords do not match.',
          errors: { confirmPassword: 'Passwords do not match.' },
        },
        { status: 400, headers: { 'Cache-Control': 'no-store' } },
      )
    }

    const supabase = await createClient()
    const emailRedirectTo =
      process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
      new URL('/auth/callback', request.nextUrl.origin).toString()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
        data: { name },
      },
    })

    if (error) {
      const result = getSignupError(error)
      return NextResponse.json(
        { success: false, message: result.message, errors: { form: result.message } },
        { status: result.status, headers: { 'Cache-Control': 'no-store' } },
      )
    }

    const user = data.user
      ? {
          id: data.user.id,
          email: data.user.email ?? email,
          name,
          phone: data.user.phone ?? '',
          role: 'user' as const,
          isVerified: Boolean(data.user.email_confirmed_at),
          createdAt: data.user.created_at,
          lastLogin: data.user.last_sign_in_at ?? new Date().toISOString(),
        }
      : null
    const authenticated = Boolean(data.session && data.user)

    return NextResponse.json(
      {
        success: true,
        authenticated,
        requiresConfirmation: !authenticated,
        message: authenticated
          ? 'Account created successfully. Redirecting...'
          : 'Account created. Check your email for a confirmation link before signing in.',
        user,
      },
      {
        status: authenticated ? 201 : 202,
        headers: { 'Cache-Control': 'no-store' },
      },
    )
  } catch (error) {
    console.error('[v0] Supabase sign-up request failed:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Authentication is temporarily unavailable. Please try again shortly.',
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
