import { NextRequest, NextResponse } from 'next/server'
import { loginUser, verifyPassword } from '@/lib/supabase-auth'
import { fallbackAuth } from '@/lib/auth-fallback'
import { logAuthEvent } from '@/lib/behavior-tracking'
import { validateEmail, validatePassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validate inputs
    const emailValidation = validateEmail(email)
    if (!emailValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          message: emailValidation.message,
          errors: { email: emailValidation.message },
        },
        { status: 400 },
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
        { status: 400 },
      )
    }

    // Try Supabase first
    console.log('[v0] Attempting Supabase login for:', email)
    const result = await loginUser(email, password)

    if (result.success && result.user) {
      // Log successful login
      await logAuthEvent(result.user.id, 'login', true).catch((err) => {
        console.warn('[v0] Could not log auth event:', err)
      })

      return NextResponse.json(
        {
          success: true,
          message: 'Login successful',
          user: result.user,
          token: result.token,
        },
        {
          status: 200,
          headers: {
            'Set-Cookie': `safenet_token=${result.token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`,
          },
        },
      )
    }

    // If Supabase fails, try fallback
    console.log('[v0] Supabase unavailable, using fallback auth')
    const fallbackResult = fallbackAuth.loginUser(email, password)

    if (fallbackResult) {
      return NextResponse.json(
        {
          success: true,
          message: 'Login successful (offline mode)',
          user: {
            id: fallbackResult.user.id,
            email: fallbackResult.user.email,
            name: fallbackResult.user.name,
            role: fallbackResult.user.role as 'admin' | 'responder' | 'user',
            isVerified: true,
            createdAt: fallbackResult.user.createdAt,
            lastLogin: fallbackResult.user.lastLogin,
          },
          token: fallbackResult.token,
        },
        {
          status: 200,
          headers: {
            'Set-Cookie': `safenet_token=${fallbackResult.token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`,
          },
        },
      )
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Invalid email or password',
        errors: { form: 'Authentication failed' },
      },
      { status: 401 },
    )
  } catch (error) {
    console.error('[v0] Login API error:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'An unexpected error occurred',
        errors: { form: 'Server error' },
      },
      { status: 500 },
    )
  }
}
