import { NextRequest } from 'next/server'
import { POST as supabaseLogin } from '../login-supabase/route'

export function POST(request: NextRequest) {
  return supabaseLogin(request)
}
