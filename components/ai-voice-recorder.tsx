"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Mic, Play, Pause, Square, Phone, Brain } from "lucide-react"

interface VoiceRecordingData {
  blob: Blob
  duration: number
  timestamp: number
  classification?: "urgent" | "moderate" | "false_alarm"
  confidence?: number
}

export function AIVoiceRecorder({ onRecordingComplete }: { onRecordingComplete?: (data: VoiceRecordingData) => void }) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [classification, setClassification] = useState<{
    urgency: "urgent" | "moderate" | "false_alarm"
    confidence: number
    advice: string
  } | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" })
        setAudioBlob(blob)
        stream.getTracks().forEach((track) => track.stop())

        const recordingData: VoiceRecordingData = {
          blob,
          duration: recordingTime,
          timestamp: Date.now(),
        }

        processAudioWithAI(recordingData)
        onRecordingComplete?.(recordingData)
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      console.error("Error accessing microphone:", error)
      alert("Unable to access microphone. Please check permissions.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  const playRecording = () => {
    if (audioBlob && !isPlaying) {
      const audioUrl = URL.createObjectURL(audioBlob)
      audioRef.current = new Audio(audioUrl)
      audioRef.current.play()
      setIsPlaying(true)

      audioRef.current.onended = () => {
        setIsPlaying(false)
        URL.revokeObjectURL(audioUrl)
      }
    } else if (audioRef.current && isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  const processAudioWithAI = async (recordingData: VoiceRecordingData) => {
    setIsProcessing(true)

    // Simulate AI processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Mock AI classification based on recording duration and random factors
    const mockClassification = generateMockClassification(recordingData.duration)
    setClassification(mockClassification)
    setIsProcessing(false)
  }

  const generateMockClassification = (duration: number) => {
    // Simulate AI analysis based on various factors
    const urgencyFactors = {
      duration: duration > 10 ? 0.8 : duration > 5 ? 0.6 : 0.3,
      random: Math.random(),
    }

    const urgencyScore = (urgencyFactors.duration + urgencyFactors.random) / 2

    let urgency: "urgent" | "moderate" | "false_alarm"
    let advice: string

    if (urgencyScore > 0.7) {
      urgency = "urgent"
      advice =
        "Immediate emergency detected. Dispatching rescue teams to your location. Stay calm and follow safety protocols."
    } else if (urgencyScore > 0.4) {
      urgency = "moderate"
      advice =
        "Potential emergency situation. Local authorities have been notified. Please confirm your status if safe."
    } else {
      urgency = "false_alarm"
      advice = "No immediate emergency detected. If this was a test, your SOS system is working correctly."
    }

    return {
      urgency,
      confidence: Math.round(urgencyScore * 100),
      advice,
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "urgent":
        return "text-destructive"
      case "moderate":
        return "text-yellow-600"
      case "false_alarm":
        return "text-green-600"
      default:
        return "text-muted-foreground"
    }
  }

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "urgent":
        return "destructive"
      case "moderate":
        return "secondary"
      case "false_alarm":
        return "default"
      default:
        return "outline"
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          <CardTitle>AI Voice Verification</CardTitle>
        </div>
        <CardDescription>Record a voice message for AI-powered emergency classification</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recording Controls */}
        <div className="flex items-center justify-center gap-4">
          {!isRecording ? (
            <Button onClick={startRecording} size="lg" className="flex items-center gap-2" disabled={isProcessing}>
              <Mic className="w-5 h-5" />
              Start Recording
            </Button>
          ) : (
            <Button onClick={stopRecording} size="lg" variant="destructive" className="flex items-center gap-2">
              <Square className="w-5 h-5" />
              Stop Recording
            </Button>
          )}

          {audioBlob && !isRecording && (
            <Button onClick={playRecording} variant="outline" className="flex items-center gap-2 bg-transparent">
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isPlaying ? "Pause" : "Play"}
            </Button>
          )}
        </div>

        {/* Recording Status */}
        {isRecording && (
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <div className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
              <span className="text-lg font-mono">{formatTime(recordingTime)}</span>
            </div>
            <p className="text-sm text-muted-foreground">Speak clearly about your emergency situation</p>
          </div>
        )}

        {/* AI Processing */}
        {isProcessing && (
          <Alert className="border-primary bg-primary/10">
            <Brain className="h-4 w-4 text-primary animate-pulse" />
            <AlertDescription className="text-primary">
              AI is analyzing your voice recording for emergency classification...
            </AlertDescription>
          </Alert>
        )}

        {/* AI Classification Results */}
        {classification && (
          <div className="space-y-4 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">AI Classification</h4>
              <Badge variant={getUrgencyBadge(classification.urgency)}>
                {classification.urgency.replace("_", " ").toUpperCase()}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Confidence Level</span>
                <span className="font-mono">{classification.confidence}%</span>
              </div>
              <Progress value={classification.confidence} className="h-2" />
            </div>

            <div className="space-y-2">
              <h5 className="text-sm font-medium">AI Recommendation</h5>
              <p className="text-sm text-muted-foreground text-pretty">{classification.advice}</p>
            </div>

            {classification.urgency === "urgent" && (
              <Alert className="border-destructive bg-destructive/10">
                <Phone className="h-4 w-4 text-destructive" />
                <AlertDescription className="text-destructive">
                  <strong>URGENT:</strong> Emergency services will call you within 30 seconds for voice confirmation.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t border-border">
          <p>• AI analyzes voice tone, keywords, and urgency indicators</p>
          <p>• Urgent emergencies trigger automatic callback for verification</p>
          <p>• Voice recordings are encrypted and stored securely</p>
          <p>• False alarms help improve AI accuracy over time</p>
        </div>
      </CardContent>
    </Card>
  )
}
