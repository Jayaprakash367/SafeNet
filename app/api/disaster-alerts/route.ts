import { type NextRequest, NextResponse } from "next/server"

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
  actionRequired: boolean
  instructions: string[]
  affectedRadius: number
  coordinates: { lat: number; lng: number }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const latitude = Number.parseFloat(searchParams.get("lat") || "0")
    const longitude = Number.parseFloat(searchParams.get("lng") || "0")
    const radius = Number.parseInt(searchParams.get("radius") || "50")

    // Simulate fetching from government APIs (NWS, USGS, etc.)
    const alerts = await fetchDisasterAlerts(latitude, longitude, radius)

    return NextResponse.json(
      {
        location: { latitude, longitude },
        radius,
        count: alerts.length,
        alerts,
        lastUpdated: Date.now(),
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Disaster alerts error:", error)
    return NextResponse.json({ error: "Failed to fetch disaster alerts" }, { status: 500 })
  }
}

async function fetchDisasterAlerts(lat: number, lng: number, radius: number): Promise<DisasterAlert[]> {
  // Simulate API processing time
  await new Promise((resolve) => setTimeout(resolve, 1200))

  const now = Date.now()

  // Mock alerts based on location and current conditions
  const mockAlerts: DisasterAlert[] = [
    {
      id: `weather_${now}_1`,
      type: "weather",
      severity: "moderate",
      title: "Severe Thunderstorm Warning",
      description:
        "Severe thunderstorms with heavy rain, lightning, and possible hail expected in the area. Wind gusts up to 60 mph possible.",
      area: "New York City Metropolitan Area",
      issuedAt: now - 2 * 60 * 60 * 1000, // 2 hours ago
      expiresAt: now + 6 * 60 * 60 * 1000, // 6 hours from now
      source: "National Weather Service",
      actionRequired: true,
      instructions: [
        "Stay indoors and away from windows",
        "Avoid using electrical appliances during the storm",
        "Do not go outside during severe weather",
        "Keep emergency supplies and flashlights ready",
        "Monitor local news for updates",
      ],
      affectedRadius: 75,
      coordinates: { lat: lat + 0.01, lng: lng + 0.01 },
    },
    {
      id: `flood_${now}_2`,
      type: "flood",
      severity: "severe",
      title: "Flash Flood Watch",
      description:
        "Heavy rainfall may cause flash flooding in low-lying areas, urban areas, and near waterways. Up to 3 inches of rain expected.",
      area: "Manhattan and Brooklyn",
      issuedAt: now - 1 * 60 * 60 * 1000, // 1 hour ago
      expiresAt: now + 12 * 60 * 60 * 1000, // 12 hours from now
      source: "National Weather Service",
      actionRequired: true,
      instructions: [
        "Avoid driving through flooded roads - Turn Around, Don't Drown",
        "Move to higher ground if in low-lying areas",
        "Stay away from storm drains and waterways",
        "Have evacuation plan ready if needed",
        "Keep important documents in waterproof container",
      ],
      affectedRadius: 50,
      coordinates: { lat: lat - 0.02, lng: lng - 0.01 },
    },
    {
      id: `heat_${now}_3`,
      type: "heat",
      severity: "minor",
      title: "Heat Advisory",
      description:
        "Temperatures expected to reach dangerous levels. Heat index may exceed 100°F (38°C) during afternoon hours.",
      area: "Tri-State Area",
      issuedAt: now - 30 * 60 * 1000, // 30 minutes ago
      expiresAt: now + 24 * 60 * 60 * 1000, // 24 hours from now
      source: "National Weather Service",
      actionRequired: false,
      instructions: [
        "Stay hydrated and drink plenty of water",
        "Limit outdoor activities during peak hours (11 AM - 4 PM)",
        "Check on elderly neighbors and relatives",
        "Never leave children or pets in vehicles",
        "Seek air-conditioned spaces during hottest part of day",
      ],
      affectedRadius: 100,
      coordinates: { lat, lng },
    },
  ]

  // Filter alerts by proximity (within radius)
  const relevantAlerts = mockAlerts.filter((alert) => {
    const distance = calculateDistance(lat, lng, alert.coordinates.lat, alert.coordinates.lng)
    return distance <= radius
  })

  // Filter out expired alerts
  const activeAlerts = relevantAlerts.filter((alert) => alert.expiresAt > now)

  return activeAlerts
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}
