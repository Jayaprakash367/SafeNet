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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild variant="outline" size="sm" className="self-start">
              <Link href="/">
                <ArrowLeft aria-hidden="true" data-icon="inline-start" />
                Back to SafeNet
              </Link>
            </Button>
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary">
                <MessageSquare aria-hidden="true" className="size-6 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold text-foreground">Communication Center</h1>
                <p className="text-sm text-muted-foreground">Emergency SMS and communication management</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto flex flex-col gap-6 px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <SMSCommunication />
          <CommunicationHub />
        </div>
      </main>
    </div>
  )
}
