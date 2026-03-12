"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Cloud, CloudRain, Sun, AlertTriangle, ExternalLink } from "lucide-react"

interface WeatherData {
  location: string
  condition: string
  temperature: number
  rainfall: "heavy" | "moderate" | "low" | "none"
  alert: string
  weatherLink: string
  severity: "red" | "blue" | "green" | "normal"
}

export default function WeatherAlerts() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(false)
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null)

  useEffect(() => {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          })
        },
        (error) => {
          console.log("[v0] Location error:", error)
          // Default to Bangalore coordinates for demo
          setLocation({ lat: 12.9716, lon: 77.5946 })
        },
      )
    }
  }, [])

  const fetchWeather = async () => {
    if (!location) return

    setLoading(true)
    try {
      const response = await fetch("/api/weather", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(location),
      })

      if (response.ok) {
        const data = await response.json()
        setWeather(data)
        console.log("[v0] Weather data received:", data)
      }
    } catch (error) {
      console.error("[v0] Weather fetch error:", error)
    } finally {
      setLoading(false)
    }
  }

  const getRainfallIcon = (rainfall: string) => {
    switch (rainfall) {
      case "heavy":
        return <CloudRain className="h-6 w-6 text-red-500" />
      case "moderate":
        return <Cloud className="h-6 w-6 text-blue-500" />
      case "low":
        return <Cloud className="h-6 w-6 text-green-500" />
      default:
        return <Sun className="h-6 w-6 text-yellow-500" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "red":
        return "border-red-500 bg-red-50"
      case "blue":
        return "border-blue-500 bg-blue-50"
      case "green":
        return "border-green-500 bg-green-50"
      default:
        return "border-gray-200 bg-white"
    }
  }

  const getSeverityIndicator = (severity: string) => {
    switch (severity) {
      case "red":
        return "🔴"
      case "blue":
        return "🔵"
      case "green":
        return "🟢"
      default:
        return "⚪"
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cloud className="h-5 w-5" />
          Weather & Rainfall Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!weather ? (
          <Button onClick={fetchWeather} disabled={loading || !location} className="w-full">
            {loading ? "Getting Weather..." : "Get Weather Update"}
          </Button>
        ) : (
          <div className={`p-4 rounded-lg border-2 ${getSeverityColor(weather.severity)}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {getRainfallIcon(weather.rainfall)}
                <span className="font-semibold">{weather.location}</span>
              </div>
              <span className="text-2xl">{getSeverityIndicator(weather.severity)}</span>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                <strong>Condition:</strong> {weather.condition}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Temperature:</strong> {weather.temperature}°C
              </p>

              {weather.alert && (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-yellow-800 font-medium">{weather.alert}</p>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3 bg-transparent"
                onClick={() => window.open(weather.weatherLink, "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Live Weather Data
              </Button>
            </div>
          </div>
        )}

        <Button variant="ghost" size="sm" onClick={fetchWeather} disabled={loading} className="w-full">
          Refresh Weather
        </Button>
      </CardContent>
    </Card>
  )
}
