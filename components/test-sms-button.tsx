"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, CheckCircle, XCircle, Loader2 } from "lucide-react"

export function TestSMSButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const sendTestSMS = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/test-sms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: "+918825516088", // Your Indian phone number
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult({ success: true, message: data.message })
      } else {
        setResult({ success: false, message: data.error || "Failed to send test SMS" })
      }
    } catch (error) {
      setResult({ success: false, message: "Network error occurred" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full min-w-0 max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Test SMS Delivery
        </CardTitle>
        <CardDescription>Send a test message to +91 8825 516088.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Button
          onClick={sendTestSMS}
          disabled={isLoading}
          className="w-full whitespace-normal"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" data-icon="inline-start" />
              Sending Test SMS...
            </>
          ) : (
            <>
              <MessageSquare data-icon="inline-start" />
              Send Test SMS
            </>
          )}
        </Button>

        {result && (
          <div
            className={`flex items-center gap-2 p-3 rounded-lg ${
              result.success
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {result.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            <span className="text-sm font-medium">{result.message}</span>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p>• Check your phone for the test message</p>
          <p>• Trial accounts can only send to verified numbers</p>
          <p>• Messages may take 1-2 minutes to arrive</p>
        </div>
      </CardContent>
    </Card>
  )
}
