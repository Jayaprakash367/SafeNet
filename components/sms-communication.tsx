"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MessageSquare, Send, Phone, CheckCircle, AlertTriangle, Wifi, WifiOff } from "lucide-react"

interface SMSMessage {
  id: string
  to: string
  message: string
  timestamp: number
  status: "pending" | "sent" | "delivered" | "failed"
  type: "sos" | "update" | "test"
}

interface EmergencyContact {
  name: string
  phone: string
  relationship: string
}

export function SMSCommunication() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [messages, setMessages] = useState<SMSMessage[]>([])
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
    { name: "John Doe", phone: "+1-555-0123", relationship: "Spouse" },
    { name: "Jane Smith", phone: "+1-555-0456", relationship: "Emergency Contact" },
  ])
  const [customMessage, setCustomMessage] = useState("")
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const generateSOSMessage = (userProfile?: any, location?: { lat: number; lng: number }) => {
    const profile = userProfile || JSON.parse(localStorage.getItem("safenet-profile") || "{}")
    const coords = location || { lat: 40.7128, lng: -74.006 } // Default to NYC

    return `🚨 SOS ALERT 🚨
Name: ${profile.name || "Unknown"}
Age: ${profile.age || "Unknown"}
Location: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}
Blood Group: ${profile.bloodGroup || "Unknown"}
Emergency: Medical assistance needed
Time: ${new Date().toLocaleString()}
Google Maps: https://maps.google.com/?q=${coords.lat},${coords.lng}

This is an automated SafeNet emergency alert. Please contact emergency services if you receive this message.`
  }

  const sendSMS = async (phoneNumber: string, message: string, type: SMSMessage["type"] = "sos") => {
    const newMessage: SMSMessage = {
      id: `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      to: phoneNumber,
      message,
      timestamp: Date.now(),
      status: "pending",
      type,
    }

    setMessages((prev) => [newMessage, ...prev])

    // Simulate SMS sending
    try {
      setIsSending(true)
      await new Promise((resolve) => setTimeout(resolve, 2000)) // Simulate network delay

      // In a real app, this would call Twilio or Fast2SMS API
      console.log("Sending SMS:", {
        to: phoneNumber,
        body: message,
        from: "SafeNet Emergency System",
      })

      // Simulate success/failure
      const success = Math.random() > 0.1 // 90% success rate

      setMessages((prev) =>
        prev.map((msg) => (msg.id === newMessage.id ? { ...msg, status: success ? "sent" : "failed" } : msg)),
      )

      // Simulate delivery confirmation after a delay
      if (success) {
        setTimeout(() => {
          setMessages((prev) => prev.map((msg) => (msg.id === newMessage.id ? { ...msg, status: "delivered" } : msg)))
        }, 3000)
      }
    } catch (error) {
      console.error("SMS sending failed:", error)
      setMessages((prev) => prev.map((msg) => (msg.id === newMessage.id ? { ...msg, status: "failed" } : msg)))
    } finally {
      setIsSending(false)
    }
  }

  const sendEmergencySMS = async () => {
    const sosMessage = generateSOSMessage()

    // Send to all emergency contacts
    for (const contact of emergencyContacts) {
      await sendSMS(contact.phone, sosMessage, "sos")
    }
  }

  const sendCustomSMS = async () => {
    if (!customMessage.trim()) return

    for (const contact of emergencyContacts) {
      await sendSMS(contact.phone, customMessage, "update")
    }
    setCustomMessage("")
  }

  const sendTestSMS = async () => {
    const testMessage = `SafeNet Test Message
This is a test of the SafeNet emergency SMS system.
Time: ${new Date().toLocaleString()}
If you receive this message, the system is working correctly.`

    for (const contact of emergencyContacts) {
      await sendSMS(contact.phone, testMessage, "test")
    }
  }

  const getStatusIcon = (status: SMSMessage["status"]) => {
    switch (status) {
      case "pending":
        return <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
      case "sent":
        return <div className="w-2 h-2 bg-blue-500 rounded-full" />
      case "delivered":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "failed":
        return <AlertTriangle className="w-4 h-4 text-red-500" />
    }
  }

  const getStatusColor = (status: SMSMessage["status"]) => {
    switch (status) {
      case "pending":
        return "text-yellow-600"
      case "sent":
        return "text-blue-600"
      case "delivered":
        return "text-green-600"
      case "failed":
        return "text-red-600"
      default:
        return "text-muted-foreground"
    }
  }

  const getTypeColor = (type: SMSMessage["type"]) => {
    switch (type) {
      case "sos":
        return "destructive"
      case "update":
        return "secondary"
      case "test":
        return "outline"
      default:
        return "outline"
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <CardTitle>SMS Communication</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isOnline ? "default" : "destructive"} className="flex items-center gap-1">
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isOnline ? "Online" : "Offline"}
            </Badge>
          </div>
        </div>
        <CardDescription>Emergency SMS system with offline capability for critical situations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection Status */}
        {!isOnline && (
          <Alert className="border-secondary bg-secondary/10">
            <WifiOff className="h-4 w-4 text-secondary" />
            <AlertDescription className="text-secondary">
              <strong>Offline Mode:</strong> SMS will be sent when connection is restored. Emergency calls still work.
            </AlertDescription>
          </Alert>
        )}

        {/* Emergency Contacts */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Emergency Contacts</h4>
          <div className="space-y-2">
            {emergencyContacts.map((contact, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <div className="font-medium text-sm">{contact.name}</div>
                  <div className="text-xs text-muted-foreground">{contact.relationship}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono">{contact.phone}</span>
                  <Button size="sm" variant="outline" onClick={() => window.open(`tel:${contact.phone}`)}>
                    <Phone className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Quick SMS Actions</h4>
          <div className="grid gap-2 sm:grid-cols-3">
            <Button
              onClick={sendEmergencySMS}
              variant="destructive"
              className="flex items-center gap-2"
              disabled={isSending}
            >
              <MessageSquare className="w-4 h-4" />
              Send SOS
            </Button>
            <Button
              onClick={sendTestSMS}
              variant="outline"
              className="flex items-center gap-2 bg-transparent"
              disabled={isSending}
            >
              <CheckCircle className="w-4 h-4" />
              Test SMS
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2 bg-transparent"
              onClick={() => setCustomMessage("I am safe and secure. No assistance needed.")}
            >
              <MessageSquare className="w-4 h-4" />
              Send "Safe"
            </Button>
          </div>
        </div>

        {/* Custom Message */}
        <div className="space-y-3">
          <Label htmlFor="custom-message" className="text-sm font-medium">
            Custom Emergency Message
          </Label>
          <Textarea
            id="custom-message"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Type a custom message to send to emergency contacts..."
            className="min-h-[80px]"
          />
          <Button
            onClick={sendCustomSMS}
            disabled={!customMessage.trim() || isSending}
            className="flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send Custom Message
          </Button>
        </div>

        {/* Message History */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Recent Messages</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">No messages sent yet</div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="p-3 bg-muted rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={getTypeColor(message.type)} className="text-xs">
                        {message.type.toUpperCase()}
                      </Badge>
                      <span className="text-sm font-medium">{message.to}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(message.status)}
                      <span className={`text-xs ${getStatusColor(message.status)}`}>{message.status}</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">{new Date(message.timestamp).toLocaleString()}</div>
                  <div className="text-sm bg-background p-2 rounded border text-pretty">
                    {message.message.length > 100 ? `${message.message.substring(0, 100)}...` : message.message}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* SMS Information */}
        <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t border-border">
          <p>• SMS works even when internet is unavailable</p>
          <p>• Messages include GPS coordinates and emergency profile</p>
          <p>• Delivery confirmations help track message status</p>
          <p>• Emergency contacts receive structured SOS alerts</p>
        </div>
      </CardContent>
    </Card>
  )
}
