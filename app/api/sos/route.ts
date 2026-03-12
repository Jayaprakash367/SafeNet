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
      const adminNotificationSent = await sendAdminNotification(sosData, sosId, sosData.adminNotificationNumber)
      if (!adminNotificationSent) {
        return NextResponse.json({ error: "Failed to send admin notification" }, { status: 500 })
      }
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
  console.log("[v0] Admin notification details:", {
    adminNumber,
    sosId,
    twilioSid: process.env.TWILIO_SID ? "Present" : "Missing",
    twilioToken: process.env.TWILIO_TOKEN ? "Present" : "Missing",
    twilioPhone: process.env.TWILIO_PHONE_NUMBER ? "Present" : "Missing",
  })

  const locationText =
    sosData.location && sosData.location.latitude && sosData.location.longitude
      ? `Location: ${sosData.location.latitude.toFixed(6)}, ${sosData.location.longitude.toFixed(6)}\nGoogle Maps: https://maps.google.com/?q=${sosData.location.latitude},${sosData.location.longitude}`
      : "Location: Not available"

  const adminMessage = `🚨 SAFENET SOS ALERT 🚨\nID: ${sosId}\nName: ${sosData.profile.name}\nAge: ${sosData.profile.age}\nBlood Group: ${sosData.profile.bloodGroup}\n${locationText}\nEmergency: ${sosData.emergencyType}\nTime: ${new Date(sosData.timestamp).toLocaleString()}\nUrgency: ${sosData.urgency.toUpperCase()}\n\nRESCUE NEEDED - User requires immediate assistance. Please respond immediately.`

  if (!process.env.TWILIO_SID || !process.env.TWILIO_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
    console.error("[v0] Missing Twilio credentials:", {
      TWILIO_SID: !!process.env.TWILIO_SID,
      TWILIO_TOKEN: !!process.env.TWILIO_TOKEN,
      TWILIO_PHONE_NUMBER: !!process.env.TWILIO_PHONE_NUMBER,
    })
    return false
  }

  try {
    console.log("[v0] Sending SMS to:", adminNumber)
    console.log("[v0] From number:", process.env.TWILIO_PHONE_NUMBER)

    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_SID}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${process.env.TWILIO_SID}:${process.env.TWILIO_TOKEN}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: process.env.TWILIO_PHONE_NUMBER!,
        To: adminNumber,
        Body: adminMessage,
      }),
    })

    const responseText = await response.text()
    console.log("[v0] Twilio response status:", response.status)
    console.log("[v0] Twilio response:", responseText)

    if (response.ok) {
      console.log(`✅ Rescue SMS sent successfully to ${adminNumber}`)
      return true
    } else {
      console.error(`❌ Failed to send rescue SMS:`, responseText)
      return false
    }
  } catch (error) {
    console.error(`❌ Error sending rescue SMS to ${adminNumber}:`, error)
    return false
  }
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

  const message = `🚨 SOS ALERT 🚨\nName: ${sosData.profile.name}\n${locationText}\nEmergency ID: ${sosId}\nTime: ${new Date(sosData.timestamp).toLocaleString()}\n\nEmergency services have been notified. This is an automated SafeNet alert.`

  for (const contact of sosData.profile.emergencyContacts) {
    try {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_SID}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(`${process.env.TWILIO_SID}:${process.env.TWILIO_TOKEN}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            From: process.env.TWILIO_PHONE_NUMBER!,
            To: contact,
            Body: message,
          }),
        },
      )

      if (response.ok) {
        console.log(`✅ Emergency SMS sent to contact: ${contact}`)
      } else {
        console.error(`❌ Failed to send SMS to contact: ${contact}`)
      }
    } catch (error) {
      console.error(`❌ Error sending SMS to contact ${contact}:`, error)
    }
  }

  return true
}
