"use client"

import { useState } from "react"
import { CheckCircle, Loader2, MessageSquare, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface TestSMSButtonProps {
  disabled?: boolean
  disabledMessage?: string
}

export function TestSMSButton({ disabled = false, disabledMessage }: TestSMSButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const sendTestSMS = async () => {
    if (disabled || isLoading) return

    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/test-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      const data = (await response.json()) as { message?: unknown; error?: unknown }
      const message =
        (response.ok && typeof data.message === "string" && data.message) ||
        (typeof data.error === "string" && data.error) ||
        "The SMS test could not be completed."

      setResult({ success: response.ok, message })
    } catch {
      setResult({ success: false, message: "Network error. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full min-w-0 max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare aria-hidden="true" className="size-5" />
          Test SMS Delivery
        </CardTitle>
        <CardDescription>
          {disabled
            ? disabledMessage ?? 'A private emergency profile is required to send a test message.'
            : 'Sends a real test message to the first emergency contact saved in your profile.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Button onClick={sendTestSMS} disabled={disabled || isLoading} className="w-full whitespace-normal" size="lg">
          {isLoading ? (
            <>
              <Loader2 aria-hidden="true" className="animate-spin" data-icon="inline-start" />
              Sending test SMS...
            </>
          ) : (
            <>
              <MessageSquare aria-hidden="true" data-icon="inline-start" />
              Send test SMS
            </>
          )}
        </Button>

        {result && (
          <div
            role={result.success ? "status" : "alert"}
            className={`flex items-center gap-2 rounded-lg border p-3 ${
              result.success
                ? "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300"
                : "border-destructive/30 bg-destructive/10 text-destructive"
            }`}
          >
            {result.success ? (
              <CheckCircle aria-hidden="true" className="size-4 shrink-0" />
            ) : (
              <XCircle aria-hidden="true" className="size-4 shrink-0" />
            )}
            <span className="text-sm font-medium">{result.message}</span>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Save a valid international phone number in Emergency Profile first. SMS delivery depends on your provider and
          account configuration.
        </p>
      </CardContent>
    </Card>
  )
}
