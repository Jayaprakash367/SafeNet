import { NextRequest, NextResponse } from 'next/server'
import { loginUser, validateEmail, validatePassword } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = body

    // Validate inputs
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 },
      )
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 },
      )
    }

    // Attempt login
    const result = loginUser(email, password)

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 401 },
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
    console.error('[v0] Login error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    )
  }
}
