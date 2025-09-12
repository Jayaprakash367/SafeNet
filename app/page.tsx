"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SOSButton } from "@/components/sos-button"
import { EmergencyProfile } from "@/components/emergency-profile"
import { LocationTracker } from "@/components/location-tracker"
import { DisasterAlerts } from "@/components/disaster-alerts"
import { QuickActions } from "@/components/quick-actions"
import UserProfileHeader from "@/components/user-profile-header"
import { Shield, MapPin, Phone, AlertTriangle, Users, Zap } from "lucide-react"

export default function SafeNetApp() {
  const router = useRouter()
  const [isSOSActive, setIsSOSActive] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<"online" | "offline">("online")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = () => {
      const authStatus = localStorage.getItem("safenet-auth")
      const userData = localStorage.getItem("safenet-user")

      if (authStatus === "true" && userData) {
        setIsAuthenticated(true)
      } else {
        router.push("/login")
        return
      }
      setIsLoading(false)
    }

    checkAuth()

    const updateConnectionStatus = () => {
      setConnectionStatus(navigator.onLine ? "online" : "offline")
    }

    window.addEventListener("online", updateConnectionStatus)
    window.addEventListener("offline", updateConnectionStatus)

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.error("Location access denied:", error)
        },
      )
    }

    return () => {
      window.removeEventListener("online", updateConnectionStatus)
      window.removeEventListener("offline", updateConnectionStatus)
    }
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-red-600 animate-pulse" />
          <span className="text-lg font-medium">Loading SafeNet...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <UserProfileHeader />

      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-lg">
                <Shield className="w-4 h-4 sm:w-6 sm:h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-foreground">SafeNet</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">AI-Powered Emergency SOS</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Badge
                variant={connectionStatus === "online" ? "secondary" : "destructive"}
                className={`text-xs ${connectionStatus === "online" ? "bg-green-100 text-green-800 hover:bg-green-200" : ""}`}
              >
                {connectionStatus === "online" ? "Online" : "Offline"}
              </Badge>
              {userLocation && (
                <Badge variant="outline" className="flex items-center gap-1 text-xs">
                  <MapPin className="w-2 h-2 sm:w-3 sm:h-3" />
                  <span className="hidden sm:inline">Located</span>
                  <span className="sm:hidden">GPS</span>
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {isSOSActive && (
          <Alert className="border-destructive bg-destructive/10">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive font-medium text-sm">
              SOS Alert Active - Emergency services have been notified. Stay calm and follow safety instructions.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 sm:gap-6">
          <Card>
            <CardHeader className="text-center pb-4 sm:pb-6">
              <CardTitle className="text-xl sm:text-2xl font-bold text-balance">Emergency SOS System</CardTitle>
              <CardDescription className="text-base sm:text-lg text-pretty">
                One-tap emergency alert with AI verification and instant response
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pb-6 sm:pb-8">
              <SOSButton
                isActive={isSOSActive}
                onActivate={() => setIsSOSActive(true)}
                onDeactivate={() => setIsSOSActive(false)}
                userLocation={userLocation}
                connectionStatus={connectionStatus}
              />
            </CardContent>
          </Card>
        </div>

        <QuickActions />

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          <EmergencyProfile />
          <LocationTracker />
        </div>

        <DisasterAlerts />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              SafeNet Features
            </CardTitle>
            <CardDescription>Comprehensive emergency response system powered by AI</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg flex-shrink-0">
                  <Phone className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-sm sm:text-base">AI Voice Verification</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Automatic callback and voice recording for urgent emergencies
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg flex-shrink-0">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-sm sm:text-base">Smart Location Sharing</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    GPS coordinates with SMS fallback for offline scenarios
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 sm:col-span-2 lg:col-span-1">
                <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg flex-shrink-0">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-sm sm:text-base">Priority Response</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    AI prioritizes alerts based on user profile and emergency type
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
