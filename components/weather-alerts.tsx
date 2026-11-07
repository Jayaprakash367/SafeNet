'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Cloud, CloudRain, Sun, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react'

interface WeatherData {
  location: string
  condition: string
  temperature: number
  rainfall: 'heavy' | 'moderate' | 'low' | 'none'
  alert: string
  weatherLink: string
  severity: 'red' | 'blue' | 'green' | 'normal'
  source: string
}

interface WeatherAlertsProps {
  location: { lat: number; lng: number } | null
}

function getDeviceLocation() {
  return new Promise<{ lat: number; lon: number }>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Location is not supported by this browser.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ lat: coords.latitude, lon: coords.longitude }),
      () => reject(new Error('Allow location access to load weather for your area.')),
      { timeout: 10000, enableHighAccuracy: true, maximumAge: 300000 },
    )
  })
}

export default function WeatherAlerts({ location }: WeatherAlertsProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastLocation, setLastLocation] = useState<{ lat: number; lon: number } | null>(null)

  const fetchWeather = async () => {
    setLoading(true)
    setError('')
    try {
      const coordinates = location
        ? { lat: location.lat, lon: location.lng }
        : lastLocation ?? await getDeviceLocation()
      setLastLocation(coordinates)
      const response = await fetch('/api/weather', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(coordinates),
        cache: 'no-store',
      })
      const data = (await response.json()) as WeatherData | { error?: string }
      if (!response.ok || !('condition' in data)) {
        throw new Error('error' in data && typeof data.error === 'string' ? data.error : 'Weather data could not be loaded.')
      }
      setWeather(data)
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Weather data could not be loaded.')
    } finally {
      setLoading(false)
    }
  }

  const WeatherIcon = weather?.rainfall === 'heavy' || weather?.rainfall === 'moderate'
    ? CloudRain
    : weather?.rainfall === 'low'
      ? Cloud
      : Sun
  const severityStyles = weather?.severity === 'red'
    ? 'border-destructive/40 bg-destructive/5'
    : weather?.severity === 'blue'
      ? 'border-blue-500/30 bg-blue-500/5'
      : weather?.severity === 'green'
        ? 'border-green-600/30 bg-green-600/5'
        : 'border-border bg-card'

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cloud aria-hidden="true" className="size-5" />
          Weather & Rainfall
        </CardTitle>
        <CardDescription>Live conditions from Open-Meteo. Location is used only after permission.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert role="alert" className="border-destructive/30 bg-destructive/10">
            <AlertTriangle aria-hidden="true" className="size-4 text-destructive" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button onClick={fetchWeather} disabled={loading} className="w-full">
          {loading ? <RefreshCw aria-hidden="true" className="animate-spin" data-icon="inline-start" /> : <Cloud aria-hidden="true" data-icon="inline-start" />}
          {loading ? 'Loading local weather…' : weather ? 'Refresh weather' : 'Get weather for my location'}
        </Button>
        {weather && (
          <div className={`space-y-4 rounded-lg border p-4 ${severityStyles}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <WeatherIcon aria-hidden="true" className="size-6 text-primary" />
                <div>
                  <p className="font-semibold">{weather.condition}</p>
                  <p className="text-xs text-muted-foreground">{weather.location}</p>
                </div>
              </div>
              <Badge variant={weather.severity === 'red' ? 'destructive' : 'outline'}>
                {weather.temperature}°C · {weather.rainfall} rain
              </Badge>
            </div>
            {weather.alert && (
              <Alert className="border-secondary/30 bg-secondary/5">
                <AlertTriangle aria-hidden="true" className="size-4 text-secondary" />
                <AlertDescription>{weather.alert}</AlertDescription>
              </Alert>
            )}
            <Button asChild variant="outline" size="sm" className="w-full">
              <a href={weather.weatherLink} target="_blank" rel="noopener noreferrer">
                <ExternalLink aria-hidden="true" data-icon="inline-start" />
                Weather source: {weather.source}
              </a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
