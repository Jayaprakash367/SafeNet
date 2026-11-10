'use client'

import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Brain, LoaderCircle, Mic, Square } from 'lucide-react'
import type { EmergencyAnalysis } from '@/lib/emergency-analysis'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const MAX_RECORDING_SECONDS = 30

interface VoiceRecordingData {
  blob: Blob
  duration: number
  timestamp: number
}

interface VoiceAnalysisResult {
  transcript: string
  analysis: EmergencyAnalysis
  persisted: false
}

interface AIVoiceRecorderProps {
  onRecordingComplete?: (data: VoiceRecordingData) => void
}

export function AIVoiceRecorder({ onRecordingComplete }: AIVoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<VoiceAnalysisResult | null>(null)
  const [error, setError] = useState('')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)
  const durationRef = useRef(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!audioBlob) {
      setAudioUrl(null)
      return
    }

    const objectUrl = URL.createObjectURL(audioBlob)
    setAudioUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [audioBlob])

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current)
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  const clearRecording = () => {
    setAudioBlob(null)
    setAnalysisResult(null)
    setError('')
    setRecordingTime(0)
    durationRef.current = 0
  }

  const processAudioWithAI = async (recording: VoiceRecordingData) => {
    setIsProcessing(true)
    setError('')

    try {
      const formData = new FormData()
      const fileName = recording.blob.type.includes('mp4') ? 'safenet-recording.mp4' : 'safenet-recording.webm'
      formData.append('audio', new File([recording.blob], fileName, { type: recording.blob.type || 'audio/webm' }))
      formData.append('duration', String(recording.duration))

      const response = await fetch('/api/voice-analysis', { method: 'POST', body: formData })
      const result = (await response.json()) as VoiceAnalysisResult | { error?: unknown }
      if (!response.ok || !('analysis' in result) || !('transcript' in result)) {
        const message = 'error' in result && typeof result.error === 'string'
          ? result.error
          : 'Voice analysis could not be completed.'
        throw new Error(message)
      }

      setAnalysisResult(result)
    } catch (processingError) {
      setError(processingError instanceof Error ? processingError.message : 'Voice analysis could not be completed.')
    } finally {
      setIsProcessing(false)
    }
  }

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current
    if (recorder?.state === 'recording') {
      recorder.stop()
    }
    setIsRecording(false)
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const startRecording = async () => {
    setError('')
    setAnalysisResult(null)
    setAudioBlob(null)

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('This browser does not support microphone recording.')
      return
    }

    let stream: MediaStream | null = null
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((type) => MediaRecorder.isTypeSupported(type))
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      mediaRecorderRef.current = recorder
      chunksRef.current = []
      durationRef.current = 0
      setRecordingTime(0)

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }
      recorder.onerror = () => setError('The recording could not be completed. Try again.')
      recorder.onstop = () => {
        const blobType = recorder.mimeType || chunksRef.current[0]?.type || 'audio/webm'
        const blob = new Blob(chunksRef.current, { type: blobType })
        setAudioBlob(blob)
        stream?.getTracks().forEach((track) => track.stop())
        streamRef.current = null

        const recording: VoiceRecordingData = {
          blob,
          duration: durationRef.current,
          timestamp: Date.now(),
        }
        onRecordingComplete?.(recording)
        void processAudioWithAI(recording)
      }

      recorder.start()
      setIsRecording(true)
      let elapsed = 0
      timerRef.current = window.setInterval(() => {
        elapsed += 1
        durationRef.current = elapsed
        setRecordingTime(elapsed)
        if (elapsed >= MAX_RECORDING_SECONDS) stopRecording()
      }, 1000)
    } catch {
      stream?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      setError('Microphone access was not granted. Allow microphone access and try again.')
    }
  }

  const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
  const urgencyVariant = analysisResult?.analysis.urgency === 'critical'
    ? 'destructive'
    : analysisResult?.analysis.urgency === 'high'
      ? 'secondary'
      : 'outline'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Brain aria-hidden="true" className="size-5 text-primary" />
          <CardTitle>Voice Scenario Analysis</CardTitle>
        </div>
        <CardDescription>
          Record up to 30 seconds. The audio is sent for transcription and analysis, then discarded; it is not saved to your profile.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {error && (
          <Alert role="alert" className="border-destructive/30 bg-destructive/10">
            <AlertTriangle aria-hidden="true" className="size-4 text-destructive" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {!isRecording ? (
            <Button onClick={startRecording} disabled={isProcessing}>
              <Mic aria-hidden="true" data-icon="inline-start" />
              Start recording
            </Button>
          ) : (
            <Button onClick={stopRecording} variant="destructive">
              <Square aria-hidden="true" data-icon="inline-start" />
              Stop · {formatTime(recordingTime)}
            </Button>
          )}
          {audioBlob && !isRecording && (
            <Button onClick={clearRecording} variant="outline" disabled={isProcessing}>Clear recording</Button>
          )}
        </div>

        {isRecording && (
          <p role="status" className="text-sm text-muted-foreground">
            Recording {formatTime(recordingTime)} / {formatTime(MAX_RECORDING_SECONDS)}. Stop early if you are done.
          </p>
        )}
        {audioUrl && <audio controls src={audioUrl} aria-label="Recorded voice message" className="w-full" />}
        {isProcessing && (
          <Alert role="status" className="border-primary/20 bg-primary/5">
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin text-primary" />
            <AlertDescription>Transcribing and analyzing your recording. No alert or message is being sent.</AlertDescription>
          </Alert>
        )}
        {analysisResult && (
          <div className="flex flex-col gap-4 rounded-lg border border-border bg-muted/50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold">Voice analysis</h3>
              <Badge variant={urgencyVariant}>{analysisResult.analysis.urgency} · demo classification</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{analysisResult.transcript}</p>
            <p className="text-sm leading-relaxed">{analysisResult.analysis.summary}</p>
            {analysisResult.analysis.factors.length > 0 && (
              <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-muted-foreground">
                {analysisResult.analysis.factors.map((factor, index) => <li key={`${index}-${factor}`}>{factor}</li>)}
              </ul>
            )}
            <p className="text-xs text-muted-foreground">This result was not saved. AI output can be incomplete or wrong.</p>
          </div>
        )}

        <Alert role="note" className="border-primary/20 bg-primary/5">
          <AlertDescription>
            Starting a recording sends its audio to the AI Gateway for transcription. SafeNet does not store recordings, dispatch responders, or contact emergency services.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
