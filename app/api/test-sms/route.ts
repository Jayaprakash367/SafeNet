import { NextResponse } from 'next/server'
import { isReservedDemoPhone, normalizePhoneNumber } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

const e164PhonePattern = /^\+[1-9]\d{7,14}$/
const noStoreHeaders = { 'Cache-Control': 'no-store' }

interface SmsContext {
  fullName: string
  phoneNumber: string
  contactValid: boolean
  demoContact: boolean
  providerConfigured: boolean
}

type SmsContextResult =
  | { ok: true; context: SmsContext }
  | { ok: false; response: NextResponse }

async function loadSmsContext(): Promise<SmsContextResult> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError && authError.name !== 'AuthSessionMissingError') {
    console.error('[v0] SMS test account authentication failed:', authError.code ?? authError.name)
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Your private profile session is temporarily unavailable.' },
        { status: 503, headers: noStoreHeaders },
      ),
    }
  }

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Sign in before checking SMS readiness.' },
        { status: 401, headers: noStoreHeaders },
      ),
    }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name, emergency_contact1')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    console.error('[v0] SMS test profile lookup failed:', profileError.code ?? profileError.message)
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Could not load your saved emergency contact.' },
        { status: 500, headers: noStoreHeaders },
      ),
    }
  }

  const phoneNumber = typeof profile?.emergency_contact1 === 'string'
    ? normalizePhoneNumber(profile.emergency_contact1)
    : ''

  return {
    ok: true,
    context: {
      fullName: typeof profile?.full_name === 'string' ? profile.full_name.trim().slice(0, 120) : '',
      phoneNumber,
      contactValid: e164PhonePattern.test(phoneNumber),
      demoContact: isReservedDemoPhone(phoneNumber),
      providerConfigured: Boolean(process.env.TWILIO_SID && process.env.TWILIO_TOKEN && process.env.TWILIO_PHONE_NUMBER),
    },
  }
}

export async function GET() {
  try {
    const result = await loadSmsContext()
    if (!result.ok) return result.response

    const { context } = result
    const reason = !context.contactValid
      ? 'missing_contact'
      : context.demoContact
        ? 'demo_contact'
        : !context.providerConfigured
          ? 'provider_not_configured'
          : 'ready'

    return NextResponse.json(
      {
        readyForDelivery: reason === 'ready',
        contactValid: context.contactValid,
        demoContact: context.demoContact,
        providerConfigured: context.providerConfigured,
        reason,
        message: reason === 'ready'
          ? 'SMS delivery is configured for your saved contact. This check did not send a message.'
          : reason === 'demo_contact'
            ? 'The sample profile uses a fictional contact. No message was sent.'
            : reason === 'provider_not_configured'
              ? 'SMS delivery is not configured. This check did not send a message.'
              : 'Add a valid international-format emergency contact first. This check did not send a message.',
      },
      { headers: noStoreHeaders },
    )
  } catch (error) {
    console.error('[v0] SMS readiness check failed:', error instanceof Error ? error.name : 'UnknownError')
    return NextResponse.json({ error: 'SMS readiness could not be checked.' }, { status: 500, headers: noStoreHeaders })
  }
}

export async function POST() {
  try {
    const result = await loadSmsContext()
    if (!result.ok) return result.response

    const { context } = result
    if (!context.contactValid) {
      return NextResponse.json(
        { error: 'Add a valid international-format phone number as your first emergency contact.' },
        { status: 400, headers: noStoreHeaders },
      )
    }

    if (context.demoContact) {
      return NextResponse.json(
        { error: 'The sample profile uses a fictional phone number. Replace it with a real contact; no SMS was sent.' },
        { status: 422, headers: noStoreHeaders },
      )
    }

    if (!context.providerConfigured) {
      return NextResponse.json(
        { error: 'SMS delivery is not configured.' },
        { status: 503, headers: noStoreHeaders },
      )
    }

    const accountSid = process.env.TWILIO_SID!
    const authToken = process.env.TWILIO_TOKEN!
    const fromNumber = process.env.TWILIO_PHONE_NUMBER!
    const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
    const authorization = `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: context.phoneNumber,
        From: fromNumber,
        Body: `SafeNet SMS delivery test for ${context.fullName || 'your SafeNet profile'}. You requested this test from your profile.`,
      }),
      signal: AbortSignal.timeout(10_000),
    })

    if (!response.ok) {
      console.error('[v0] Twilio rejected the SMS delivery test:', response.status)
      return NextResponse.json(
        { error: 'The SMS could not be submitted. Check the saved contact and SMS account configuration.' },
        { status: 502, headers: noStoreHeaders },
      )
    }

    return NextResponse.json(
      { success: true, message: 'Test SMS submitted to your saved emergency contact.' },
      { status: 200, headers: noStoreHeaders },
    )
  } catch (error) {
    console.error('[v0] SMS delivery test failed:', error instanceof Error ? error.name : 'UnknownError')
    return NextResponse.json(
      { error: 'The SMS test could not be completed. Please try again.' },
      { status: 500, headers: noStoreHeaders },
    )
  }
}
