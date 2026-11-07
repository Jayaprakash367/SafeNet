"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertTriangle,
  Cloud,
  Zap,
  Waves,
  Wind,
  Thermometer,
  MapPin,
  Clock,
  ExternalLink,
  RefreshCw,
} from "lucide-react"

interface DisasterAlert {
  id: string
  type: "weather" | "earthquake" | "flood" | "fire" | "storm" | "heat" | "other"
  severity: "minor" | "moderate" | "severe" | "extreme"
  title: string
  description: string
  area: string
  issuedAt: number
  expiresAt: number
  source: string
  sourceUrl: string
  actionRequired: boolean
  instructions: string[]
  affectedRadius: number // in km
}

export function DisasterAlerts({ location: dashboardLocation }: { location?: { lat: number; lng: number } | null }) {
  const [alerts, setAlerts] = useState<DisasterAlert[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [error, setError] = useState('')
  const location = dashboardLocation ?? userLocation

  const fetchDisasterAlerts = async () => {
    setIsLoading(true)
    setError('')

    try {
      let coordinates = location
      if (!coordinates) {
        coordinates = await new Promise<{ lat: number; lng: number }>((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error('Location is not supported by this browser.'))
            return
          }
          navigator.geolocation.getCurrentPosition(
            ({ coords }) => resolve({ lat: coords.latitude, lng: coords.longitude }),
            () => reject(new Error('Allow location access to load official alerts for your area.')),
            { timeout: 10000, enableHighAccuracy: true, maximumAge: 300000 },
          )
        })
        setUserLocation(coordinates)
      }

      const parameters = new URLSearchParams({
        lat: String(coordinates.lat),
        lng: String(coordinates.lng),
        radius: '50',
      })
      const response = await fetch(`/api/disaster-alerts?${parameters}`, { cache: 'no-store' })
      const result = (await response.json()) as { alerts?: DisasterAlert[]; error?: string }
      if (!response.ok || !Array.isArray(result.alerts)) {
        throw new Error(result.error ?? 'Official alert sources could not be reached.')
      }

      setAlerts(result.alerts)
      setLastUpdated(Date.now())
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Official alert sources could not be reached.')
    } finally {
      setIsLoading(false)
    }
  }


  const getAlertIcon = (type: DisasterAlert["type"]) => {
    switch (type) {
      case "weather":
        return Cloud
      case "earthquake":
        return Zap
      case "flood":
        return Waves
      case "fire":
        return AlertTriangle
      case "storm":
        return Wind
      case "heat":
        return Thermometer
      default:
        return AlertTriangle
    }
  }

  const getSeverityColor = (severity: DisasterAlert["severity"]) => {
    switch (severity) {
      case "extreme":
        return "text-red-600"
      case "severe":
        return "text-orange-600"
      case "moderate":
        return "text-yellow-600"
      case "minor":
        return "text-blue-600"
      default:
        return "text-muted-foreground"
    }
  }

  const getSeverityBadge = (severity: DisasterAlert["severity"]) => {
    switch (severity) {
      case "extreme":
        return "destructive"
      case "severe":
        return "secondary"
      case "moderate":
        return "outline"
      case "minor":
        return "default"
      default:
        return "outline"
    }
  }

  const formatTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(minutes / 60)

    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return "Just now"
  }

  const formatExpiresIn = (timestamp: number) => {
    const diff = timestamp - Date.now()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ${hours % 24}h`
    if (hours > 0) return `${hours}h`
    return "Soon"
  }

  const activeAlerts = alerts.filter((alert) => alert.expiresAt > Date.now())
  const criticalAlerts = activeAlerts.filter((alert) => alert.severity === "extreme" || alert.severity === "severe")

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-primary" />
            <CardTitle>Disaster Alerts</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={criticalAlerts.length > 0 ? "destructive" : "default"}>{activeAlerts.length} Active</Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDisasterAlerts}
              disabled={isLoading}
              className="flex items-center gap-1 bg-transparent"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
              {isLoading ? 'Loading…' : lastUpdated ? 'Refresh' : 'Find alerts'}
            </Button>
          </div>
        </div>
        <CardDescription>Official alert feeds from the National Weather Service and USGS, where available.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert role="alert" className="border-destructive/30 bg-destructive/10">
            <AlertTriangle aria-hidden="true" className="size-4 text-destructive" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!location && !lastUpdated && !isLoading && !error && (
          <p className="text-sm text-muted-foreground">Choose “Find alerts” to share your location with the alert sources for this request.</p>
        )}

        {/* Critical Alerts Banner */}
        {criticalAlerts.length > 0 && (
          <Alert className="border-destructive bg-destructive/10">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">
              <strong>
                {criticalAlerts.length} Critical Alert{criticalAlerts.length > 1 ? "s" : ""}
              </strong>{" "}
              - Immediate action may be required. Review safety instructions below.
            </AlertDescription>
          </Alert>
        )}

        {/* Last Updated */}
        {lastUpdated && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            Last updated: {new Date(lastUpdated).toLocaleTimeString()}
          </div>
        )}

        {/* Alerts List */}
        <ScrollArea className="h-96">
          <div className="space-y-3">
            {isLoading && alerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
                <p>Loading disaster alerts...</p>
              </div>
            ) : activeAlerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle aria-hidden="true" className="w-8 h-8 mx-auto mb-2 opacity-50" />
                {lastUpdated ? (
                  <>
                    <p>No active disaster alerts in your area</p>
                    <p className="text-xs mt-1">Stay safe and check back regularly</p>
                  </>
                ) : (
                  <>
                    <p>Choose “Find alerts” to check official feeds</p>
                    <p className="text-xs mt-1">No location-based alert check has run yet</p>
                  </>
                )}
              </div>
            ) : (
              activeAlerts.map((alert) => {
                const Icon = getAlertIcon(alert.type)
                return (
                  <div key={alert.id} className="p-4 bg-muted rounded-lg space-y-3">
                    {/* Alert Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Icon className={`w-5 h-5 mt-0.5 ${getSeverityColor(alert.severity)}`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm">{alert.title}</h4>
                            <Badge variant={getSeverityBadge(alert.severity)} className="text-xs">
                              {alert.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground text-pretty">{alert.description}</p>
                        </div>
                      </div>
                    </div>

                    {/* Alert Details */}
                    <div className="grid gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Area:</span>
                        <span>{alert.area}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Issued:</span>
                          <span>{formatTimeAgo(alert.issuedAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Expires:</span>
                          <span>{formatExpiresIn(alert.expiresAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Safety Instructions */}
                    {alert.instructions.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-xs font-medium">Safety Instructions:</h5>
                        <div className="space-y-1">
                          {alert.instructions.map((instruction, index) => (
                            <div key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                              <div className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0" />
                              {instruction}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Required */}
                    {alert.actionRequired && (
                      <Alert className="border-secondary bg-secondary/10">
                        <AlertTriangle className="h-3 w-3 text-secondary" />
                        <AlertDescription className="text-secondary text-xs">
                          <strong>Action Required:</strong> This alert requires immediate attention and preparation.
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Source */}
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <span className="text-xs text-muted-foreground">Source: {alert.source}</span>
                      <Button asChild variant="ghost" size="sm" className="h-auto p-1 text-xs">
                        <a href={alert.sourceUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink aria-hidden="true" className="mr-1 size-3" />
                          Official source
                        </a>
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>

        {/* Information Footer */}
        <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t border-border">
          <p>• NWS alerts cover the United States; USGS earthquake events are global.</p>
          <p>• Alert availability depends on the provider, location, and network.</p>
          <p>• Follow instructions from local emergency authorities and verify official updates.</p>
        </div>
      </CardContent>
    </Card>
  )
}
