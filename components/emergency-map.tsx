"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Navigation, Hospital, Shield, Home, Phone, ExternalLink, RefreshCw, Route } from "lucide-react"

interface EmergencyResource {
  id: string
  name: string
  type: "hospital" | "police" | "fire" | "shelter" | "pharmacy" | "gas_station"
  address: string
  phone: string
  distance: number
  openingHours: string | null
  coordinates: { lat: number; lng: number }
  sourceUrl: string
}

export function EmergencyMap() {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [resources, setResources] = useState<EmergencyResource[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')

  const fetchNearbyResources = async () => {
    setIsLoading(true)
    setError('')

    try {
      const location = userLocation ?? await new Promise<{ lat: number; lng: number }>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Location is not supported by this browser.'))
          return
        }
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => resolve({ lat: coords.latitude, lng: coords.longitude }),
          () => reject(new Error('Allow location access to search for nearby resources.')),
          { timeout: 10000, enableHighAccuracy: true, maximumAge: 300000 },
        )
      })
      setUserLocation(location)
      const parameters = new URLSearchParams({
        lat: String(location.lat),
        lng: String(location.lng),
        radius: '10',
        type: 'all',
      })
      const response = await fetch(`/api/emergency-resources?${parameters}`, { cache: 'no-store' })
      const data = (await response.json()) as { resources?: EmergencyResource[]; error?: string }
      if (!response.ok || !Array.isArray(data.resources)) {
        throw new Error(data.error ?? 'Nearby resources could not be loaded.')
      }
      setResources(data.resources)
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Nearby resources could not be loaded.')
    } finally {
      setIsLoading(false)
    }
  }

  const getResourceIcon = (type: EmergencyResource["type"]) => {
    switch (type) {
      case "hospital":
        return Hospital
      case "police":
        return Shield
      case "fire":
        return Shield
      case "shelter":
        return Home
      case "pharmacy":
        return Hospital
      case "gas_station":
        return MapPin
      default:
        return MapPin
    }
  }

  const getResourceColor = (type: EmergencyResource["type"]) => {
    switch (type) {
      case "hospital":
        return "text-red-600"
      case "police":
        return "text-blue-600"
      case "fire":
        return "text-orange-600"
      case "shelter":
        return "text-green-600"
      case "pharmacy":
        return "text-purple-600"
      case "gas_station":
        return "text-gray-600"
      default:
        return "text-muted-foreground"
    }
  }

  const filteredResources = selectedType === "all" ? resources : resources.filter((r) => r.type === selectedType)

  const resourceTypes = [
    { value: "all", label: "All Resources", count: resources.length },
    { value: "hospital", label: "Hospitals", count: resources.filter((r) => r.type === "hospital").length },
    { value: "police", label: "Police", count: resources.filter((r) => r.type === "police").length },
    { value: "fire", label: "Fire Stations", count: resources.filter((r) => r.type === "fire").length },
    { value: "shelter", label: "Shelters", count: resources.filter((r) => r.type === "shelter").length },
    { value: "pharmacy", label: "Pharmacies", count: resources.filter((r) => r.type === "pharmacy").length },
  ]

  const openGoogleMaps = (resource: EmergencyResource) => {
    const url = `https://maps.google.com/?q=${resource.coordinates.lat},${resource.coordinates.lng}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const getDirections = (resource: EmergencyResource) => {
    if (!userLocation) return
    const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${resource.coordinates.lat},${resource.coordinates.lng}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <CardTitle>Emergency Resources Map</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchNearbyResources}
            disabled={isLoading}
            className="flex items-center gap-1 bg-transparent"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading ? 'Searching…' : userLocation ? 'Refresh' : 'Find nearby resources'}
          </Button>
        </div>
        <CardDescription>Nearest hospitals, police stations, shelters, and emergency services</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert role="alert" className="border-destructive/30 bg-destructive/10">
            <AlertDescription>
              {error}
              {userLocation && (
                <span className="mt-2 block">
                  Resource data can be temporarily unavailable. You can still search a map provider for nearby services.
                </span>
              )}
            </AlertDescription>
            {userLocation && (
              <Button asChild variant="outline" size="sm" className="mt-2">
                <a
                  href={`https://www.google.com/maps/search/emergency+services/@${userLocation.lat},${userLocation.lng},14z`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink aria-hidden="true" data-icon="inline-start" />
                  Search nearby services
                </a>
              </Button>
            )}
          </Alert>
        )}
        {!userLocation && !resources.length && !isLoading && !error && (
          <p className="text-sm text-muted-foreground">Choose “Find nearby resources” to allow a one-time location search.</p>
        )}
        <Tabs value={selectedType} onValueChange={setSelectedType} className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            {resourceTypes.slice(0, 6).map((type) => (
              <TabsTrigger key={type.value} value={type.value} className="text-xs">
                {type.label}
                {type.count > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {type.count}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedType} className="space-y-4">
            {userLocation && (
              <Alert className="border-primary/20 bg-primary/5">
                <Navigation aria-hidden="true" className="size-4 text-primary" />
                <div className="flex flex-wrap items-center gap-2 text-sm text-primary">
                  <p><strong>Your location:</strong> {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}</p>
                  <Button asChild variant="ghost" size="sm" className="h-auto p-1">
                    <a href={`https://maps.google.com/?q=${userLocation.lat},${userLocation.lng}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink aria-hidden="true" className="mr-1 size-3" />
                      View map
                    </a>
                  </Button>
                </div>
              </Alert>
            )}

            {/* Resources List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
                  <p>Finding nearby emergency resources...</p>
                </div>
              ) : filteredResources.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No {selectedType === "all" ? "" : selectedType} resources found nearby</p>
                </div>
              ) : (
                filteredResources
                  .sort((a, b) => a.distance - b.distance)
                  .map((resource) => {
                    const Icon = getResourceIcon(resource.type)
                    return (
                      <div key={resource.id} className="p-4 bg-muted rounded-lg space-y-3">
                        {/* Resource Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <Icon className={`w-5 h-5 mt-0.5 ${getResourceColor(resource.type)}`} />
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h4 className="font-medium text-sm">{resource.name}</h4>
                                {resource.openingHours && <Badge variant="outline" className="text-xs">Hours listed</Badge>}
                              </div>
                              <p className="text-xs text-muted-foreground capitalize">
                                {resource.type.replace("_", " ")}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">{resource.distance.toFixed(1)} km</div>
                          </div>
                        </div>

                        {/* Resource Details */}
                        <div className="space-y-2 text-xs">
                          <div className="flex items-start gap-2">
                            <MapPin aria-hidden="true" className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
                            <span className="text-pretty text-muted-foreground">{resource.address || 'Address not listed; use map directions.'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone aria-hidden="true" className="size-3 text-muted-foreground" />
                            {resource.phone ? (
                              <a href={`tel:${resource.phone}`} className="text-primary hover:underline">{resource.phone}</a>
                            ) : (
                              <span className="text-muted-foreground">Phone not listed</span>
                            )}
                          </div>
                          {resource.openingHours && <p className="text-muted-foreground">Listed hours: {resource.openingHours}</p>}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2 border-t border-border">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => getDirections(resource)}
                            disabled={!userLocation}
                            className="flex items-center gap-1 text-xs"
                          >
                            <Route className="w-3 h-3" />
                            Directions
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openGoogleMaps(resource)}
                            className="flex items-center gap-1 text-xs"
                          >
                            <ExternalLink className="w-3 h-3" />
                            View Map
                          </Button>
                          {resource.phone ? (
                            <Button asChild variant="outline" size="sm" className="flex items-center gap-1 text-xs">
                              <a href={`tel:${resource.phone}`}>
                                <Phone aria-hidden="true" className="size-3" />
                                Call
                              </a>
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" disabled className="flex items-center gap-1 text-xs">
                              <Phone aria-hidden="true" className="size-3" />
                              No phone
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Map Information */}
        <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t border-border">
          <p>Listings are sourced from <a className="underline underline-offset-2" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>; coverage and contact details may be incomplete.</p>
          <p>• Directions and calls open apps on your device.</p>
          <p>• Verify hours and contact details before traveling.</p>
        </div>
      </CardContent>
    </Card>
  )
}
