'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { isEmergencyProfileComplete, useEmergencyProfile, useGuestUser } from '@/lib/supabase/hooks'
import { EmergencyProfile } from '@/components/emergency-profile'
import { LocationTracker } from '@/components/location-tracker'
import { DisasterAlerts } from '@/components/disaster-alerts'
import { QuickActions } from '@/components/quick-actions'
import { TestSMSButton } from '@/components/test-sms-button'
import WeatherAlerts from '@/components/weather-alerts'
import { UserProfileHeader } from '@/components/user-profile-header'
import { SOSButton } from '@/components/sos-button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, MapPin, Phone, Shield, Users, Zap } from 'lucide-react'

const featureHighlights = [
  {
    icon: Phone,
    title: 'AI Voice Verification',
    description: 'Automatic callback and voice recording for urgent emergencies.',
  },
  {
    icon: MapPin,
    title: 'Smart Location Sharing',
    description: 'Share GPS coordinates with an SMS fallback when connectivity is limited.',
  },
  {
    icon: Users,
    title: 'Priority Response',
    description: 'Prioritize alerts using your emergency profile and incident details.',
  },
]

export default function SafeNetDashboard() {
  const router = useRouter()
  const { user, isLoading, error: guestError, refresh: refreshGuest } = useGuestUser()
  const {
    profile,
    error: profileError,
    isLoading: isProfileLoading,
    refresh: refreshProfile,
  } = useEmergencyProfile(user?.id ?? '')
  const [isSOSActive, setIsSOSActive] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline'>('online')
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    const updateConnectionStatus = () => {
      setConnectionStatus(navigator.onLine ? 'online' : 'offline')
    }

    updateConnectionStatus()
    window.addEventListener('online', updateConnectionStatus)
    window.addEventListener('offline', updateConnectionStatus)

    return () => {
      window.removeEventListener('online', updateConnectionStatus)
      window.removeEventListener('offline', updateConnectionStatus)
    }
  }, [])

  useEffect(() => {
    if (user && !isProfileLoading && !profileError && !isEmergencyProfileComplete(profile)) {
      router.replace('/profile')
    }
  }, [isProfileLoading, profile, profileError, router, user])

  useEffect(() => {
    if (!user || !navigator.geolocation) {
      return
    }

    let isMounted = true
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (isMounted) {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        }
      },
      () => {
        if (isMounted) {
          setUserLocation(null)
        }
      },
      { timeout: 5000, enableHighAccuracy: true, maximumAge: 300000 },
    )

    return () => {
      isMounted = false
    }
  }, [user?.id])

  if (guestError || (user && profileError)) {
    const retry = guestError ? refreshGuest : refreshProfile

    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
        <Card className="w-full max-w-lg border-destructive/20 shadow-lg">
          <CardHeader>
            <CardTitle>SafeNet could not prepare your profile</CardTitle>
            <CardDescription>
              Your private profile session is unavailable. Try again to continue; no password or visible login is needed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => void retry()}>Try again</Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  if (isLoading || !user || isProfileLoading || !isEmergencyProfileComplete(profile)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-sm border-primary/10 shadow-lg shadow-primary/5">
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <Shield aria-hidden="true" className="size-8 animate-pulse text-primary" />
            <div>
              <p className="font-semibold text-foreground">Preparing SafeNet...</p>
              <p className="mt-1 text-sm text-muted-foreground">Opening your profile or emergency dashboard.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-card/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary shadow-md">
              <Shield aria-hidden="true" className="size-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-lg font-bold text-transparent">SafeNet</h1>
              <p className="truncate text-xs font-medium text-muted-foreground">AI Emergency Response</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Badge
              variant="outline"
              className={`h-8 gap-2 rounded-full px-3 text-xs font-semibold ${
                connectionStatus === 'online'
                  ? 'border-green-600/20 bg-green-600/10 text-green-700 dark:text-green-300'
                  : 'border-destructive/25 bg-destructive/10 text-destructive'
              }`}
            >
              <span
                aria-hidden="true"
                className={`size-2 rounded-full ${connectionStatus === 'online' ? 'bg-green-600' : 'bg-destructive'}`}
              />
              {connectionStatus === 'online' ? 'Online' : 'Offline'}
            </Badge>
            {userLocation && (
              <Badge variant="outline" className="hidden h-8 items-center gap-1.5 rounded-full border-primary/20 bg-primary/5 px-3 text-xs font-medium text-primary sm:inline-flex">
                <MapPin aria-hidden="true" className="size-3" />
                GPS
              </Badge>
            )}
            <UserProfileHeader user={user} />
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-5 px-3 py-5 sm:gap-6 sm:px-6 sm:py-8">
        {isSOSActive && (
          <Alert className="border-destructive/30 bg-destructive/10">
            <AlertTriangle aria-hidden="true" className="size-4 text-destructive" />
            <AlertDescription className="font-medium text-destructive">
              SOS alert is active. Keep your phone nearby and follow the safety instructions.
            </AlertDescription>
          </Alert>
        )}

        <Card className="overflow-hidden border-primary/10 shadow-xl shadow-primary/5">
          <CardHeader className="bg-gradient-to-b from-primary/5 to-transparent pb-4 text-center sm:pb-6">
            <CardTitle className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-balance text-2xl font-bold text-transparent sm:text-3xl">
              Emergency SOS System
            </CardTitle>
            <CardDescription className="mx-auto max-w-2xl text-pretty text-base sm:text-lg">
              Start an SOS alert with location sharing and AI-assisted verification.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-6 sm:pb-8">
            <div className={isSOSActive ? 'pulse-sos rounded-full' : 'relative'}>
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

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-lg font-bold">SMS System Test</CardTitle>
            <CardDescription>Check that emergency texts can reach your phone.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <TestSMSButton />
          </CardContent>
        </Card>

        <QuickActions />

        <WeatherAlerts />

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          <EmergencyProfile userId={user.id} />
          <LocationTracker />
        </div>

        <DisasterAlerts />

        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Zap aria-hidden="true" className="size-5 text-primary" />
              SafeNet Features
            </CardTitle>
            <CardDescription>Emergency response tools designed to work together.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featureHighlights.map((feature, index) => {
                const Icon = feature.icon

                return (
                  <div key={feature.title} className={`flex items-start gap-3 ${index === 2 ? 'sm:col-span-2 lg:col-span-1' : ''}`}>
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Icon aria-hidden="true" className="size-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold sm:text-base">{feature.title}</h3>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">{feature.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <footer className="border-t border-border/70 pt-5 text-center text-xs text-muted-foreground">
          <p>For immediate danger, contact your local emergency services.</p>
        </footer>
      </main>
    </div>
  )
}
