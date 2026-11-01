import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

function addSecurityHeaders(response: NextResponse) {
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  return response
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })
  const pathname = request.nextUrl.pathname

  if (pathname === '/login' || pathname === '/auth/callback') {
    return addSecurityHeaders(response)
  }

  const hasSupabaseSessionCookie = request.cookies
    .getAll()
    .some(({ name }) => name.startsWith('sb-') && name.includes('-auth-token'))

  if (!hasSupabaseSessionCookie) {
    return addSecurityHeaders(NextResponse.redirect(new URL('/login', request.url)))
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return addSecurityHeaders(
      NextResponse.redirect(new URL('/login?authError=service', request.url)),
    )
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
    },
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
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      const isInvalidSession =
        error.name === 'AuthSessionMissingError' ||
        error.status === 400 ||
        error.status === 401 ||
        error.status === 403

      if (!isInvalidSession) {
        console.error('[v0] Supabase session validation failed:', {
          name: error.name,
          status: error.status,
          code: error.code,
        })
        return addSecurityHeaders(
          NextResponse.redirect(new URL('/login?authError=service', request.url)),
        )
      }
    }

    if (!user) {
      return addSecurityHeaders(NextResponse.redirect(new URL('/login', request.url)))
    }

    return addSecurityHeaders(response)
  } catch (error) {
    console.error('[v0] Supabase session validation failed:', error)
    return addSecurityHeaders(
      NextResponse.redirect(new URL('/login?authError=service', request.url)),
    )
  }
}
