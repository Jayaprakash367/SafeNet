"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Phone, MessageSquare, Radio, Satellite, CheckCircle, AlertTriangle } from "lucide-react"

interface CommunicationChannel {
  id: string
  name: string
  type: "voice" | "sms" | "data" | "satellite"
  status: "available" | "unavailable" | "limited"
  priority: number
  description: string
  icon: React.ComponentType<any>
}

export function CommunicationHub() {
  const [channels, setChannels] = useState<CommunicationChannel[]>([
    {
      id: "voice_call",
      name: "Voice Calls",
      type: "voice",
      status: "available",
      priority: 1,
      description: "Direct emergency calls to 911 and contacts",
      icon: Phone,
    },
    {
      id: "sms_text",
      name: "SMS Messages",
      type: "sms",
      status: "available",
      priority: 2,
      description: "Text messages with location and profile data",
      icon: MessageSquare,
    },
    {
      id: "data_internet",
      name: "Internet Data",
      type: "data",
      status: navigator.onLine ? "available" : "unavailable",
      priority: 3,
      description: "App-based alerts and real-time updates",
      icon: Radio,
    },
    {
      id: "satellite_emergency",
      name: "Satellite Emergency",
      type: "satellite",
      status: "limited",
      priority: 4,
      description: "Satellite-based emergency beacon (SOS only)",
      icon: Satellite,
    },
  ])

  const [activeTests, setActiveTests] = useState<Set<string>>(new Set())

  useEffect(() => {
    const updateConnectionStatus = () => {
      setChannels((prev) =>
        prev.map((channel) =>
          channel.id === "data_internet"
            ? { ...channel, status: navigator.onLine ? "available" : "unavailable" }
            : channel,
        ),
      )
    }

    window.addEventListener("online", updateConnectionStatus)
    window.addEventListener("offline", updateConnectionStatus)

    return () => {
      window.removeEventListener("online", updateConnectionStatus)
      window.removeEventListener("offline", updateConnectionStatus)
    }
  }, [])

  const testChannel = async (channelId: string) => {
    setActiveTests((prev) => new Set(prev).add(channelId))

    // Simulate test
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Mock test results
    const success = Math.random() > 0.2 // 80% success rate

    setChannels((prev) =>
      prev.map((channel) =>
        channel.id === channelId ? { ...channel, status: success ? "available" : "unavailable" } : channel,
      ),
    )

    setActiveTests((prev) => {
      const newSet = new Set(prev)
      newSet.delete(channelId)
      return newSet
    })
  }

  const getStatusColor = (status: CommunicationChannel["status"]) => {
    switch (status) {
      case "available":
        return "text-green-600"
      case "limited":
        return "text-yellow-600"
      case "unavailable":
        return "text-red-600"
      default:
        return "text-muted-foreground"
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
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "limited":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case "unavailable":
        return <AlertTriangle className="w-4 h-4 text-red-500" />
    }
  }

  const availableChannels = channels.filter((c) => c.status === "available").length
  const totalChannels = channels.length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-primary" />
            <CardTitle>Communication Hub</CardTitle>
          </div>
          <Badge variant={availableChannels > 0 ? "default" : "destructive"}>
            {availableChannels}/{totalChannels} Available
          </Badge>
        </div>
        <CardDescription>Multiple communication channels ensure emergency alerts reach help</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="status">Channel Status</TabsTrigger>
            <TabsTrigger value="priority">Priority Order</TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="space-y-4">
            {availableChannels === 0 && (
              <Alert className="border-destructive bg-destructive/10">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <AlertDescription className="text-destructive">
                  <strong>Warning:</strong> No communication channels available. Check device connectivity.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              {channels.map((channel) => {
                const Icon = channel.icon
                const isTesting = activeTests.has(channel.id)

                return (
                  <div key={channel.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-primary" />
                      <div>
                        <div className="font-medium text-sm">{channel.name}</div>
                        <div className="text-xs text-muted-foreground">{channel.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusIcon(channel.status)}
                      <Badge variant={getStatusBadge(channel.status)} className="text-xs">
                        {channel.status}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => testChannel(channel.id)}
                        disabled={isTesting}
                        className="text-xs"
                      >
                        {isTesting ? "Testing..." : "Test"}
                      </Button>
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
                SafeNet automatically uses the highest priority available channel for emergency alerts
              </p>
            </div>

            <div className="space-y-2">
              {channels
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

            <Alert className="border-primary bg-primary/10">
              <Radio className="h-4 w-4 text-primary" />
              <AlertDescription className="text-primary">
                <strong>Smart Fallback:</strong> If primary channels fail, SafeNet automatically switches to the next
                available option.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>

        {/* Communication Tips */}
        <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t border-border mt-4">
          <p>• Voice calls have highest priority for immediate emergencies</p>
          <p>• SMS works even with poor signal strength</p>
          <p>• Internet data enables rich emergency information sharing</p>
          <p>• Satellite emergency beacon works in remote areas</p>
        </div>
      </CardContent>
    </Card>
  )
}
