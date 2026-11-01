import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const requestedNext = request.nextUrl.searchParams.get('next')
  const next =
    requestedNext?.startsWith('/') && !requestedNext.startsWith('//')
      ? requestedNext
      : '/'

  if (!code) {
    return NextResponse.redirect(new URL('/login?authError=callback', request.url))
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      return NextResponse.redirect(new URL('/login?authError=callback', request.url))
    }

    return NextResponse.redirect(new URL(next, request.url))
  } catch (error) {
    console.error('[v0] Supabase email confirmation failed:', error)
    return NextResponse.redirect(new URL('/login?authError=service', request.url))
  }
}
