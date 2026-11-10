'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { isReservedDemoPhone } from '@/lib/auth'
import { isEmergencyProfileComplete, useAuthUser, useEmergencyProfile, useSosAlertHistory } from '@/lib/supabase/hooks'
import { EmergencyProfile } from '@/components/emergency-profile'
import { SosAlertHistory } from '@/components/sos-alert-history'
import { LocationTracker } from '@/components/location-tracker'
import { DisasterAlerts } from '@/components/disaster-alerts'
import { QuickActions } from '@/components/quick-actions'
import { TestSMSButton } from '@/components/test-sms-button'
import WeatherAlerts from '@/components/weather-alerts'
import { UserProfileHeader } from '@/components/user-profile-header'
import { SOSButton } from '@/components/sos-button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, MapPin, Phone, Shield, Users, Zap } from 'lucide-react'

const featureHighlights = [
  {
    icon: Phone,
    title: 'Emergency contact alerts',
    description: 'Send a saved SOS alert to your emergency contacts by SMS.',
  },
  {
    icon: MapPin,
    title: 'Smart location sharing',
    description: 'Share GPS coordinates from your device when you choose.',
  },
  {
    icon: Users,
    title: 'Private safety profile',
    description: 'Keep medical details and contacts protected by your account.',
  },
]

export default function SafeNetDashboard() {
  const router = useRouter()
  const { user, isLoading, error: authError } = useAuthUser()
  const [hasMounted, setHasMounted] = useState(false)
  const isAuthReady = hasMounted && !isLoading
  const activeUser = isAuthReady ? user : null
  const {
    profile,
    error: profileError,
    isLoading: isProfileLoading,
  } = useEmergencyProfile(activeUser?.id ?? '')
  const {
    alerts: recentSosAlerts,
    error: sosHistoryError,
    isLoading: isSosHistoryLoading,
    refresh: refreshSosHistory,
  } = useSosAlertHistory(activeUser?.id ?? '')
  const hasDemoContact = isReservedDemoPhone(profile.emergencyContact1)
  const hasReadyProfile = Boolean(
    activeUser &&
      isAuthReady &&
      !authError &&
      !profileError &&
      !isProfileLoading &&
      isEmergencyProfileComplete(profile),
  )
  const privateFeatureMessage = (() => {
    if (!isAuthReady) return 'Checking your SafeNet account.'
    if (authError) return 'Your account could not be verified. Sign in again to use private safety features.'
    if (!activeUser) return 'Sign in to save your emergency profile and send SOS alerts or SMS tests.'
    if (profileError) return 'Your emergency profile could not be loaded. Profile-based features are paused.'
    if (isProfileLoading) return 'Loading your emergency profile.'
    if (!isEmergencyProfileComplete(profile)) return 'Complete your emergency profile to enable SOS alerts and SMS tests.'
    return 'Your private emergency profile is ready for SOS alerts.'
  })()
  const [isSOSActive, setIsSOSActive] = useState(false)
  const [selectedEmergencyType, setSelectedEmergencyType] = useState('General Emergency')
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline'>('online')
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    setHasMounted(true)
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
              <p className="hidden text-xs font-medium text-muted-foreground sm:block">Emergency Response</p>
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
            {activeUser ? (
              <UserProfileHeader user={activeUser} />
            ) : (
              <Button asChild variant="outline" size="sm" className="h-8 rounded-full px-4">
                <Link href="/login?next=%2F">Sign in</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-5 px-3 py-5 sm:gap-6 sm:px-6 sm:py-8">
        {isAuthReady && authError && (
          <Alert className="border-destructive/30 bg-destructive/10" role="alert">
            <AlertTriangle aria-hidden="true" className="size-4 text-destructive" />
            <AlertDescription>
              Your account could not be verified. Sign in again before using private safety features.
            </AlertDescription>
          </Alert>
        )}
        {isAuthReady && !activeUser && !authError && (
          <Alert className="border-primary/20 bg-primary/5" role="status">
            <Shield aria-hidden="true" className="size-4 text-primary" />
            <AlertDescription>
              The dashboard is open to everyone. Sign in to save your emergency profile, send SOS alerts to your contacts, and test SMS delivery.
            </AlertDescription>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button asChild size="sm"><Link href="/login?next=%2F">Sign in</Link></Button>
              <Button asChild size="sm" variant="outline"><Link href="/sign-up?next=%2Fprofile">Create account</Link></Button>
            </div>
          </Alert>
        )}
        {user && profileError && (
          <Alert className="border-destructive/30 bg-destructive/10" role="alert">
            <AlertTriangle aria-hidden="true" className="size-4 text-destructive" />
            <AlertDescription>
              Your emergency profile could not be loaded. SOS and SMS features are paused until it is available.
            </AlertDescription>
          </Alert>
        )}
        {isSOSActive && (
          <Alert className="border-destructive/30 bg-destructive/10">
            <AlertTriangle aria-hidden="true" className="size-4 text-destructive" />
            <AlertDescription className="font-medium text-destructive">
              Your SafeNet alert was saved. SMS notifications cannot be recalled; SafeNet does not dispatch emergency services.
            </AlertDescription>
          </Alert>
        )}

        <Card id="sos-section" className="overflow-hidden border-primary/10 shadow-xl shadow-primary/5">
          <CardHeader className="bg-gradient-to-b from-primary/5 to-transparent pb-4 text-center sm:pb-6">
            <CardTitle className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-balance text-2xl font-bold text-transparent sm:text-3xl">
              Emergency SOS System
            </CardTitle>
            <CardDescription className="mx-auto max-w-2xl text-pretty text-base sm:text-lg">
              Save an SOS alert and notify your saved emergency contacts by SMS when configured.
              {selectedEmergencyType !== 'General Emergency' && (
                <span className="mt-1 block font-medium text-primary">Selected: {selectedEmergencyType}</span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-6 sm:pb-8">
            <div className={isSOSActive ? 'pulse-sos rounded-full' : 'relative'}>
              <SOSButton
                isActive={isSOSActive}
                onActivate={() => {
                  setIsSOSActive(true)
                  void refreshSosHistory().catch(() => undefined)
                }}
                onDeactivate={() => setIsSOSActive(false)}
                userLocation={userLocation}
                connectionStatus={connectionStatus}
                emergencyType={selectedEmergencyType}
                canActivate={hasReadyProfile}
                accessMessage={privateFeatureMessage}
                onAccessRequired={() => router.push(activeUser ? '/profile' : '/login?next=%2Fprofile')}
              />
            </div>
          </CardContent>
        </Card>

        {activeUser && (
          <SosAlertHistory alerts={recentSosAlerts} isLoading={isSosHistoryLoading} error={sosHistoryError} />
        )}

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-lg font-bold">SMS System Test</CardTitle>
            <CardDescription>Verify delivery to your first saved emergency contact.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <TestSMSButton
              canSend={hasReadyProfile}
              accessMessage={privateFeatureMessage}
              isDemoContact={hasDemoContact}
              onAccessRequired={() => router.push(activeUser ? '/profile' : '/login?next=%2Fprofile')}
            />
          </CardContent>
        </Card>

        <QuickActions
          userLocation={userLocation}
          onLocationChange={setUserLocation}
          onEmergencyTypeSelect={(type) => {
            setSelectedEmergencyType(type)
            document.getElementById('sos-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }}
        />

        <WeatherAlerts location={userLocation} />

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          {activeUser ? (
            <EmergencyProfile userId={activeUser.id} />
          ) : (
            <Card className="border-border/80 shadow-sm">
              <CardHeader>
                <CardTitle>Emergency Profile</CardTitle>
                <CardDescription>
                  Medical details and emergency contacts stay private to your profile.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="border-primary/15 bg-primary/5" role="status">
                  <Shield aria-hidden="true" className="size-4 text-primary" />
                  <AlertDescription>{privateFeatureMessage}</AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
          <LocationTracker onLocationChange={setUserLocation} />
        </div>

        <DisasterAlerts location={userLocation} />

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
