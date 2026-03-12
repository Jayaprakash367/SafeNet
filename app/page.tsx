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
import { TestSMSButton } from "@/components/test-sms-button"
import WeatherAlerts from "@/components/weather-alerts"
import UserProfileHeader from "@/components/user-profile-header"
import PWAInstall from "@/components/pwa-install"
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
      const locationOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("[v0] Location access granted")
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          // Handle different types of geolocation errors gracefully
          switch (error.code) {
            case error.PERMISSION_DENIED:
              console.log("[v0] Location access denied by user - app will work without location")
              break
            case error.POSITION_UNAVAILABLE:
              console.log("[v0] Location information unavailable - app will work without location")
              break
            case error.TIMEOUT:
              console.log("[v0] Location request timed out - app will work without location")
              break
            default:
              console.log("[v0] Unknown location error - app will work without location")
              break
          }
          // Don't throw or log error - just continue without location
          setUserLocation(null)
        },
        locationOptions,
      )
    } else {
      console.log("[v0] Geolocation not supported by browser - app will work without location")
      setUserLocation(null)
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

      <header className="border-b border-border/50 bg-card/80 backdrop-blur-lg card-shadow">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary to-secondary rounded-xl shadow-lg">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">SafeNet</h1>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">AI Emergency Response</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Badge
                variant={connectionStatus === "online" ? "secondary" : "destructive"}
                className={`text-xs font-semibold badge-premium ${connectionStatus === "online" ? "bg-green-100 text-green-700 border-green-200" : "bg-primary/10 text-primary border-primary/20"}`}
              >
                {connectionStatus === "online" ? "Online" : "Offline"}
              </Badge>
              {userLocation && (
                <Badge variant="outline" className="flex items-center gap-1 text-xs font-medium badge-premium">
                  <MapPin className="w-3 h-3" />
                  <span className="hidden sm:inline">GPS</span>
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
          <Card className="card-shadow border-primary/10">
            <CardHeader className="text-center pb-4 sm:pb-6 bg-gradient-to-b from-primary/5 to-transparent">
              <CardTitle className="text-2xl sm:text-3xl font-bold text-balance bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Emergency SOS System</CardTitle>
              <CardDescription className="text-base sm:text-lg text-pretty">
                30-second response time with AI verification and instant emergency notification
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pb-6 sm:pb-8">
              <div className={`relative ${isSOSActive ? 'pulse-sos' : ''}`}>
                <SOSButton
                  isActive={isSOSActive}
                  onActivate={() => setIsSOSActive(true)}
                  onDeactivate={() => setIsSOSActive(false)}
                  userLocation={userLocation}
                  connectionStatus={connectionStatus}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-lg font-bold">SMS System Test</CardTitle>
              <CardDescription>Verify that SMS messages can be delivered to your phone</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <TestSMSButton />
            </CardContent>
          </Card>
        </div>

        <QuickActions />

        <WeatherAlerts />

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

      <PWAInstall />
    </div>
  )
}
