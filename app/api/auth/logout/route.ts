import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut({ scope: 'local' })

    if (error) {
      return NextResponse.json(
        { success: false, message: 'Unable to end the session. Please try again.' },
        { status: 503, headers: { 'Cache-Control': 'no-store' } },
      )
    }

    return NextResponse.json(
      { success: true, message: 'Logged out successfully.' },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('[v0] Supabase sign-out request failed:', error)
    return NextResponse.json(
      { success: false, message: 'Unable to end the session. Please try again.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
