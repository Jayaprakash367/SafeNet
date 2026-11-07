'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Phone, MapPin, Heart, Car, Home, Zap, MessageSquare, Brain } from 'lucide-react'

interface QuickActionsProps {
  userLocation: { lat: number; lng: number } | null
  onLocationChange: (location: { lat: number; lng: number } | null) => void
  onEmergencyTypeSelect: (type: string) => void
}

export function QuickActions({ userLocation, onLocationChange, onEmergencyTypeSelect }: QuickActionsProps) {
  const [statusMessage, setStatusMessage] = useState('')
  const [isSharing, setIsSharing] = useState(false)

  const shareLocation = async () => {
    setIsSharing(true)
    setStatusMessage('')

    try {
      const location = userLocation ?? await new Promise<{ lat: number; lng: number; accuracy: number }>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Location is not available in this browser.'))
          return
        }
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => resolve({ lat: coords.latitude, lng: coords.longitude, accuracy: coords.accuracy }),
          () => reject(new Error('Allow location access to share your coordinates.')),
          { timeout: 10000, enableHighAccuracy: true, maximumAge: 300000 },
        )
      })
      onLocationChange(location)
      const mapUrl = `https://maps.google.com/?q=${location.lat},${location.lng}`
      const text = `My SafeNet location: ${mapUrl}`

      if (navigator.share) {
        await navigator.share({ title: 'SafeNet location', text })
        setStatusMessage('Location shared using your device share sheet.')
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
        setStatusMessage('Location link copied to the clipboard.')
      } else {
        throw new Error('This browser cannot share or copy the location link.')
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setStatusMessage(error instanceof Error ? error.message : 'Location could not be shared.')
    } finally {
      setIsSharing(false)
    }
  }

  const quickActions = [
    { icon: Phone, title: 'Call 911 (US)', description: 'Opens your phone app', kind: 'call', variant: 'destructive' as const },
    { icon: Heart, title: 'Medical Emergency', description: 'Select a medical SOS', kind: 'emergency', emergencyType: 'Medical Emergency', variant: 'secondary' as const },
    { icon: Car, title: 'Road Accident', description: 'Select an accident SOS', kind: 'emergency', emergencyType: 'Road Accident', variant: 'outline' as const },
    { icon: Home, title: 'Home Emergency', description: 'Select a home emergency SOS', kind: 'emergency', emergencyType: 'Home Emergency', variant: 'outline' as const },
    { icon: Zap, title: 'Natural Disaster', description: 'Select a disaster SOS', kind: 'emergency', emergencyType: 'Natural Disaster', variant: 'outline' as const },
    { icon: MapPin, title: 'Share Location', description: 'Share or copy your GPS link', kind: 'share', variant: 'outline' as const },
  ]

  const navigationActions = [
    { icon: MessageSquare, title: 'Communication Center', description: 'SMS & emergency contacts', href: '/communication' },
    { icon: MapPin, title: 'Maps & Alerts', description: 'Emergency resources & disasters', href: '/maps' },
    { icon: Brain, title: 'AI Demo Center', description: 'Explore the AI demonstration', href: '/ai-demo' },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Quick Emergency Actions</CardTitle>
          <CardDescription>Select an incident type or open the phone app. Selecting a type does not send an alert.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action) => (
              <Button
                key={action.title}
                type="button"
                variant={action.variant}
                className="h-auto flex flex-col items-start gap-2 p-4 text-left"
                disabled={action.kind === 'share' && isSharing}
                onClick={() => {
                  if (action.kind === 'call') {
                    window.location.href = 'tel:911'
                    return
                  }
                  if (action.kind === 'share') {
                    void shareLocation()
                    return
                  }
                  onEmergencyTypeSelect(action.emergencyType ?? 'General Emergency')
                  setStatusMessage(`${action.emergencyType} selected. Press SOS to start a 5-second countdown; cancel it if needed.`)
                }}
              >
                <span className="flex w-full items-center gap-2">
                  <action.icon aria-hidden="true" className="size-5 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{action.kind === 'share' && isSharing ? 'Sharing…' : action.title}</span>
                    <span className="block text-pretty text-xs opacity-70">{action.description}</span>
                  </span>
                </span>
              </Button>
            ))}
          </div>
          {statusMessage && (
            <Alert role="status" className="border-primary/20 bg-primary/5">
              <AlertDescription>{statusMessage}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SafeNet Features</CardTitle>
          <CardDescription>Open additional safety tools.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {navigationActions.map((action) => (
              <Button key={action.href} asChild variant="outline" className="h-auto w-full p-4 text-left">
                <Link href={action.href} className="flex flex-col items-start gap-2">
                  <span className="flex w-full items-center gap-2">
                    <action.icon aria-hidden="true" className="size-5 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{action.title}</span>
                      <span className="block text-pretty text-xs opacity-70">{action.description}</span>
                    </span>
                  </span>
                </Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
