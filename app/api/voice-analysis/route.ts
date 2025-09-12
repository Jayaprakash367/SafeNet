import { type NextRequest, NextResponse } from "next/server"

interface VoiceAnalysisRequest {
  audioData: string // Base64 encoded audio
  duration: number
  userId: string
  location?: {
    latitude: number
    longitude: number
  }
}

interface VoiceAnalysisResponse {
  classification: "urgent" | "moderate" | "false_alarm"
  confidence: number
  keywords: string[]
  emotionalState: "calm" | "stressed" | "panicked" | "unclear"
  backgroundNoise: "quiet" | "moderate" | "loud" | "chaotic"
  recommendedAction: string
  callbackRequired: boolean
}

export async function POST(request: NextRequest) {
  try {
    const { audioData, duration, userId, location }: VoiceAnalysisRequest = await request.json()

    if (!audioData || !userId) {
      return NextResponse.json({ error: "Missing required voice analysis data" }, { status: 400 })
    }

    // Simulate AI voice analysis processing
    const analysis = await analyzeVoiceRecording(audioData, duration)

    // Log analysis for monitoring
    console.log("Voice Analysis Completed:", {
      userId,
      classification: analysis.classification,
      confidence: analysis.confidence,
      duration,
    })

    return NextResponse.json(analysis, { status: 200 })
  } catch (error) {
    console.error("Voice analysis error:", error)
    return NextResponse.json({ error: "Failed to analyze voice recording" }, { status: 500 })
  }
}

async function analyzeVoiceRecording(audioData: string, duration: number): Promise<VoiceAnalysisResponse> {
  // Simulate AI processing time
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // Mock AI analysis based on duration and random factors
  const durationFactor = Math.min(duration / 30, 1) // Normalize to 30 seconds max
  const randomFactor = Math.random()

  // Simulate keyword detection
  const possibleKeywords = [
    "help",
    "emergency",
    "hurt",
    "fire",
    "accident",
    "medical",
    "police",
    "ambulance",
    "danger",
    "trapped",
    "bleeding",
    "pain",
  ]
  const detectedKeywords = possibleKeywords.filter(() => Math.random() > 0.7).slice(0, 3)

  // Calculate urgency score
  const urgencyScore = durationFactor * 0.4 + detectedKeywords.length * 0.2 + randomFactor * 0.4

  let classification: "urgent" | "moderate" | "false_alarm"
  let emotionalState: "calm" | "stressed" | "panicked" | "unclear"
  let backgroundNoise: "quiet" | "moderate" | "loud" | "chaotic"
  let recommendedAction: string

  if (urgencyScore > 0.7) {
    classification = "urgent"
    emotionalState = Math.random() > 0.5 ? "panicked" : "stressed"
    backgroundNoise = Math.random() > 0.6 ? "chaotic" : "loud"
    recommendedAction = "Immediate emergency response required. Initiating callback for voice confirmation."
  } else if (urgencyScore > 0.4) {
    classification = "moderate"
    emotionalState = Math.random() > 0.5 ? "stressed" : "calm"
    backgroundNoise = Math.random() > 0.5 ? "moderate" : "quiet"
    recommendedAction = "Potential emergency detected. Local authorities will be notified."
  } else {
    classification = "false_alarm"
    emotionalState = "calm"
    backgroundNoise = "quiet"
    recommendedAction = "No immediate emergency detected. Recording saved for quality assurance."
  }

  return {
    classification,
    confidence: Math.round(75 + Math.random() * 20), // 75-95% confidence
    keywords: detectedKeywords,
    emotionalState,
    backgroundNoise,
    recommendedAction,
    callbackRequired: classification === "urgent",
  }
}
