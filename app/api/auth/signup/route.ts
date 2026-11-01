import { NextRequest } from 'next/server'
import { POST as supabaseSignup } from '../signup-supabase/route'

export function POST(request: NextRequest) {
  return supabaseSignup(request)
}
