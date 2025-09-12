"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AIVoiceRecorder } from "@/components/ai-voice-recorder"
import { AIEmergencyClassifier } from "@/components/ai-emergency-classifier"
import { Brain, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function AIDemoPage() {
  const [selectedEmergency, setSelectedEmergency] = useState<string>("")
  const [mockProfile] = useState({
    age: 45,
    hasDisability: false,
    medicalConditions: ["Diabetes", "Hypertension"],
    isElderly: false,
    hasChildren: true,
  })

  const emergencyTypes = [
    { value: "medical_heart", label: "Medical Emergency - Heart Attack" },
    { value: "fire_building", label: "Fire Emergency - Building Fire" },
    { value: "accident_car", label: "Vehicle Accident - Multi-car Collision" },
    { value: "natural_earthquake", label: "Natural Disaster - Earthquake" },
    { value: "security_break", label: "Security Emergency - Break-in" },
    { value: "other_general", label: "General Emergency" },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
                <ArrowLeft className="w-4 h-4" />
                Back to SafeNet
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
                <Brain className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">AI Demo Center</h1>
                <p className="text-sm text-muted-foreground">Test AI classification and voice recording</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Demo Controls */}
        <Card>
          <CardHeader>
            <CardTitle>AI Emergency Classification Demo</CardTitle>
            <CardDescription>
              Select an emergency type to see how AI classifies and prioritizes the response
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Select value={selectedEmergency} onValueChange={setSelectedEmergency}>
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue placeholder="Select emergency type to analyze" />
                </SelectTrigger>
                <SelectContent>
                  {emergencyTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => setSelectedEmergency("")} variant="outline" disabled={!selectedEmergency}>
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI Components */}
        <div className="grid gap-6 lg:grid-cols-2">
          <AIVoiceRecorder />
          <AIEmergencyClassifier
            emergencyType={selectedEmergency}
            userProfile={mockProfile}
            location={{ lat: 40.7128, lng: -74.006 }}
          />
        </div>

        {/* Demo Information */}
        <Card>
          <CardHeader>
            <CardTitle>How SafeNet AI Works</CardTitle>
            <CardDescription>Understanding the AI-powered emergency response system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <h4 className="font-medium">Voice Analysis</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Analyzes speech patterns, tone, and urgency indicators</li>
                  <li>• Detects keywords related to specific emergency types</li>
                  <li>• Measures background noise and environmental sounds</li>
                  <li>• Classifies emotional state and stress levels</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="font-medium">Priority Classification</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Considers user age, medical conditions, and disabilities</li>
                  <li>• Factors in emergency type and severity indicators</li>
                  <li>• Analyzes location and available resources</li>
                  <li>• Provides estimated response times and recommendations</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
