import { NextRequest, NextResponse } from 'next/server'
import { validateEmail, validatePassword } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

function getLoginError(error: {
  code?: string
  message: string
  name?: string
  status?: number | null
}) {
  const details = `${error.code ?? ''} ${error.message}`.toLowerCase()

  if (error.status === 429) {
    return { status: 429, message: 'Too many sign-in attempts. Please wait and try again.' }
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

  if (details.includes('email_not_confirmed') || details.includes('email not confirmed')) {
    return { status: 403, message: 'Please confirm your email before signing in.' }
  }

  if (
    details.includes('invalid login credentials') ||
    details.includes('invalid credentials') ||
    error.status === 401 ||
    (error.status !== undefined && error.status !== null && error.status < 500)
  ) {
    return { status: 401, message: 'Invalid email or password.' }
  }

  return {
    status: 503,
    message: 'Authentication is temporarily unavailable. Please try again shortly.',
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''

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

    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      const result = getLoginError(error)
      return NextResponse.json(
        { success: false, message: result.message, errors: { form: result.message } },
        { status: result.status, headers: { 'Cache-Control': 'no-store' } },
      )
    }

    if (!data.user || !data.session) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password.' },
        { status: 401, headers: { 'Cache-Control': 'no-store' } },
      )
    }

    const metadataName = data.user.user_metadata?.name
    const user = {
      id: data.user.id,
      email: data.user.email ?? email,
      name:
        typeof metadataName === 'string' && metadataName.trim()
          ? metadataName.trim()
          : (data.user.email ?? email).split('@')[0],
      phone: data.user.phone ?? '',
      role: 'user' as const,
      isVerified: Boolean(data.user.email_confirmed_at),
      createdAt: data.user.created_at,
      lastLogin: data.user.last_sign_in_at ?? new Date().toISOString(),
    }

    return NextResponse.json(
      { success: true, message: 'Login successful.', user, authenticated: true },
      { status: 200, headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('[v0] Supabase sign-in request failed:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Authentication is temporarily unavailable. Please try again shortly.',
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
