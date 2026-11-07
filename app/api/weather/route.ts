import { type NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface OpenMeteoResponse {
  current?: {
    temperature_2m?: number
    precipitation?: number
    weather_code?: number
  }
}

const weatherDescriptions: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mostly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Thunderstorm with heavy hail',
}

function isValidCoordinate(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max
}

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid location request.' }, { status: 400 })
  }

  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: 'Invalid location request.' }, { status: 400 })
  }

  const { lat, lon } = body as Record<string, unknown>
  if (!isValidCoordinate(lat, -90, 90) || !isValidCoordinate(lon, -180, 180)) {
    return NextResponse.json({ error: 'Enter valid GPS coordinates to load local weather.' }, { status: 400 })
  }

  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', String(lat))
  url.searchParams.set('longitude', String(lon))
  url.searchParams.set('current', 'temperature_2m,precipitation,weather_code')
  url.searchParams.set('timezone', 'auto')

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    })
    if (!response.ok) {
      return NextResponse.json({ error: 'The weather service is temporarily unavailable.' }, { status: 502 })
    }

    const data = (await response.json()) as OpenMeteoResponse
    const current = data.current
    if (
      typeof current?.temperature_2m !== 'number' ||
      typeof current.weather_code !== 'number' ||
      typeof current.precipitation !== 'number'
    ) {
      return NextResponse.json({ error: 'The weather service returned incomplete data.' }, { status: 502 })
    }

    const code = current.weather_code
    const precipitation = current.precipitation
    const isStorm = code >= 95
    const rainfall = precipitation >= 7.5 || [65, 67, 82, 86, 99].includes(code)
      ? 'heavy'
      : precipitation >= 2 || [63, 66, 73, 75, 81].includes(code)
        ? 'moderate'
        : precipitation > 0 || [51, 53, 55, 61, 71, 80, 85].includes(code)
          ? 'low'
          : 'none'
    const severity = isStorm || rainfall === 'heavy'
      ? 'red'
      : rainfall === 'moderate'
        ? 'blue'
        : rainfall === 'low'
          ? 'green'
          : 'normal'

    return NextResponse.json(
      {
        location: `${lat.toFixed(3)}, ${lon.toFixed(3)}`,
        condition: weatherDescriptions[code] ?? 'Current conditions unavailable',
        temperature: Math.round(current.temperature_2m),
        rainfall,
        alert: isStorm || rainfall === 'heavy'
          ? 'Severe conditions reported. Check official local warnings before travel.'
          : '',
        weatherLink: 'https://open-meteo.com/en/docs',
        severity,
        source: 'Open-Meteo',
        units: '°C',
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('[v0] Weather provider request failed:', error instanceof Error ? error.name : 'UnknownError')
    return NextResponse.json({ error: 'The weather service could not be reached. Please try again.' }, { status: 502 })
  }
}
