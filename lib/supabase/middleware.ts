import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseCookieOptions } from './cookie-options'

function addSecurityHeaders(response: NextResponse) {
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  return response
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })
  const hasSupabaseSessionCookie = request.cookies
    .getAll()
    .some(({ name }) => name.startsWith('sb-') && name.includes('-auth-token'))

  if (!hasSupabaseSessionCookie) {
    return addSecurityHeaders(response)
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return addSecurityHeaders(response)
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookieOptions: supabaseCookieOptions,
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value)
        })

        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  try {
    const { error } = await supabase.auth.getUser()
    const isMissingSession =
      error?.name === 'AuthSessionMissingError' ||
      error?.status === 400 ||
      error?.status === 401 ||
      error?.status === 403

    if (error && !isMissingSession) {
      console.error('[v0] Supabase account session refresh failed:', {
        name: error.name,
        status: error.status,
        code: error.code,
      })
    }
  } catch (error) {
    console.error('[v0] Supabase account session refresh failed:', error instanceof Error ? error.name : 'UnknownError')
  }

  return addSecurityHeaders(response)
}
