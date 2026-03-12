"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Phone, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"

interface SOSButtonProps {
  isActive: boolean
  onActivate: () => void
  onDeactivate: () => void
  userLocation: { lat: number; lng: number } | null
  connectionStatus: "online" | "offline"
}

export function SOSButton({ isActive, onActivate, onDeactivate, userLocation, connectionStatus }: SOSButtonProps) {
  const [countdown, setCountdown] = useState<number | null>(null)
  const [isPressed, setIsPressed] = useState(false)

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (countdown !== null && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => (prev ? prev - 1 : 0))
      }, 1000)
    } else if (countdown === 0) {
      handleSOSActivation()
      setCountdown(null)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [countdown])

  const handleSOSPress = () => {
    if (isActive) {
      onDeactivate()
      setCountdown(null)
      return
    }

    setIsPressed(true)
    setCountdown(5) // 5-second countdown for safety
  }

  const handleSOSActivation = async () => {
    onActivate()
    setIsPressed(false)

    // Get user profile from localStorage
    const profile = JSON.parse(localStorage.getItem("safenet-profile") || "{}")

    const locationData = userLocation
      ? {
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          accuracy: 10, // Default accuracy
        }
      : null

    const alertData = {
      timestamp: new Date().toISOString(),
      location: locationData, // Use properly formatted location
      connectionStatus,
      urgency: "high",
      userId: "user-123",
      profile: {
        name: profile.name || "Unknown User",
        age: profile.age || "Unknown",
        bloodGroup: profile.bloodGroup || "Unknown",
        medicalConditions: profile.medicalConditions || [],
        emergencyContacts: profile.emergencyContacts || [],
      },
    }

    const sendNativeSMS = () => {
      const sosId = `SOS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const locationText = userLocation
        ? `Location: ${userLocation.lat}, ${userLocation.lng}\nGoogle Maps: https://maps.google.com/?q=${userLocation.lat},${userLocation.lng}`
        : "Location: Not available"

      const smsMessage = `🚨 SAFENET SOS ALERT 🚨
ID: ${sosId}
Name: ${profile.name || "Unknown User"}
Age: ${profile.age || "Unknown"}
Blood Group: ${profile.bloodGroup || "Unknown"}
${locationText}
Emergency: General Emergency
Time: ${new Date().toLocaleString()}
Urgency: HIGH

RESCUE NEEDED - User requires immediate assistance!`

      const phoneNumber = "+918825516088" // Your Indian number
      const smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(smsMessage)}`

      try {
        // Create a temporary link element and click it
        const link = document.createElement("a")
        link.href = smsUrl
        link.target = "_blank"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        console.log("[v0] Native SMS app opened with emergency message")
      } catch (error) {
        console.error("[v0] Failed to open native SMS app:", error)
        try {
          window.open(smsUrl, "_blank")
        } catch (fallbackError) {
          console.error("[v0] Fallback method also failed:", fallbackError)
          alert(`Please manually send SMS to ${phoneNumber} with message: ${smsMessage}`)
        }
      }
    }

    try {
      // Send SOS alert via API (Twilio)
      const response = await fetch("/api/sos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...alertData,
          emergencyType: "General Emergency",
          adminNotificationNumber: "+918825516088", // Your Indian number for notifications (E.164 format)
        }),
      })

      if (response.ok) {
        console.log("SOS alert sent successfully via Twilio")
        sendNativeSMS()
      } else {
        console.error("Failed to send SOS alert via Twilio")
        sendNativeSMS()
      }
    } catch (error) {
      console.error("Error sending SOS alert:", error)
      sendNativeSMS()

      if (connectionStatus === "offline") {
        console.log("Offline mode: SOS will be sent when connection is restored")
      }
    }
  }

  const cancelCountdown = () => {
    setCountdown(null)
    setIsPressed(false)
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-sm mx-auto">
      {countdown !== null && (
        <div className="text-center">
          <div className="text-2xl sm:text-3xl font-bold text-destructive mb-2">{countdown}</div>
          <p className="text-xs sm:text-sm text-muted-foreground mb-4">SOS will activate in {countdown} seconds</p>
          <Button variant="outline" size="sm" onClick={cancelCountdown} className="mb-4 bg-transparent">
            Cancel
          </Button>
        </div>
      )}

      <Button
        size="lg"
        variant={isActive ? "destructive" : "secondary"}
        className={cn(
          "w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full text-sm sm:text-base md:text-lg font-bold transition-all duration-200",
          "hover:scale-105 active:scale-95 touch-manipulation", // Added touch-manipulation for better mobile interaction
          isPressed && "animate-pulse",
          isActive && "bg-destructive hover:bg-destructive/90",
        )}
        onClick={handleSOSPress}
      >
        <div className="flex flex-col items-center gap-1 sm:gap-2">
          <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
          {isActive ? "STOP SOS" : "SOS"}
        </div>
      </Button>

      <div className="text-center max-w-sm px-4">
        <p className="text-xs sm:text-sm text-muted-foreground">
          {isActive
            ? "Emergency services notified. Tap to cancel if safe."
            : "Press and hold for 5 seconds to activate emergency SOS"}
        </p>

        <div className="flex items-center justify-center gap-2 sm:gap-4 mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            {connectionStatus === "online" ? (
              <Phone className="w-3 h-3 text-primary" />
            ) : (
              <MessageSquare className="w-3 h-3 text-secondary" />
            )}
            <span className="hidden sm:inline">{connectionStatus === "online" ? "Voice + Data" : "SMS Only"}</span>
            <span className="sm:hidden">{connectionStatus === "online" ? "Online" : "SMS"}</span>
          </div>
          {userLocation && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span className="hidden sm:inline">GPS Ready</span>
              <span className="sm:hidden">GPS</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
