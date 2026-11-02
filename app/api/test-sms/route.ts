import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const e164PhonePattern = /^\+[1-9]\d{7,14}$/

export async function POST() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError && authError.name !== 'AuthSessionMissingError') {
      console.error('[v0] SMS test authentication failed:', authError.code ?? authError.name)
      return NextResponse.json(
        { error: 'Your private profile session is temporarily unavailable.' },
        { status: 503, headers: { 'Cache-Control': 'no-store' } },
      )
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Create a profile before testing SMS delivery.' },
        { status: 401, headers: { 'Cache-Control': 'no-store' } },
      )
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, emergency_contact1')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error('[v0] SMS test profile lookup failed:', profileError.code ?? profileError.message)
      return NextResponse.json(
        { error: 'Could not load your saved emergency contact.' },
        { status: 500, headers: { 'Cache-Control': 'no-store' } },
      )
    }

    const phoneNumber =
      typeof profile?.emergency_contact1 === 'string'
        ? profile.emergency_contact1.replace(/[\s()-]/g, '')
        : ''

    if (!phoneNumber || !e164PhonePattern.test(phoneNumber)) {
      return NextResponse.json(
        { error: 'Add a valid international-format phone number as your first emergency contact.' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } },
      )
    }

    const accountSid = process.env.TWILIO_SID
    const authToken = process.env.TWILIO_TOKEN
    const fromNumber = process.env.TWILIO_PHONE_NUMBER

    if (!accountSid || !authToken || !fromNumber) {
      return NextResponse.json(
        { error: 'SMS delivery is not configured.' },
        { status: 503, headers: { 'Cache-Control': 'no-store' } },
      )
    }

    const name =
      typeof profile?.full_name === 'string' && profile.full_name.trim()
        ? profile.full_name.trim().slice(0, 120)
        : 'your SafeNet profile'
    const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
    const authorization = `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: phoneNumber,
        From: fromNumber,
        Body: `SafeNet SMS delivery test for ${name}. You requested this test from your profile.`,
      }),
      signal: AbortSignal.timeout(10_000),
    })

    if (!response.ok) {
      console.error('[v0] Twilio rejected the SMS delivery test:', response.status)
      return NextResponse.json(
        { error: 'The SMS could not be submitted. Check the saved contact and SMS account configuration.' },
        { status: 502, headers: { 'Cache-Control': 'no-store' } },
      )
    }

    return NextResponse.json(
      { success: true, message: 'Test SMS submitted to your saved emergency contact.' },
      { status: 200, headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('[v0] SMS delivery test failed:', error instanceof Error ? error.name : 'UnknownError')
    return NextResponse.json(
      { error: 'The SMS test could not be completed. Please try again.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
