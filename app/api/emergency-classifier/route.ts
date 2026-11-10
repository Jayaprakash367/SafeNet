import { NextResponse } from 'next/server'
import { z } from 'zod'
import { analyzeEmergency } from '@/lib/emergency-analysis'
import { createClient } from '@/lib/supabase/server'

const requestSchema = z.object({
  scenario: z.enum([
    'medical_heart',
    'fire_building',
    'accident_car',
    'natural_earthquake',
    'security_break',
    'other_general',
  ]),
})

export async function POST(request: Request) {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid analysis request.' }, { status: 400 })
  }

  const parsed = requestSchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Choose a supported emergency scenario.' }, { status: 400 })
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError && authError.name !== 'AuthSessionMissingError') {
      console.error('[v0] Emergency analysis session validation failed:', authError.code ?? authError.name)
      return NextResponse.json({ error: 'Your account session could not be verified.' }, { status: 503 })
    }

    if (!user) {
      return NextResponse.json({ error: 'Sign in to use emergency analysis.' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('age, medical_conditions, allergies')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error('[v0] Emergency analysis profile lookup failed:', profileError.code ?? profileError.message)
      return NextResponse.json({ error: 'Your private profile could not be loaded.' }, { status: 500 })
    }

    const analysis = await analyzeEmergency({
      scenario: parsed.data.scenario,
      profile: profile
        ? {
            age: typeof profile.age === 'number' ? profile.age : null,
            medicalConditions: typeof profile.medical_conditions === 'string' ? profile.medical_conditions : '',
            allergies: typeof profile.allergies === 'string' ? profile.allergies : '',
          }
        : null,
    })

    return NextResponse.json(
      {
        analysis,
        profileContextUsed: Boolean(profile),
        createdAt: new Date().toISOString(),
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('[v0] Emergency analysis failed:', error instanceof Error ? error.name : 'UnknownError')
    return NextResponse.json({ error: 'Emergency analysis is temporarily unavailable.' }, { status: 502 })
  }
}
