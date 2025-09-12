import { type NextRequest, NextResponse } from "next/server"

interface ResourceRequest {
  latitude: number
  longitude: number
  radius?: number // in kilometers, default 10
  type?: "hospital" | "police" | "fire" | "shelter" | "pharmacy" | "all"
}

interface EmergencyResource {
  id: string
  name: string
  type: "hospital" | "police" | "fire" | "shelter" | "pharmacy" | "gas_station"
  address: string
  phone: string
  distance: number
  isOpen: boolean
  coordinates: { lat: number; lng: number }
  specialties?: string[]
  capacity?: number
  rating?: number
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const latitude = Number.parseFloat(searchParams.get("lat") || "0")
    const longitude = Number.parseFloat(searchParams.get("lng") || "0")
    const radius = Number.parseInt(searchParams.get("radius") || "10")
    const type = (searchParams.get("type") as ResourceRequest["type"]) || "all"

    if (!latitude || !longitude) {
      return NextResponse.json({ error: "Missing latitude and longitude parameters" }, { status: 400 })
    }

    // Simulate finding nearby emergency resources
    const resources = await findNearbyResources({ latitude, longitude, radius, type })

    return NextResponse.json(
      {
        location: { latitude, longitude },
        radius,
        type,
        count: resources.length,
        resources,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Emergency resources error:", error)
    return NextResponse.json({ error: "Failed to fetch emergency resources" }, { status: 500 })
  }
}

async function findNearbyResources(params: ResourceRequest): Promise<EmergencyResource[]> {
  // Simulate API processing time
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Mock database of emergency resources
  const allResources: EmergencyResource[] = [
    {
      id: "hospital_1",
      name: "City General Hospital",
      type: "hospital",
      address: "123 Medical Center Dr, New York, NY 10001",
      phone: "+1-555-0123",
      distance: calculateDistance(params.latitude, params.longitude, 40.715, -74.008),
      isOpen: true,
      coordinates: { lat: 40.715, lng: -74.008 },
      specialties: ["Emergency", "Trauma", "Cardiology", "Pediatrics"],
      capacity: 450,
      rating: 4.2,
    },
    {
      id: "hospital_2",
      name: "Metropolitan Medical Center",
      type: "hospital",
      address: "456 Health Ave, New York, NY 10002",
      phone: "+1-555-0124",
      distance: calculateDistance(params.latitude, params.longitude, 40.72, -74.005),
      isOpen: true,
      coordinates: { lat: 40.72, lng: -74.005 },
      specialties: ["Emergency", "Surgery", "Maternity"],
      capacity: 320,
      rating: 4.5,
    },
    {
      id: "police_1",
      name: "Police Precinct 12",
      type: "police",
      address: "789 Safety St, New York, NY 10003",
      phone: "+1-555-0456",
      distance: calculateDistance(params.latitude, params.longitude, 40.714, -74.007),
      isOpen: true,
      coordinates: { lat: 40.714, lng: -74.007 },
      rating: 4.0,
    },
    {
      id: "fire_1",
      name: "Fire Station #7",
      type: "fire",
      address: "321 Rescue Ave, New York, NY 10004",
      phone: "+1-555-0789",
      distance: calculateDistance(params.latitude, params.longitude, 40.716, -74.009),
      isOpen: true,
      coordinates: { lat: 40.716, lng: -74.009 },
      rating: 4.8,
    },
    {
      id: "shelter_1",
      name: "Community Emergency Shelter",
      type: "shelter",
      address: "654 Safe Haven Blvd, New York, NY 10005",
      phone: "+1-555-0321",
      distance: calculateDistance(params.latitude, params.longitude, 40.71, -74.01),
      isOpen: true,
      coordinates: { lat: 40.71, lng: -74.01 },
      capacity: 200,
      rating: 3.9,
    },
    {
      id: "pharmacy_1",
      name: "24/7 Emergency Pharmacy",
      type: "pharmacy",
      address: "987 Health St, New York, NY 10006",
      phone: "+1-555-0654",
      distance: calculateDistance(params.latitude, params.longitude, 40.7135, -74.0065),
      isOpen: true,
      coordinates: { lat: 40.7135, lng: -74.0065 },
      specialties: ["Emergency Medications", "First Aid Supplies"],
      rating: 4.1,
    },
  ]

  // Filter by type if specified
  let filteredResources =
    params.type === "all" ? allResources : allResources.filter((resource) => resource.type === params.type)

  // Filter by radius
  filteredResources = filteredResources.filter((resource) => resource.distance <= params.radius)

  // Sort by distance
  filteredResources.sort((a, b) => a.distance - b.distance)

  return filteredResources
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  // Haversine formula for calculating distance between two points
  const R = 6371 // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}
