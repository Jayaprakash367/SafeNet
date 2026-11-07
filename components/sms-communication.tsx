"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, CheckCircle, MessageSquare, Phone, Send, Wifi, WifiOff } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuthUser, useEmergencyProfile } from "@/lib/supabase/hooks"

interface SMSMessage {
  id: string
  to: string
  message: string
  timestamp: number
  status: "preview"
  type: "sos" | "update" | "test"
}

interface EmergencyContact {
  name: string
  phone: string
  relationship: string
}

export function SMSCommunication() {
  const { user, isLoading: isAuthLoading, error: authError } = useAuthUser()
  const [hasMounted, setHasMounted] = useState(false)
  const isAuthReady = hasMounted && !isAuthLoading
  const activeUser = isAuthReady ? user : null
  const { profile, isLoading: isProfileLoading, error: profileError } = useEmergencyProfile(activeUser?.id ?? "")
  const [isOnline, setIsOnline] = useState(true)
  const [messages, setMessages] = useState<SMSMessage[]>([])
  const [customMessage, setCustomMessage] = useState("")

  const emergencyContacts = useMemo<EmergencyContact[]>(() => {
    const contacts: EmergencyContact[] = []

    if (profile.emergencyContact1) {
      contacts.push({ name: "Emergency contact 1", phone: profile.emergencyContact1, relationship: "Saved in profile" })
    }
    if (profile.emergencyContact2) {
      contacts.push({ name: "Emergency contact 2", phone: profile.emergencyContact2, relationship: "Saved in profile" })
    }

    return contacts
  }, [profile.emergencyContact1, profile.emergencyContact2])

  useEffect(() => {
    setHasMounted(true)
    const updateOnlineStatus = () => setIsOnline(navigator.onLine)
    updateOnlineStatus()
    window.addEventListener("online", updateOnlineStatus)
    window.addEventListener("offline", updateOnlineStatus)

    return () => {
      window.removeEventListener("online", updateOnlineStatus)
      window.removeEventListener("offline", updateOnlineStatus)
    }
  }, [])

  const generateSOSMessage = () => `SafeNet SOS message preview
Name: ${profile.name || "Not provided"}
Age: ${profile.age || "Not provided"}
Blood group: ${profile.bloodGroup || "Not provided"}
Medical conditions: ${profile.medicalConditions || "Not provided"}

This is a preview only. Use the SOS control on the dashboard to save an alert.`

  const previewMessage = (phoneNumber: string, message: string, type: SMSMessage["type"] = "sos") => {
    const preview: SMSMessage = {
      id: `preview_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      to: phoneNumber,
      message,
      timestamp: Date.now(),
      status: "preview",
      type,
    }

    setMessages((previous) => [preview, ...previous])
  }

  const previewEmergencyMessage = () => {
    for (const contact of emergencyContacts) {
      previewMessage(contact.phone, generateSOSMessage(), "sos")
    }
  }

  const previewCustomMessage = () => {
    if (!customMessage.trim()) {
      return
    }

    for (const contact of emergencyContacts) {
      previewMessage(contact.phone, customMessage.trim(), "update")
    }
    setCustomMessage("")
  }

  const previewTestMessage = () => {
    const message = "SafeNet test message preview. No SMS is sent from this screen."
    for (const contact of emergencyContacts) {
      previewMessage(contact.phone, message, "test")
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
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <MessageSquare aria-hidden="true" className="size-5 text-primary" />
            <CardTitle>SMS Communication</CardTitle>
          </div>
          <Badge variant={isOnline ? "default" : "destructive"} className="flex items-center gap-1">
            {isOnline ? <Wifi aria-hidden="true" className="size-3" /> : <WifiOff aria-hidden="true" className="size-3" />}
            {isOnline ? "Online" : "Offline"}
          </Badge>
        </div>
        <CardDescription>
          Emergency contacts load from your saved profile. Messages shown here are previews and are not sent.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {!isOnline && (
          <Alert className="border-secondary bg-secondary/10">
            <WifiOff aria-hidden="true" className="size-4 text-secondary" />
            <AlertDescription className="text-secondary">
              This preview is not queued for later delivery. Contact local emergency services directly if needed.
            </AlertDescription>
          </Alert>
        )}

        {!isAuthReady && (
          <p role="status" className="text-sm text-muted-foreground">Checking your SafeNet account...</p>
        )}
        {isAuthReady && activeUser && isProfileLoading && (
          <p role="status" className="text-sm text-muted-foreground">Loading saved contacts...</p>
        )}

        {isAuthReady && authError && (
          <Alert variant="destructive" role="alert">
            <AlertTriangle aria-hidden="true" className="size-4" />
            <AlertDescription>Could not verify your account session. Refresh the page before viewing private contacts.</AlertDescription>
          </Alert>
        )}

        {isAuthReady && !authError && !activeUser && (
          <Alert>
            <AlertTriangle aria-hidden="true" className="size-4" />
            <AlertDescription>Sign in or create an account to view your saved emergency contacts.</AlertDescription>
          </Alert>
        )}

        {activeUser && profileError && (
          <Alert variant="destructive" role="alert">
            <AlertTriangle aria-hidden="true" className="size-4" />
            <AlertDescription>Could not load your private contacts. Refresh the page and try again.</AlertDescription>
          </Alert>
        )}

        {activeUser && !isProfileLoading && !profileError && emergencyContacts.length === 0 && (
          <Alert>
            <AlertTriangle aria-hidden="true" className="size-4" />
            <AlertDescription>
              Add emergency contacts in your dashboard profile before using communication features.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-medium">Emergency Contacts</h4>
          {emergencyContacts.map((contact) => (
            <div key={contact.phone} className="flex items-center justify-between gap-3 rounded-lg bg-muted p-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{contact.name}</div>
                <div className="text-xs text-muted-foreground">{contact.relationship}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="truncate font-mono text-sm">{contact.phone}</span>
                <Button asChild size="sm" variant="outline">
                  <a href={`tel:${encodeURIComponent(contact.phone)}`} aria-label={`Call ${contact.name}`}>
                    <Phone aria-hidden="true" className="size-3" />
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-medium">Message Previews</h4>
          <div className="grid gap-2 sm:grid-cols-3">
            <Button onClick={previewEmergencyMessage} variant="destructive" disabled={!emergencyContacts.length}>
              <MessageSquare aria-hidden="true" data-icon="inline-start" />
              Preview SOS
            </Button>
            <Button onClick={previewTestMessage} variant="outline" disabled={!emergencyContacts.length}>
              <CheckCircle aria-hidden="true" data-icon="inline-start" />
              Preview test
            </Button>
            <Button
              variant="outline"
              onClick={() => setCustomMessage("I am safe and secure. No assistance needed.")}
              disabled={!emergencyContacts.length}
            >
              <MessageSquare aria-hidden="true" data-icon="inline-start" />
              Safe message
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Label htmlFor="custom-message" className="text-sm font-medium">
            Custom Message Preview
          </Label>
          <Textarea
            id="custom-message"
            value={customMessage}
            onChange={(event) => setCustomMessage(event.target.value)}
            maxLength={1000}
            placeholder="Type a message to preview for your saved emergency contacts..."
            className="min-h-[80px]"
          />
          <Button onClick={previewCustomMessage} disabled={!customMessage.trim() || !emergencyContacts.length}>
            <Send aria-hidden="true" data-icon="inline-start" />
            Preview message
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-medium">Recent Previews</h4>
          <div className="max-h-64 flex flex-col gap-2 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">No message previews yet</div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="flex flex-col gap-2 rounded-lg bg-muted p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <Badge variant={getTypeColor(message.type)} className="text-xs">
                        {message.type.toUpperCase()}
                      </Badge>
                      <span className="truncate text-sm font-medium">{message.to}</span>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">Preview only</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{new Date(message.timestamp).toLocaleString()}</div>
                  <div className="rounded border bg-background p-2 text-sm text-pretty">
                    {message.message.length > 100 ? `${message.message.substring(0, 100)}...` : message.message}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1 border-t border-border pt-4 text-xs text-muted-foreground">
          <p>Message previews are not sent from this panel.</p>
          <p>Use the dashboard SOS action to save an alert and the test control to verify SMS delivery.</p>
        </div>
      </CardContent>
    </Card>
  )
}
