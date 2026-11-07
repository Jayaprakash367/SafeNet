"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, CheckCircle, MessageSquare, Phone, Radio, Satellite, type LucideIcon } from "lucide-react"

interface CommunicationChannel {
  id: string
  name: string
  type: "voice" | "sms" | "data" | "satellite"
  status: "available" | "unavailable" | "limited"
  priority: number
  description: string
  icon: LucideIcon
}

export function CommunicationHub() {
  const [channels, setChannels] = useState<CommunicationChannel[]>([
    {
      id: "voice_call",
      name: "Voice Calls",
      type: "voice",
      status: "limited",
      priority: 1,
      description: "Calls use your device dialer; SafeNet does not place calls.",
      icon: Phone,
    },
    {
      id: "sms_text",
      name: "SMS Messages",
      type: "sms",
      status: "limited",
      priority: 2,
      description: "SMS to saved contacts requires sign-in, a valid profile, and Twilio configuration.",
      icon: MessageSquare,
    },
    {
      id: "data_internet",
      name: "Internet Data",
      type: "data",
      status: "unavailable",
      priority: 3,
      description: "Live weather and disaster feeds require an internet connection.",
      icon: Radio,
    },
    {
      id: "satellite_emergency",
      name: "Satellite Emergency",
      type: "satellite",
      status: "unavailable",
      priority: 4,
      description: "No satellite provider or device integration is configured.",
      icon: Satellite,
    },
  ])

  const [activeTests, setActiveTests] = useState<Set<string>>(new Set())
  const [testFeedback, setTestFeedback] = useState<{ message: string; status: "success" | "error" } | null>(null)
  const router = useRouter()

  useEffect(() => {
    const updateConnectionStatus = () => {
      setChannels((prev) =>
        prev.map((channel) =>
          channel.id === "data_internet"
            ? { ...channel, status: navigator.onLine ? "limited" : "unavailable" }
            : channel,
        ),
      )
    }

    updateConnectionStatus()
    window.addEventListener("online", updateConnectionStatus)
    window.addEventListener("offline", updateConnectionStatus)

    return () => {
      window.removeEventListener("online", updateConnectionStatus)
      window.removeEventListener("offline", updateConnectionStatus)
    }
  }, [])

  const testChannel = async (channelId: string) => {
    const channel = channels.find((item) => item.id === channelId)

    if (!channel || (channel.type !== "sms" && channel.type !== "data")) {
      return
    }

    setActiveTests((previous) => new Set(previous).add(channelId))
    setTestFeedback(null)

    try {
      const response =
        channel.type === "sms"
          ? await fetch("/api/test-sms", { method: "POST" })
          : await fetch("/api/weather", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ lat: 0, lon: 0 }),
            })

      const result = (await response.json().catch(() => ({}))) as {
        error?: unknown
        message?: unknown
      }

      if (response.status === 401) {
        router.push(`/login?next=${encodeURIComponent("/communication")}`)
        return
      }

      if (!response.ok) {
        setChannels((previous) =>
          previous.map((item) =>
            item.id === channelId
              ? { ...item, status: channel.type === "sms" && response.status === 400 ? "limited" : "unavailable" }
              : item,
          ),
        )
        setTestFeedback({
          message: typeof result.error === "string" ? result.error : "This communication service could not be verified.",
          status: "error",
        })
        return
      }

      setChannels((previous) =>
        previous.map((item) => (item.id === channelId ? { ...item, status: "available" } : item)),
      )
      setTestFeedback({
        message:
          channel.type === "sms" && typeof result.message === "string"
            ? result.message
            : "The live weather provider responded successfully.",
        status: "success",
      })
    } catch {
      setChannels((previous) =>
        previous.map((item) => (item.id === channelId ? { ...item, status: "unavailable" } : item)),
      )
      setTestFeedback({
        message: channel.type === "sms" ? "The SMS test could not be completed. Try again." : "The live data provider could not be reached.",
        status: "error",
      })
    } finally {
      setActiveTests((previous) => {
        const next = new Set(previous)
        next.delete(channelId)
        return next
      })
    }
  }

  const getStatusBadge = (status: CommunicationChannel["status"]) => {
    switch (status) {
      case "available":
        return "default"
      case "limited":
        return "secondary"
      case "unavailable":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getStatusIcon = (status: CommunicationChannel["status"]) => {
    switch (status) {
      case "available":
        return <CheckCircle aria-hidden="true" className="size-4 text-primary" />
      case "limited":
        return <AlertTriangle aria-hidden="true" className="size-4 text-muted-foreground" />
      case "unavailable":
        return <AlertTriangle aria-hidden="true" className="size-4 text-destructive" />
    }
  }

  const testableChannels = channels.filter((channel) => channel.type === "sms" || channel.type === "data")
  const passedTests = testableChannels.filter((channel) => channel.status === "available").length

  return (
    <Card>
      <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Radio aria-hidden="true" className="size-5 text-primary" />
              <CardTitle>Communication Hub</CardTitle>
            </div>
            <Badge variant={passedTests > 0 ? "default" : "secondary"}>
              {passedTests}/{testableChannels.length} Checks passed
            </Badge>
          </div>

        <CardDescription>
          Check connected services and your device capabilities. SafeNet does not call emergency services or switch channels automatically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="status">Channel Status</TabsTrigger>
            <TabsTrigger value="priority">Priority Order</TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="space-y-4">
            <p className="text-xs text-muted-foreground">
              The live feed check uses fixed sample coordinates and does not access your GPS.
            </p>
            {testFeedback && (
              <Alert variant={testFeedback.status === "error" ? "destructive" : "default"} role={testFeedback.status === "error" ? "alert" : "status"}>
                <AlertDescription>{testFeedback.message}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col gap-3">
              {channels.map((channel) => {
                const Icon = channel.icon
                const isTesting = activeTests.has(channel.id)
                const canTest = channel.type === "sms" || channel.type === "data"

                return (
                  <div key={channel.id} className="flex flex-col gap-3 rounded-lg bg-muted p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
                      <div className="min-w-0">
                        <div className="font-medium text-sm">{channel.name}</div>
                        <div className="text-xs text-muted-foreground">{channel.description}</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                      {getStatusIcon(channel.status)}
                      <Badge variant={getStatusBadge(channel.status)} className="text-xs">
                        {channel.status}
                      </Badge>
                      {canTest && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => testChannel(channel.id)}
                          disabled={isTesting}
                          className="text-xs"
                        >
                          {isTesting ? "Testing..." : channel.type === "sms" ? "Send test SMS" : "Test live data"}
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="priority" className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Emergency Communication Priority</h4>
              <p className="text-xs text-muted-foreground">
                This is a suggested order only. SafeNet does not automatically dispatch alerts or switch channels.
              </p>
            </div>

            <div className="space-y-2">
              {[...channels]
                .sort((a, b) => a.priority - b.priority)
                .map((channel, index) => {
                  const Icon = channel.icon
                  return (
                    <div key={channel.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs font-bold">
                        {index + 1}
                      </div>
                      <Icon className="w-4 h-4 text-primary" />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{channel.name}</div>
                        <div className="text-xs text-muted-foreground">{channel.description}</div>
                      </div>
                      {getStatusIcon(channel.status)}
                    </div>
                  )
                })}
            </div>

            <Alert>
              <Radio aria-hidden="true" />
              <AlertDescription>
                SMS alerts go only to your saved emergency contacts when your account and provider are configured. SafeNet does not contact 911 or dispatch responders.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>

        {/* Communication Tips */}
        <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t border-border mt-4">
          <p>• Voice calls are placed from your device phone app.</p>
          <p>• SMS tests and SOS notifications require a saved contact and configured provider.</p>
          <p>• Live weather and alert data require internet access.</p>
          <p>• Satellite communication is not configured in SafeNet.</p>
        </div>
      </CardContent>
    </Card>
  )
}
