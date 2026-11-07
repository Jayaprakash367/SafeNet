'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MapPin, Navigation, Share, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react'

interface LocationData {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

interface LocationTrackerProps {
  onLocationChange?: (location: { lat: number; lng: number; accuracy: number } | null) => void
}

export function LocationTracker({ onLocationChange }: LocationTrackerProps) {
  const [location, setLocation] = useState<LocationData | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState('')
  const [isSharing, setIsSharing] = useState(false)

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.')
      onLocationChange?.(null)
      return
    }

    setIsTracking(true)
    setError(null)
    setStatusMessage('')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now(),
        }
        setLocation(locationData)
        onLocationChange?.({ lat: locationData.latitude, lng: locationData.longitude, accuracy: locationData.accuracy })
        setIsTracking(false)
      },
      (positionError) => {
        const messages: Record<number, string> = {
          [positionError.PERMISSION_DENIED]: 'Location access was denied. Allow location access and try again.',
          [positionError.POSITION_UNAVAILABLE]: 'Your current location is unavailable.',
          [positionError.TIMEOUT]: 'The location request timed out. Try again.',
        }
        setError(messages[positionError.code] ?? 'Your location could not be read.')
        onLocationChange?.(null)
        setIsTracking(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )
  }

  const shareLocation = async () => {
    if (!location) return

    setIsSharing(true)
    setStatusMessage('')
    const mapUrl = `https://maps.google.com/?q=${location.latitude},${location.longitude}`
    const locationMessage = `SafeNet location: ${mapUrl}\nCoordinates: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}\nAccuracy: ${location.accuracy.toFixed(0)} m`

    try {
      if (navigator.share) {
        await navigator.share({ title: 'SafeNet location', text: locationMessage })
        setStatusMessage('Location shared using your device share sheet.')
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(locationMessage)
        setStatusMessage('Location link copied to the clipboard.')
      } else {
        throw new Error('This browser cannot share or copy the location link.')
      }
    } catch (shareError) {
      if (shareError instanceof DOMException && shareError.name === 'AbortError') return
      setError(shareError instanceof Error ? shareError.message : 'Location could not be shared.')
    } finally {
      setIsSharing(false)
    }
  }

  const formatCoordinates = (lat: number, lng: number) => `${lat.toFixed(6)}, ${lng.toFixed(6)}`
  const getAccuracyColor = (accuracy: number) => {
    if (accuracy <= 10) return 'bg-green-500'
    if (accuracy <= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin aria-hidden="true" className="size-5 text-primary" />
            <CardTitle>Location Tracker</CardTitle>
          </div>
          <Badge variant={location ? 'default' : 'secondary'}>{location ? 'Located' : 'Not located'}</Badge>
        </div>
        <CardDescription>Location is requested only when you choose to use it.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert className="border-destructive bg-destructive/10" role="alert">
            <AlertTriangle aria-hidden="true" className="size-4 text-destructive" />
            <AlertDescription className="text-destructive">{error}</AlertDescription>
          </Alert>
        )}
        {statusMessage && (
          <Alert role="status" className="border-primary/20 bg-primary/5">
            <CheckCircle aria-hidden="true" className="size-4 text-primary" />
            <AlertDescription>{statusMessage}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-wrap gap-2">
          <Button onClick={getCurrentLocation} variant={isTracking ? 'secondary' : 'default'} disabled={isTracking}>
            {isTracking ? <RefreshCw aria-hidden="true" className="animate-spin" data-icon="inline-start" /> : <Navigation aria-hidden="true" data-icon="inline-start" />}
            {isTracking ? 'Getting location…' : location ? 'Refresh location' : 'Get location'}
          </Button>
          {location && (
            <Button onClick={shareLocation} variant="outline" disabled={isSharing}>
              <Share aria-hidden="true" data-icon="inline-start" />
              {isSharing ? 'Sharing…' : 'Share location'}
            </Button>
          )}
        </div>

        {location && (
          <div className="space-y-3 rounded-lg bg-muted p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium">Coordinates</span>
              <Badge variant="outline" className="font-mono text-xs">{formatCoordinates(location.latitude, location.longitude)}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Accuracy</span>
              <div className="flex items-center gap-2">
                <span aria-hidden="true" className={`size-2 rounded-full ${getAccuracyColor(location.accuracy)}`} />
                <span className="text-sm">{location.accuracy.toFixed(0)} m</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Last updated</span>
              <span className="text-sm text-muted-foreground">{new Date(location.timestamp).toLocaleTimeString()}</span>
            </div>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="w-full"
            >
              <a href={`https://maps.google.com/?q=${location.latitude},${location.longitude}`} target="_blank" rel="noopener noreferrer">
                View on Google Maps
              </a>
            </Button>
          </div>
        )}

        <div className="space-y-1 text-xs text-muted-foreground">
          <p>Coordinates are included in an SOS only after you grant location access.</p>
          <p>SafeNet does not automatically send location in the background.</p>
        </div>
      </CardContent>
    </Card>
  )
}
