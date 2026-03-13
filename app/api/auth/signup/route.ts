import { NextRequest, NextResponse } from 'next/server'
import { signupUser, validateEmail, validatePassword } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, confirmPassword, name, emergencyContacts } = body

    // Validate inputs
    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, message: 'Email, password, and name are required' },
        { status: 400 },
      )
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 },
      )
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { success: false, message: passwordValidation.message },
        { status: 400 },
      )
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: 'Passwords do not match' },
        { status: 400 },
      )
    }

    if (name.trim().length < 2) {
      return NextResponse.json(
        { success: false, message: 'Name must be at least 2 characters' },
        { status: 400 },
      )
    }

    // Attempt signup
    const result = signupUser(email, password, name, emergencyContacts || [])

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 },
      )
    }

    // Create response with secure cookie
    const response = NextResponse.json({
      success: true,
      message: result.message,
      user: result.user,
    })

    // Set secure session cookie
    response.cookies.set('safenet-token', result.token || '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return response
  } catch (error) {
    console.error('[v0] Signup error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    )
  }
}
