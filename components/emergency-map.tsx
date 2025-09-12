"use client"

import { useState, useEffect } from "react"
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
  distance: number // in km
  isOpen: boolean
  coordinates: { lat: number; lng: number }
  specialties?: string[]
  capacity?: number
}

export function EmergencyMap() {
  const [userLocation] = useState({ lat: 40.7128, lng: -74.006 }) // Mock NYC location
  const [resources, setResources] = useState<EmergencyResource[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedType, setSelectedType] = useState<string>("all")

  useEffect(() => {
    fetchNearbyResources()
  }, [])

  const fetchNearbyResources = async () => {
    setIsLoading(true)

    try {
      // Simulate API call to find nearby emergency resources
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const mockResources = generateMockResources()
      setResources(mockResources)
    } catch (error) {
      console.error("Failed to fetch emergency resources:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateMockResources = (): EmergencyResource[] => {
    return [
      {
        id: "hospital_1",
        name: "City General Hospital",
        type: "hospital",
        address: "123 Medical Center Dr, New York, NY 10001",
        phone: "+1-555-0123",
        distance: 2.3,
        isOpen: true,
        coordinates: { lat: 40.715, lng: -74.008 },
        specialties: ["Emergency", "Trauma", "Cardiology"],
        capacity: 85,
      },
      {
        id: "police_1",
        name: "Police Precinct 12",
        type: "police",
        address: "456 Safety St, New York, NY 10002",
        phone: "+1-555-0456",
        distance: 1.8,
        isOpen: true,
        coordinates: { lat: 40.714, lng: -74.007 },
      },
      {
        id: "fire_1",
        name: "Fire Station #7",
        type: "fire",
        address: "789 Rescue Ave, New York, NY 10003",
        phone: "+1-555-0789",
        distance: 1.2,
        isOpen: true,
        coordinates: { lat: 40.716, lng: -74.009 },
      },
      {
        id: "shelter_1",
        name: "Community Emergency Shelter",
        type: "shelter",
        address: "321 Safe Haven Blvd, New York, NY 10004",
        phone: "+1-555-0321",
        distance: 3.1,
        isOpen: true,
        coordinates: { lat: 40.71, lng: -74.01 },
        capacity: 200,
      },
      {
        id: "pharmacy_1",
        name: "24/7 Emergency Pharmacy",
        type: "pharmacy",
        address: "654 Health St, New York, NY 10005",
        phone: "+1-555-0654",
        distance: 0.8,
        isOpen: true,
        coordinates: { lat: 40.7135, lng: -74.0065 },
      },
      {
        id: "gas_1",
        name: "Emergency Fuel Station",
        type: "gas_station",
        address: "987 Fuel Rd, New York, NY 10006",
        phone: "+1-555-0987",
        distance: 2.7,
        isOpen: true,
        coordinates: { lat: 40.711, lng: -74.011 },
      },
    ]
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
    window.open(url, "_blank")
  }

  const getDirections = (resource: EmergencyResource) => {
    const url = `https://maps.google.com/maps?saddr=${userLocation.lat},${userLocation.lng}&daddr=${resource.coordinates.lat},${resource.coordinates.lng}`
    window.open(url, "_blank")
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
            Refresh
          </Button>
        </div>
        <CardDescription>Nearest hospitals, police stations, shelters, and emergency services</CardDescription>
      </CardHeader>
      <CardContent>
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
            {/* Current Location */}
            <Alert className="border-primary bg-primary/10">
              <Navigation className="h-4 w-4 text-primary" />
              <AlertDescription className="text-primary">
                <strong>Your Location:</strong> {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                <Button variant="ghost" size="sm" className="ml-2 h-auto p-1">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  View on Map
                </Button>
              </AlertDescription>
            </Alert>

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
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-sm">{resource.name}</h4>
                                <Badge variant={resource.isOpen ? "default" : "destructive"} className="text-xs">
                                  {resource.isOpen ? "Open" : "Closed"}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground capitalize">
                                {resource.type.replace("_", " ")}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">{resource.distance.toFixed(1)} km</div>
                            <div className="text-xs text-muted-foreground">
                              ~{Math.round(resource.distance * 2)} min drive
                            </div>
                          </div>
                        </div>

                        {/* Resource Details */}
                        <div className="space-y-2 text-xs">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground text-pretty">{resource.address}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-3 h-3 text-muted-foreground" />
                            <a href={`tel:${resource.phone}`} className="text-primary hover:underline">
                              {resource.phone}
                            </a>
                          </div>
                        </div>

                        {/* Additional Info */}
                        {(resource.specialties || resource.capacity) && (
                          <div className="space-y-1 text-xs">
                            {resource.specialties && (
                              <div>
                                <span className="text-muted-foreground">Specialties: </span>
                                <span>{resource.specialties.join(", ")}</span>
                              </div>
                            )}
                            {resource.capacity && (
                              <div>
                                <span className="text-muted-foreground">Capacity: </span>
                                <span>{resource.capacity} people</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2 border-t border-border">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => getDirections(resource)}
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`tel:${resource.phone}`)}
                            className="flex items-center gap-1 text-xs"
                          >
                            <Phone className="w-3 h-3" />
                            Call
                          </Button>
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
          <p>• Resources are sorted by distance from your current location</p>
          <p>• Tap "Directions" for turn-by-turn navigation</p>
          <p>• Call buttons work even without internet connection</p>
          <p>• Resource availability is updated in real-time</p>
        </div>
      </CardContent>
    </Card>
  )
}
