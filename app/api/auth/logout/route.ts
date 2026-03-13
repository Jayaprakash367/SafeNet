import { NextRequest, NextResponse } from 'next/server'
import { logoutUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('safenet-token')?.value

    if (token) {
      logoutUser(token)
    }

    // Create response and clear cookie
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    })

    response.cookies.delete('safenet-token')

    return response
  } catch (error) {
    console.error('[v0] Logout error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    )
  }
}
