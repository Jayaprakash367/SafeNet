import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = await request.json()

    console.log("[v0] Test SMS request for:", phoneNumber)

    // Twilio configuration
    const accountSid = process.env.TWILIO_SID
    const authToken = process.env.TWILIO_TOKEN
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER

    if (!accountSid || !authToken || !twilioPhone) {
      console.log("[v0] Missing Twilio credentials")
      return NextResponse.json({ error: "Twilio credentials not configured" }, { status: 500 })
    }

    console.log("[v0] Twilio credentials present")
    console.log("[v0] Sending test SMS to:", phoneNumber)
    console.log("[v0] From number:", twilioPhone)

    // Send test SMS via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`

    const testMessage = `🧪 TEST MESSAGE from SafeNet SOS App
    
This is a test SMS to verify delivery to your phone number.
    
✅ If you receive this message, SMS delivery is working correctly!
    
Time: ${new Date().toLocaleString()}
Phone: ${phoneNumber}
From: SafeNet Emergency System`

    const response = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: phoneNumber,
        From: twilioPhone,
        Body: testMessage,
      }),
    })

    const result = await response.json()
    console.log("[v0] Twilio response status:", response.status)
    console.log("[v0] Twilio response:", result)

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: "Test SMS sent successfully!",
        twilioResponse: result,
      })
    } else {
      return NextResponse.json(
        {
          error: "Failed to send test SMS",
          details: result,
        },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("[v0] Test SMS error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
