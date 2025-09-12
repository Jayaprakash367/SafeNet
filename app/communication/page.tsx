"use client"

import { Button } from "@/components/ui/button"
import { SMSCommunication } from "@/components/sms-communication"
import { CommunicationHub } from "@/components/communication-hub"
import { ArrowLeft, MessageSquare } from "lucide-react"
import Link from "next/link"

export default function CommunicationPage() {
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
                <MessageSquare className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Communication Center</h1>
                <p className="text-sm text-muted-foreground">Emergency SMS and communication management</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <SMSCommunication />
          <CommunicationHub />
        </div>
      </main>
    </div>
  )
}
