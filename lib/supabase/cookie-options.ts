const isV0Preview = Boolean(process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL)

export const supabaseCookieOptions = {
  secure: process.env.NODE_ENV === 'production' || isV0Preview,
  ...(isV0Preview ? { sameSite: 'none' as const } : {}),
}
