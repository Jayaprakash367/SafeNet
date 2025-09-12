"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Phone, MapPin, Heart, Car, Home, Zap, MessageSquare, Brain } from "lucide-react"
import Link from "next/link"

export function QuickActions() {
  const quickActions = [
    {
      icon: Phone,
      title: "Call 911",
      description: "Direct emergency call",
      action: () => window.open("tel:911"),
      variant: "destructive" as const,
    },
    {
      icon: Heart,
      title: "Medical Emergency",
      description: "Health-related SOS",
      action: () => console.log("Medical emergency triggered"),
      variant: "secondary" as const,
    },
    {
      icon: Car,
      title: "Road Accident",
      description: "Vehicle emergency",
      action: () => console.log("Road accident reported"),
      variant: "outline" as const,
    },
    {
      icon: Home,
      title: "Home Emergency",
      description: "Fire, break-in, etc.",
      action: () => console.log("Home emergency triggered"),
      variant: "outline" as const,
    },
    {
      icon: Zap,
      title: "Natural Disaster",
      description: "Weather emergency",
      action: () => console.log("Natural disaster reported"),
      variant: "outline" as const,
    },
    {
      icon: MapPin,
      title: "Share Location",
      description: "Send GPS to contacts",
      action: () => console.log("Location shared"),
      variant: "outline" as const,
    },
  ]

  const navigationActions = [
    {
      icon: MessageSquare,
      title: "Communication Center",
      description: "SMS & emergency contacts",
      href: "/communication",
      variant: "outline" as const,
    },
    {
      icon: MapPin,
      title: "Maps & Alerts",
      description: "Emergency resources & disasters",
      href: "/maps",
      variant: "outline" as const,
    },
    {
      icon: Brain,
      title: "AI Demo Center",
      description: "Test AI classification",
      href: "/ai-demo",
      variant: "outline" as const,
    },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Quick Emergency Actions</CardTitle>
          <CardDescription>Instant access to common emergency scenarios</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant}
                className="h-auto p-4 flex flex-col items-start gap-2 text-left"
                onClick={action.action}
              >
                <div className="flex items-center gap-2 w-full">
                  <action.icon className="w-5 h-5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm">{action.title}</div>
                    <div className="text-xs opacity-70 text-pretty">{action.description}</div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SafeNet Features</CardTitle>
          <CardDescription>Explore advanced emergency response capabilities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {navigationActions.map((action, index) => (
              <Link key={index} href={action.href}>
                <Button
                  variant={action.variant}
                  className="h-auto p-4 flex flex-col items-start gap-2 text-left w-full"
                >
                  <div className="flex items-center gap-2 w-full">
                    <action.icon className="w-5 h-5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm">{action.title}</div>
                      <div className="text-xs opacity-70 text-pretty">{action.description}</div>
                    </div>
                  </div>
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
