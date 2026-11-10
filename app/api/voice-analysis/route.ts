import { transcribe } from 'ai'
import { NextResponse } from 'next/server'
import { analyzeEmergency } from '@/lib/emergency-analysis'
import { createClient } from '@/lib/supabase/server'

const MAX_AUDIO_BYTES = 5 * 1024 * 1024
const MAX_DURATION_SECONDS = 30
const supportedAudioTypes = new Set(['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/ogg'])

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError && authError.name !== 'AuthSessionMissingError') {
      console.error('[v0] Voice analysis session validation failed:', authError.code ?? authError.name)
      return NextResponse.json({ error: 'Your account session could not be verified.' }, { status: 503 })
    }

    if (!user) {
      return NextResponse.json({ error: 'Sign in to use voice analysis.' }, { status: 401 })
    }

    const formData = await request.formData()
    const audio = formData.get('audio')
    const duration = Number(formData.get('duration'))

    if (!(audio instanceof File) || !Number.isFinite(duration) || duration < 1 || duration > MAX_DURATION_SECONDS) {
      return NextResponse.json({ error: 'Provide an audio recording between 1 and 30 seconds.' }, { status: 400 })
    }

    if (audio.size === 0 || audio.size > MAX_AUDIO_BYTES) {
      return NextResponse.json({ error: 'The audio recording must be smaller than 5 MB.' }, { status: 413 })
    }

    const mediaType = audio.type.split(';')[0].trim().toLowerCase()
    if (!supportedAudioTypes.has(mediaType)) {
      return NextResponse.json({ error: 'Use a supported WebM, MP4, MP3, WAV, or Ogg audio recording.' }, { status: 415 })
    }

    const transcription = await transcribe({
      model: 'google/gemini-3.5-transcribe',
      audio: new Uint8Array(await audio.arrayBuffer()),
      maxRetries: 0,
      abortSignal: AbortSignal.timeout(25_000),
    })
    const transcript = transcription.text.trim().slice(0, 1200)

    if (!transcript) {
      return NextResponse.json({ error: 'No speech could be transcribed. Try a clearer recording.' }, { status: 422 })
    }

    const analysis = await analyzeEmergency({ scenario: transcript })

    return NextResponse.json(
      {
        transcript,
        analysis,
        persisted: false,
        createdAt: new Date().toISOString(),
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('[v0] Voice analysis failed:', error instanceof Error ? error.name : 'UnknownError')
    return NextResponse.json({ error: 'Voice analysis is temporarily unavailable. No recording was saved.' }, { status: 502 })
  }
}
