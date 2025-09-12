"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Brain, AlertTriangle, Clock, MapPin } from "lucide-react"

interface EmergencyClassification {
  id: string
  type: "medical" | "fire" | "accident" | "natural_disaster" | "security" | "other"
  urgency: "critical" | "high" | "medium" | "low"
  priority: number
  confidence: number
  factors: string[]
  estimatedResponseTime: number
  recommendedActions: string[]
  nearestResources: {
    hospital?: string
    fireStation?: string
    policeStation?: string
  }
}

interface UserProfile {
  age: number
  hasDisability: boolean
  medicalConditions: string[]
  isElderly: boolean
  hasChildren: boolean
}

export function AIEmergencyClassifier({
  emergencyType,
  userProfile,
  location,
}: {
  emergencyType?: string
  userProfile?: UserProfile
  location?: { lat: number; lng: number }
}) {
  const [classification, setClassification] = useState<EmergencyClassification | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  useEffect(() => {
    if (emergencyType) {
      analyzeEmergency(emergencyType, userProfile, location)
    }
  }, [emergencyType, userProfile, location])

  const analyzeEmergency = async (type: string, profile?: UserProfile, coords?: { lat: number; lng: number }) => {
    setIsAnalyzing(true)

    // Simulate AI processing
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const mockClassification = generateClassification(type, profile, coords)
    setClassification(mockClassification)
    setIsAnalyzing(false)
  }

  const generateClassification = (
    type: string,
    profile?: UserProfile,
    coords?: { lat: number; lng: number },
  ): EmergencyClassification => {
    // Base classification
    let emergencyType: EmergencyClassification["type"] = "other"
    let baseUrgency: EmergencyClassification["urgency"] = "medium"
    let basePriority = 50
    const factors: string[] = []

    // Classify emergency type
    if (type.toLowerCase().includes("medical") || type.toLowerCase().includes("health")) {
      emergencyType = "medical"
      baseUrgency = "high"
      basePriority = 80
      factors.push("Medical emergency detected")
    } else if (type.toLowerCase().includes("fire") || type.toLowerCase().includes("smoke")) {
      emergencyType = "fire"
      baseUrgency = "critical"
      basePriority = 95
      factors.push("Fire emergency - immediate evacuation needed")
    } else if (type.toLowerCase().includes("accident") || type.toLowerCase().includes("crash")) {
      emergencyType = "accident"
      baseUrgency = "high"
      basePriority = 75
      factors.push("Vehicle accident reported")
    } else if (type.toLowerCase().includes("flood") || type.toLowerCase().includes("earthquake")) {
      emergencyType = "natural_disaster"
      baseUrgency = "critical"
      basePriority = 90
      factors.push("Natural disaster in progress")
    }

    // Adjust priority based on user profile
    if (profile) {
      if (profile.isElderly || profile.age > 65) {
        basePriority += 15
        factors.push("Elderly person - higher priority")
      }
      if (profile.hasDisability) {
        basePriority += 20
        factors.push("Person with disability - requires special assistance")
      }
      if (profile.hasChildren) {
        basePriority += 10
        factors.push("Children present - family emergency")
      }
      if (profile.medicalConditions.length > 0) {
        basePriority += 10
        factors.push(`Medical conditions: ${profile.medicalConditions.join(", ")}`)
      }
    }

    // Adjust urgency based on final priority
    let finalUrgency: EmergencyClassification["urgency"] = baseUrgency
    if (basePriority >= 90) finalUrgency = "critical"
    else if (basePriority >= 70) finalUrgency = "high"
    else if (basePriority >= 40) finalUrgency = "medium"
    else finalUrgency = "low"

    // Generate response time estimate
    const responseTime =
      finalUrgency === "critical" ? 3 : finalUrgency === "high" ? 8 : finalUrgency === "medium" ? 15 : 30

    // Generate recommendations
    const recommendations = generateRecommendations(emergencyType, finalUrgency)

    return {
      id: `emergency_${Date.now()}`,
      type: emergencyType,
      urgency: finalUrgency,
      priority: Math.min(basePriority, 100),
      confidence: Math.round(85 + Math.random() * 10), // 85-95% confidence
      factors,
      estimatedResponseTime: responseTime,
      recommendedActions: recommendations,
      nearestResources: {
        hospital: "City General Hospital (2.3 km)",
        fireStation: "Fire Station #7 (1.8 km)",
        policeStation: "Police Precinct 12 (3.1 km)",
      },
    }
  }

  const generateRecommendations = (
    type: EmergencyClassification["type"],
    urgency: EmergencyClassification["urgency"],
  ) => {
    const baseRecommendations = [
      "Stay calm and remain in a safe location",
      "Keep your phone charged and accessible",
      "Follow instructions from emergency responders",
    ]

    const typeSpecific: Record<EmergencyClassification["type"], string[]> = {
      medical: [
        "Do not move if injured unless in immediate danger",
        "Apply first aid if trained and safe to do so",
        "Prepare medical information and medications list",
      ],
      fire: [
        "Evacuate immediately if safe to do so",
        "Stay low to avoid smoke inhalation",
        "Do not use elevators during evacuation",
      ],
      accident: [
        "Move to safety away from traffic",
        "Do not move seriously injured persons",
        "Turn on hazard lights if in vehicle",
      ],
      natural_disaster: [
        "Seek shelter in sturdy building",
        "Stay away from windows and glass",
        "Monitor emergency broadcasts for updates",
      ],
      security: ["Move to secure location", "Do not confront intruders", "Provide detailed description to authorities"],
      other: ["Assess immediate safety risks", "Document the situation if safe", "Wait for emergency responders"],
    }

    return [...baseRecommendations, ...typeSpecific[type]]
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return "text-red-600"
      case "high":
        return "text-orange-600"
      case "medium":
        return "text-yellow-600"
      case "low":
        return "text-green-600"
      default:
        return "text-muted-foreground"
    }
  }

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return "destructive"
      case "high":
        return "secondary"
      case "medium":
        return "outline"
      case "low":
        return "default"
      default:
        return "outline"
    }
  }

  if (!emergencyType && !classification) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <CardTitle>AI Emergency Classifier</CardTitle>
          </div>
          <CardDescription>Intelligent emergency analysis and priority classification</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>AI classifier ready to analyze emergency situations</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          <CardTitle>AI Emergency Analysis</CardTitle>
        </div>
        <CardDescription>Real-time emergency classification and response coordination</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAnalyzing && (
          <Alert className="border-primary bg-primary/10">
            <Brain className="h-4 w-4 text-primary animate-pulse" />
            <AlertDescription className="text-primary">
              AI is analyzing emergency situation and determining optimal response...
            </AlertDescription>
          </Alert>
        )}

        {classification && (
          <div className="space-y-4">
            {/* Classification Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className={`w-5 h-5 ${getUrgencyColor(classification.urgency)}`} />
                <span className="font-medium capitalize">{classification.type.replace("_", " ")} Emergency</span>
              </div>
              <Badge variant={getUrgencyBadge(classification.urgency)}>{classification.urgency.toUpperCase()}</Badge>
            </div>

            {/* Priority and Confidence */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Priority Level</span>
                  <span className="font-mono">{classification.priority}/100</span>
                </div>
                <Progress value={classification.priority} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>AI Confidence</span>
                  <span className="font-mono">{classification.confidence}%</span>
                </div>
                <Progress value={classification.confidence} className="h-2" />
              </div>
            </div>

            {/* Response Time */}
            <Alert className="border-primary bg-primary/10">
              <Clock className="h-4 w-4 text-primary" />
              <AlertDescription className="text-primary">
                <strong>Estimated Response Time:</strong> {classification.estimatedResponseTime} minutes
              </AlertDescription>
            </Alert>

            {/* Classification Factors */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Analysis Factors</h4>
              <div className="space-y-1">
                {classification.factors.map((factor, index) => (
                  <div key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                    {factor}
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Actions */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Recommended Actions</h4>
              <div className="space-y-1">
                {classification.recommendedActions.map((action, index) => (
                  <div key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-secondary rounded-full mt-2 flex-shrink-0" />
                    {action}
                  </div>
                ))}
              </div>
            </div>

            {/* Nearest Resources */}
            <div className="space-y-2 pt-4 border-t border-border">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Nearest Emergency Resources
              </h4>
              <div className="grid gap-2 text-sm">
                {classification.nearestResources.hospital && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    <span className="text-muted-foreground">Hospital:</span>
                    <span>{classification.nearestResources.hospital}</span>
                  </div>
                )}
                {classification.nearestResources.fireStation && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full" />
                    <span className="text-muted-foreground">Fire Station:</span>
                    <span>{classification.nearestResources.fireStation}</span>
                  </div>
                )}
                {classification.nearestResources.policeStation && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span className="text-muted-foreground">Police:</span>
                    <span>{classification.nearestResources.policeStation}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
