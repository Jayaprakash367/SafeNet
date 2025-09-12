"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MapPin, Navigation, Share, RefreshCw, AlertTriangle } from "lucide-react"

interface LocationData {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
  address?: string
}

export function LocationTracker() {
  const [location, setLocation] = useState<LocationData | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSharing, setIsSharing] = useState(false)

  useEffect(() => {
    if (isTracking) {
      getCurrentLocation()
    }
  }, [isTracking])

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser")
      return
    }

    setError(null)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now(),
        }
        setLocation(locationData)

        // Reverse geocoding (in real app, use proper geocoding service)
        reverseGeocode(locationData.latitude, locationData.longitude)
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setError("Location access denied by user")
            break
          case error.POSITION_UNAVAILABLE:
            setError("Location information unavailable")
            break
          case error.TIMEOUT:
            setError("Location request timed out")
            break
          default:
            setError("An unknown error occurred")
            break
        }
        setIsTracking(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    )
  }

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      // In a real app, use a proper geocoding service like Google Maps or OpenStreetMap
      // For demo purposes, we'll create a mock address
      const mockAddress = `${lat.toFixed(4)}, ${lng.toFixed(4)} (Approximate location)`
      setLocation((prev) => (prev ? { ...prev, address: mockAddress } : null))
    } catch (error) {
      console.error("Reverse geocoding failed:", error)
    }
  }

  const shareLocation = async () => {
    if (!location) return

    setIsSharing(true)

    const locationMessage = `SafeNet Emergency Location:
Coordinates: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}
Accuracy: ${location.accuracy.toFixed(0)}m
Time: ${new Date(location.timestamp).toLocaleString()}
${location.address ? `Address: ${location.address}` : ""}
Google Maps: https://maps.google.com/?q=${location.latitude},${location.longitude}`

    try {
      if (navigator.share) {
        await navigator.share({
          title: "SafeNet Emergency Location",
          text: locationMessage,
        })
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(locationMessage)
        alert("Location copied to clipboard!")
      }
    } catch (error) {
      console.error("Sharing failed:", error)
    } finally {
      setIsSharing(false)
    }
  }

  const formatCoordinates = (lat: number, lng: number) => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
  }

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy <= 10) return "bg-green-500"
    if (accuracy <= 50) return "bg-yellow-500"
    return "bg-red-500"
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <CardTitle>Location Tracker</CardTitle>
          </div>
          <Badge variant={location ? "default" : "secondary"}>{location ? "Located" : "Not Located"}</Badge>
        </div>
        <CardDescription>GPS coordinates for emergency response and location sharing</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert className="border-destructive bg-destructive/10">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button
            onClick={() => setIsTracking(!isTracking)}
            variant={isTracking ? "secondary" : "default"}
            className="flex items-center gap-2"
            disabled={isTracking}
          >
            {isTracking ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Getting Location...
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4" />
                Get Location
              </>
            )}
          </Button>

          {location && (
            <Button
              onClick={shareLocation}
              variant="outline"
              className="flex items-center gap-2 bg-transparent"
              disabled={isSharing}
            >
              <Share className="w-4 h-4" />
              {isSharing ? "Sharing..." : "Share"}
            </Button>
          )}
        </div>

        {location && (
          <div className="space-y-3 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Coordinates</span>
              <Badge variant="outline" className="font-mono text-xs">
                {formatCoordinates(location.latitude, location.longitude)}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Accuracy</span>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getAccuracyColor(location.accuracy)}`} />
                <span className="text-sm">{location.accuracy.toFixed(0)}m</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Last Updated</span>
              <span className="text-sm text-muted-foreground">{new Date(location.timestamp).toLocaleTimeString()}</span>
            </div>

            {location.address && (
              <div className="pt-2 border-t border-border">
                <span className="text-sm font-medium">Address</span>
                <p className="text-sm text-muted-foreground mt-1 text-pretty">{location.address}</p>
              </div>
            )}

            <div className="pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                className="w-full bg-transparent"
                onClick={() =>
                  window.open(`https://maps.google.com/?q=${location.latitude},${location.longitude}`, "_blank")
                }
              >
                View on Google Maps
              </Button>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Location data is used for emergency response coordination</p>
          <p>• GPS coordinates are shared with emergency services during SOS alerts</p>
          <p>• Location sharing works offline via SMS when internet is unavailable</p>
        </div>
      </CardContent>
    </Card>
  )
}
