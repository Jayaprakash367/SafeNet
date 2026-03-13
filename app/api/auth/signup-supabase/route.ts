import { NextRequest, NextResponse } from 'next/server'
import { registerUser } from '@/lib/supabase-auth'
import { fallbackAuth } from '@/lib/auth-fallback'
import { logAuthEvent } from '@/lib/behavior-tracking'
import { validateEmail, validatePassword, validateName } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, confirmPassword, name } = body

    // Validate inputs
    const nameValidation = validateName(name)
    if (!nameValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          message: nameValidation.message,
          errors: { name: nameValidation.message },
        },
        { status: 400 },
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

    // Verify passwords match
    if (password !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          message: 'Passwords do not match',
          errors: { confirmPassword: 'Passwords do not match' },
        },
        { status: 400 },
      )
    }

    // Try Supabase first
    console.log('[v0] Attempting Supabase signup for:', email)
    const result = await registerUser(email, password, name, 'responder')

    if (result.success && result.user) {
      // Log successful signup
      await logAuthEvent(result.user.id, 'signup', true).catch((err) => {
        console.warn('[v0] Could not log auth event:', err)
      })

      return NextResponse.json(
        {
          success: true,
          message: 'Account created successfully',
          user: result.user,
        },
        { status: 201 },
      )
    }

    // If Supabase fails, try fallback
    console.log('[v0] Supabase unavailable, using fallback auth')
    const fallbackUser = fallbackAuth.registerUser(email, password, name, 'responder')

    if (fallbackUser) {
      return NextResponse.json(
        {
          success: true,
          message: 'Account created successfully (offline mode)',
          user: {
            id: fallbackUser.id,
            email: fallbackUser.email,
            name: fallbackUser.name,
            role: fallbackUser.role as 'admin' | 'responder' | 'user',
            isVerified: false,
            createdAt: fallbackUser.createdAt,
            lastLogin: fallbackUser.lastLogin,
          },
        },
        { status: 201 },
      )
    }

    return NextResponse.json(
      {
        success: false,
        message: result.message || 'Signup failed',
        errors: result.errors || { form: 'Unable to create account' },
      },
      { status: 400 },
    )
  } catch (error) {
    console.error('[v0] Signup API error:', error)

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
