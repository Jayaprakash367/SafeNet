import { type NextRequest, NextResponse } from "next/server"

interface SOSRequest {
  userId: string
  location: {
    latitude: number
    longitude: number
    accuracy?: number
  } | null
  profile: {
    name: string
    age: number | string
    bloodGroup: string
    medicalConditions: string[]
    emergencyContacts: string[]
  }
  emergencyType: string
  urgency: "critical" | "high" | "medium" | "low"
  timestamp: string
  voiceRecording?: string
  additionalInfo?: string
  adminNotificationNumber?: string // Added admin notification number
}

interface SOSResponse {
  id: string
  status: "received" | "processing" | "dispatched" | "resolved"
  estimatedResponseTime: number
  assignedUnits: string[]
  instructions: string[]
  callbackRequired: boolean
}

export async function POST(request: NextRequest) {
  try {
    const sosData: SOSRequest = await request.json()

    // Validate required fields
    if (!sosData.userId || !sosData.profile) {
      return NextResponse.json({ error: "Missing required SOS data" }, { status: 400 })
    }

    // Generate unique SOS ID
    const sosId = `SOS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    await storeUserDetails(sosData, sosId)

    // Simulate AI classification and priority assignment
    const classification = await classifyEmergency(sosData)

    if (sosData.adminNotificationNumber) {
      await sendAdminNotification(sosData, sosId, sosData.adminNotificationNumber)
    }

    // Simulate emergency service dispatch
    const dispatchResult = await dispatchEmergencyServices(sosData, classification)

    // Send alerts to user's emergency contacts
    await sendEmergencyAlerts(sosData, sosId)

    // Prepare response
    const response: SOSResponse = {
      id: sosId,
      status: "dispatched",
      estimatedResponseTime: classification.responseTime,
      assignedUnits: dispatchResult.units,
      instructions: classification.instructions,
      callbackRequired: classification.urgency === "critical" || classification.urgency === "high",
    }

    // Log SOS for monitoring
    console.log("SOS Alert Processed:", {
      id: sosId,
      location: sosData.location,
      urgency: classification.urgency,
      responseTime: classification.responseTime,
      userProfile: sosData.profile,
    })

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error("SOS processing error:", error)
    return NextResponse.json({ error: "Failed to process SOS alert" }, { status: 500 })
  }
}

async function storeUserDetails(sosData: SOSRequest, sosId: string) {
  // In a real app, this would save to a database like Supabase or Neon
  const userRecord = {
    sosId,
    userId: sosData.userId,
    timestamp: sosData.timestamp,
    profile: sosData.profile,
    location: sosData.location,
    emergencyType: sosData.emergencyType,
    urgency: sosData.urgency,
  }

  // Simulate database storage
  console.log("Storing user details:", userRecord)

  // You can add actual database integration here:
  // await supabase.from('sos_alerts').insert(userRecord)

  return userRecord
}

async function sendAdminNotification(sosData: SOSRequest, sosId: string, adminNumber: string) {
  const locationText =
    sosData.location && sosData.location.latitude && sosData.location.longitude
      ? `Location: ${sosData.location.latitude.toFixed(6)}, ${sosData.location.longitude.toFixed(6)}\nGoogle Maps: https://maps.google.com/?q=${sosData.location.latitude},${sosData.location.longitude}`
      : "Location: Not available"

  const adminMessage = `🚨 SAFENET SOS ALERT 🚨
ID: ${sosId}
Name: ${sosData.profile.name}
Age: ${sosData.profile.age}
Blood Group: ${sosData.profile.bloodGroup}
${locationText}
Emergency: ${sosData.emergencyType}
Time: ${new Date(sosData.timestamp).toLocaleString()}
Urgency: ${sosData.urgency.toUpperCase()}

User Details Stored. Please respond immediately.`

  // In a real app, integrate with SMS service like Twilio
  console.log(`Sending admin SMS to ${adminNumber}:`, adminMessage)

  // Example Twilio integration (you would need to add Twilio SDK):
  /*
  const twilio = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_TOKEN)
  await twilio.messages.create({
    body: adminMessage,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: adminNumber
  })
  */

  return true
}

async function classifyEmergency(sosData: SOSRequest) {
  // Simulate AI classification logic
  await new Promise((resolve) => setTimeout(resolve, 1000))

  let urgency: "critical" | "high" | "medium" | "low" = "medium"
  let responseTime = 15 // minutes
  let instructions: string[] = []

  // Classify based on emergency type
  if (sosData.emergencyType.toLowerCase().includes("medical")) {
    urgency = "high"
    responseTime = 8
    instructions = [
      "Stay calm and remain in current location",
      "Do not move if injured unless in immediate danger",
      "Emergency medical services are en route",
    ]
  } else if (sosData.emergencyType.toLowerCase().includes("fire")) {
    urgency = "critical"
    responseTime = 5
    instructions = [
      "Evacuate immediately if safe to do so",
      "Stay low to avoid smoke inhalation",
      "Fire department is responding",
    ]
  }

  // Adjust priority based on user profile
  const age = typeof sosData.profile.age === "string" ? Number.parseInt(sosData.profile.age) : sosData.profile.age
  if (age > 65 || sosData.profile.medicalConditions.length > 0) {
    if (urgency === "medium") urgency = "high"
    else if (urgency === "high") urgency = "critical"
    responseTime = Math.max(responseTime - 3, 3)
  }

  return {
    urgency,
    responseTime,
    instructions,
    confidence: 85 + Math.random() * 10,
  }
}

async function dispatchEmergencyServices(sosData: SOSRequest, classification: any) {
  // Simulate emergency service dispatch
  await new Promise((resolve) => setTimeout(resolve, 500))

  const units = []

  if (sosData.emergencyType.toLowerCase().includes("medical")) {
    units.push("Ambulance Unit 12", "Paramedic Team Alpha")
  }
  if (sosData.emergencyType.toLowerCase().includes("fire")) {
    units.push("Fire Engine 7", "Ladder Truck 3")
  }
  if (classification.urgency === "critical") {
    units.push("Police Unit 45")
  }

  return { units }
}

async function sendEmergencyAlerts(sosData: SOSRequest, sosId: string) {
  const locationText =
    sosData.location && sosData.location.latitude && sosData.location.longitude
      ? `Location: ${sosData.location.latitude.toFixed(6)}, ${sosData.location.longitude.toFixed(6)}\nGoogle Maps: https://maps.google.com/?q=${sosData.location.latitude},${sosData.location.longitude}`
      : "Location: Not available"

  const message = `🚨 SOS ALERT 🚨
Name: ${sosData.profile.name}
${locationText}
Emergency ID: ${sosId}
Time: ${new Date(sosData.timestamp).toLocaleString()}

Emergency services have been notified. This is an automated SafeNet alert.`

  // Send to user's emergency contacts
  console.log("Sending emergency SMS to contacts:", {
    contacts: sosData.profile.emergencyContacts,
    message,
  })

  return true
}
