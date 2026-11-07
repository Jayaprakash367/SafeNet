import { type NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const amenityTypes = {
  hospital: 'hospital',
  police: 'police',
  fire_station: 'fire',
  shelter: 'shelter',
  pharmacy: 'pharmacy',
} as const

type ResourceType = 'hospital' | 'police' | 'fire' | 'shelter' | 'pharmacy'

interface OverpassElement {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  center?: { lat?: number; lon?: number }
  tags?: Record<string, string>
}

interface EmergencyResource {
  id: string
  name: string
  type: ResourceType
  address: string
  phone: string
  distance: number
  openingHours: string | null
  coordinates: { lat: number; lng: number }
  sourceUrl: string
}

function isValidCoordinate(value: number, min: number, max: number) {
  return Number.isFinite(value) && value >= min && value <= max
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const earthRadiusKm = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function toResource(element: OverpassElement, latitude: number, longitude: number): EmergencyResource | null {
  const tags = element.tags ?? {}
  const kind = tags.amenity
  if (!kind || !(kind in amenityTypes)) return null
  const type = amenityTypes[kind as keyof typeof amenityTypes]
  const lat = element.lat ?? element.center?.lat
  const lng = element.lon ?? element.center?.lon
  if (typeof lat !== 'number' || typeof lng !== 'number') return null

  const address = [
    [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' '),
    tags['addr:city'],
    tags['addr:postcode'],
  ].filter(Boolean).join(', ')
  const rawPhone = tags.phone ?? tags['contact:phone'] ?? ''
  const phone = rawPhone.replace(/[^\d+().\s-]/g, '').slice(0, 40)
  const label = type.replace('_', ' ')

  return {
    id: `${element.type}-${element.id}`,
    name: tags.name?.trim() || tags.operator?.trim() || `${label} (name not listed)`,
    type,
    address,
    phone,
    distance: calculateDistance(latitude, longitude, lat, lng),
    openingHours: tags.opening_hours?.trim() || null,
    coordinates: { lat, lng },
    sourceUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const latitude = Number(searchParams.get('lat'))
  const longitude = Number(searchParams.get('lng'))
  const radiusValue = Number(searchParams.get('radius') ?? '10')
  const radius = Number.isFinite(radiusValue) ? Math.max(1, Math.min(25, Math.round(radiusValue))) : 10
  const requestedType = searchParams.get('type') ?? 'all'

  if (!isValidCoordinate(latitude, -90, 90) || !isValidCoordinate(longitude, -180, 180)) {
    return NextResponse.json({ error: 'Valid latitude and longitude are required.' }, { status: 400 })
  }
  if (requestedType !== 'all' && !Object.values(amenityTypes).includes(requestedType as ResourceType)) {
    return NextResponse.json({ error: 'Unsupported resource type.' }, { status: 400 })
  }

  const amenityFilters = requestedType === 'all'
    ? Object.keys(amenityTypes)
    : Object.entries(amenityTypes).filter(([, value]) => value === requestedType).map(([key]) => key)
  const radiusMeters = radius * 1000
  const queryElements = amenityFilters.flatMap((amenity) => [
    `node(around:${radiusMeters},${latitude},${longitude})[amenity="${amenity}"];`,
    `way(around:${radiusMeters},${latitude},${longitude})[amenity="${amenity}"];`,
    `relation(around:${radiusMeters},${latitude},${longitude})[amenity="${amenity}"];`,
  ]).join('')
  const query = `[out:json][timeout:20];(${queryElements});out center tags;`

  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'SafeNet/1.0 emergency-resource-search',
      },
      body: new URLSearchParams({ data: query }),
      signal: AbortSignal.timeout(20000),
    })
    if (!response.ok) {
      return NextResponse.json({ error: 'OpenStreetMap resources are temporarily unavailable.' }, { status: 502 })
    }

    const data = (await response.json()) as { elements?: OverpassElement[] }
    const resources = (data.elements ?? [])
      .map((element) => toResource(element, latitude, longitude))
      .filter((resource): resource is EmergencyResource => Boolean(resource && resource.distance <= radius))
      .filter((resource) => requestedType === 'all' || resource.type === requestedType)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 100)

    return NextResponse.json(
      { location: { latitude, longitude }, radius, type: requestedType, count: resources.length, resources },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('[v0] OpenStreetMap resource lookup failed:', error instanceof Error ? error.name : 'UnknownError')
    return NextResponse.json({ error: 'OpenStreetMap resource search is temporarily unavailable.' }, { status: 502 })
  }
}
