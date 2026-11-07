import { type NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface DisasterAlert {
  id: string
  type: 'weather' | 'earthquake' | 'flood' | 'fire' | 'storm' | 'heat' | 'other'
  severity: 'minor' | 'moderate' | 'severe' | 'extreme'
  title: string
  description: string
  area: string
  issuedAt: number
  expiresAt: number
  source: string
  sourceUrl: string
  actionRequired: boolean
  instructions: string[]
  affectedRadius: number
  coordinates: { lat: number; lng: number }
}

interface NWSFeature {
  id?: string
  properties?: Record<string, unknown>
}

interface USGSFeature {
  id?: string
  properties?: Record<string, unknown>
  geometry?: { coordinates?: unknown }
}

function isValidCoordinate(value: number, min: number, max: number) {
  return Number.isFinite(value) && value >= min && value <= max
}

function stringValue(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function timestamp(value: unknown, fallback: number) {
  if (typeof value !== 'string') return fallback
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function mapSeverity(value: unknown): DisasterAlert['severity'] {
  switch (value) {
    case 'Extreme': return 'extreme'
    case 'Severe': return 'severe'
    case 'Moderate': return 'moderate'
    case 'Minor': return 'minor'
    default: return 'minor'
  }
}

function mapType(event: string): DisasterAlert['type'] {
  const name = event.toLowerCase()
  if (name.includes('earthquake')) return 'earthquake'
  if (name.includes('flood')) return 'flood'
  if (name.includes('fire')) return 'fire'
  if (name.includes('heat')) return 'heat'
  if (name.includes('wind') || name.includes('hurricane') || name.includes('tornado')) return 'storm'
  if (name.includes('weather') || name.includes('thunderstorm') || name.includes('snow')) return 'weather'
  return 'other'
}

async function fetchNWSAlerts(latitude: number, longitude: number, radius: number): Promise<DisasterAlert[]> {
  const url = new URL('https://api.weather.gov/alerts/active')
  url.searchParams.set('point', `${latitude},${longitude}`)
  const response = await fetch(url, {
    cache: 'no-store',
    headers: {
      Accept: 'application/geo+json, application/json;q=0.9',
      'User-Agent': 'SafeNet/1.0 emergency-information-dashboard',
    },
    signal: AbortSignal.timeout(10000),
  })
  if (!response.ok) throw new Error(`NWS request failed (${response.status})`)

  const data = (await response.json()) as { features?: NWSFeature[] }
  const now = Date.now()
  return (data.features ?? []).flatMap((feature) => {
    const properties = feature.properties ?? {}
    const event = stringValue(properties.event, 'Weather alert')
    const severity = mapSeverity(properties.severity)
    const instructions = stringValue(properties.instruction)
      .split(/\r?\n+/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 6)
    const url = stringValue(properties.web, feature.id ?? '')
    if (!url) return []

    return [{
      id: feature.id ?? url,
      type: mapType(event),
      severity,
      title: stringValue(properties.headline, event),
      description: stringValue(properties.description, event),
      area: stringValue(properties.areaDesc, 'Area not specified'),
      issuedAt: timestamp(properties.sent, now),
      expiresAt: timestamp(properties.expires, now + 60 * 60 * 1000),
      source: 'National Weather Service',
      sourceUrl: url,
      actionRequired: severity === 'extreme' || severity === 'severe',
      instructions,
      affectedRadius: radius,
      coordinates: { lat: latitude, lng: longitude },
    }]
  })
}

async function fetchUSGSEarthquakes(latitude: number, longitude: number, radius: number): Promise<DisasterAlert[]> {
  const url = new URL('https://earthquake.usgs.gov/fdsnws/event/1/query')
  url.searchParams.set('format', 'geojson')
  url.searchParams.set('starttime', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
  url.searchParams.set('latitude', String(latitude))
  url.searchParams.set('longitude', String(longitude))
  url.searchParams.set('maxradiuskm', String(radius))
  url.searchParams.set('minmagnitude', '4.0')
  url.searchParams.set('orderby', 'time')
  url.searchParams.set('limit', '50')

  const response = await fetch(url, {
    cache: 'no-store',
    headers: { Accept: 'application/geo+json, application/json;q=0.9' },
    signal: AbortSignal.timeout(10000),
  })
  if (!response.ok) throw new Error(`USGS request failed (${response.status})`)

  const data = (await response.json()) as { features?: USGSFeature[] }
  const now = Date.now()
  return (data.features ?? []).flatMap((feature) => {
    const properties = feature.properties ?? {}
    const coordinates = feature.geometry?.coordinates
    if (!Array.isArray(coordinates) || typeof coordinates[0] !== 'number' || typeof coordinates[1] !== 'number') return []
    const magnitude = typeof properties.mag === 'number' ? properties.mag : 0
    const url = stringValue(properties.url)
    if (!url) return []
    const severity: DisasterAlert['severity'] = magnitude >= 6 ? 'severe' : magnitude >= 5 ? 'moderate' : 'minor'
    const issuedAt = typeof properties.time === 'number' ? properties.time : now
    const place = stringValue(properties.place, 'Location not specified')

    return [{
      id: `usgs-${feature.id ?? url}`,
      type: 'earthquake',
      severity,
      title: `Magnitude ${magnitude.toFixed(1)} earthquake`,
      description: `A magnitude ${magnitude.toFixed(1)} earthquake was recorded near ${place}.`,
      area: place,
      issuedAt,
      expiresAt: issuedAt + 24 * 60 * 60 * 1000,
      source: 'USGS',
      sourceUrl: url,
      actionRequired: magnitude >= 6,
      instructions: magnitude >= 5 ? ['Check local authorities for official guidance and aftershock information.'] : [],
      affectedRadius: radius,
      coordinates: { lat: coordinates[1], lng: coordinates[0] },
    }]
  })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const latitude = Number(searchParams.get('lat'))
  const longitude = Number(searchParams.get('lng'))
  const radiusValue = Number(searchParams.get('radius') ?? '50')
  const radius = Number.isFinite(radiusValue) ? Math.max(1, Math.min(100, Math.round(radiusValue))) : 50

  if (!isValidCoordinate(latitude, -90, 90) || !isValidCoordinate(longitude, -180, 180)) {
    return NextResponse.json({ error: 'Valid latitude and longitude are required.' }, { status: 400 })
  }

  const results = await Promise.allSettled([
    fetchNWSAlerts(latitude, longitude, radius),
    fetchUSGSEarthquakes(latitude, longitude, radius),
  ])
  const successful = results.filter((result): result is PromiseFulfilledResult<DisasterAlert[]> => result.status === 'fulfilled')
  if (successful.length === 0) {
    console.error('[v0] Disaster alert providers were unavailable')
    return NextResponse.json({ error: 'Official disaster alert sources are temporarily unavailable.' }, { status: 502 })
  }

  const alerts = successful.flatMap((result) => result.value).filter((alert) => alert.expiresAt > Date.now())
    .sort((a, b) => b.issuedAt - a.issuedAt)

  return NextResponse.json(
    { location: { latitude, longitude }, radius, count: alerts.length, alerts, lastUpdated: Date.now() },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
