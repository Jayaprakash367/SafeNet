"use client"

import { Button } from "@/components/ui/button"
import { EmergencyMap } from "@/components/emergency-map"
import { DisasterAlerts } from "@/components/disaster-alerts"
import { ArrowLeft, MapPin } from "lucide-react"
import Link from "next/link"

export default function MapsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
                <ArrowLeft className="w-4 h-4" />
                Back to SafeNet
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
                <MapPin className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Emergency Maps & Alerts</h1>
                <p className="text-sm text-muted-foreground">Location-based emergency resources and disaster alerts</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <EmergencyMap />
          <DisasterAlerts />
        </div>
      </main>
    </div>
  )
}
