import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const urgencyLevels = ['critical', 'high', 'medium', 'low'] as const
const e164PhonePattern = /^\+[1-9]\d{7,14}$/

type Urgency = (typeof urgencyLevels)[number]

interface Coordinates {
  latitude: number
  longitude: number
  accuracyMeters: number | null
}

interface EmergencyProfileSnapshot {
  name: string
  age: number | null
  bloodGroup: string
  medicalConditions: string
  emergencyContacts: string[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function boundedText(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function readCoordinates(value: unknown): Coordinates | null {
  if (!isRecord(value)) {
    return null
  }

  const latitude = value.latitude
  const longitude = value.longitude
  if (
    typeof latitude !== 'number' ||
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    typeof longitude !== 'number' ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null
  }

  const accuracy = value.accuracy
  const accuracyMeters =
    typeof accuracy === 'number' && Number.isFinite(accuracy) && accuracy >= 0
      ? Math.min(accuracy, 100_000)
      : null

  return { latitude, longitude, accuracyMeters }
}

function isUrgency(value: unknown): value is Urgency {
  return typeof value === 'string' && urgencyLevels.includes(value as Urgency)
}

async function sendEmergencyContactSms(
  alertId: string,
  urgency: Urgency,
  location: Coordinates | null,
  profile: EmergencyProfileSnapshot,
): Promise<number> {
  const accountSid = process.env.TWILIO_SID
  const authToken = process.env.TWILIO_TOKEN
  const fromNumber = process.env.TWILIO_PHONE_NUMBER
  const contacts = profile.emergencyContacts.filter((phone) => e164PhonePattern.test(phone))

  if (!accountSid || !authToken || !fromNumber || contacts.length === 0) {
    return 0
  }

  const locationText = location
    ? `Location: https://maps.google.com/?q=${location.latitude},${location.longitude}`
    : 'Location is unavailable.'
  const message = [
    `SafeNet SOS alert ${alertId} from ${profile.name || 'a SafeNet user'}.`,
    `Urgency: ${urgency}.`,
    locationText,
    'This alert was recorded in SafeNet. Contact local emergency services directly for immediate help.',
  ].join(' ')
  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
  const authorization = `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`

  const results = await Promise.all(
    contacts.map(async (to) => {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Authorization: authorization,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ From: fromNumber, To: to, Body: message }),
          signal: AbortSignal.timeout(10_000),
        })

        if (!response.ok) {
          console.error('[v0] Twilio rejected an emergency contact notification:', response.status)
        }

        return response.ok
      } catch (error) {
        console.error('[v0] Emergency contact notification failed:', error instanceof Error ? error.name : 'UnknownError')
        return false
      }
    }),
  )

  return results.filter(Boolean).length
}

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  if (!isRecord(body)) {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError && authError.name !== 'AuthSessionMissingError') {
      console.error('[v0] SOS authentication check failed:', authError.code ?? authError.name)
      return NextResponse.json({ error: 'Authentication is temporarily unavailable.' }, { status: 503 })
    }

    if (!user) {
      return NextResponse.json({ error: 'Sign in before creating an SOS alert.' }, { status: 401 })
    }

    const { data: profileRow, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, age, blood_group, medical_conditions, emergency_contact1, emergency_contact2')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error('[v0] SOS profile lookup failed:', profileError.code ?? profileError.message)
      return NextResponse.json({ error: 'Could not load your emergency profile.' }, { status: 500 })
    }

    const metadataName = user.user_metadata?.name
    const nameFromMetadata = typeof metadataName === 'string' ? metadataName.trim() : ''
    const profileName = boundedText(profileRow?.full_name, 120) || nameFromMetadata || user.email?.split('@')[0] || ''
    const profile: EmergencyProfileSnapshot = {
      name: profileName,
      age: typeof profileRow?.age === 'number' ? profileRow.age : null,
      bloodGroup: boundedText(profileRow?.blood_group, 8),
      medicalConditions: boundedText(profileRow?.medical_conditions, 2000),
      emergencyContacts: [profileRow?.emergency_contact1, profileRow?.emergency_contact2].filter(
        (phone): phone is string => typeof phone === 'string' && e164PhonePattern.test(phone.trim()),
      ),
    }

    const location = readCoordinates(body.location)
    const urgency = isUrgency(body.urgency) ? body.urgency : 'high'
    const emergencyType = boundedText(body.emergencyType, 100) || 'General Emergency'
    const additionalInfo = boundedText(body.additionalInfo, 2000)

    const { data: alert, error: insertError } = await supabase
      .from('sos_alerts')
      .insert({
        user_id: user.id,
        emergency_type: emergencyType,
        urgency,
        status: 'received',
        latitude: location?.latitude ?? null,
        longitude: location?.longitude ?? null,
        accuracy_meters: location?.accuracyMeters ?? null,
        profile_snapshot: profile,
        additional_info: additionalInfo || null,
      })
      .select('id')
      .single()

    if (insertError || !alert) {
      console.error('[v0] SOS database insert failed:', insertError?.code ?? insertError?.message ?? 'No alert returned')
      return NextResponse.json({ error: 'Could not save your SOS alert.' }, { status: 500 })
    }

    const notificationsSent = await sendEmergencyContactSms(alert.id, urgency, location, profile)

    return NextResponse.json(
      {
        id: alert.id,
        status: 'received',
        notificationsSent,
        message: 'Your SOS alert was saved to your account.',
      },
      { status: 201, headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('[v0] SOS request failed:', error instanceof Error ? error.name : 'UnknownError')
    return NextResponse.json({ error: 'Could not process your SOS alert.' }, { status: 500 })
  }
}
