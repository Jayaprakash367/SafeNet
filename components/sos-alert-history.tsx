'use client'

import { AlertTriangle, Clock, MapPin } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { SosAlertSummary } from '@/lib/supabase/hooks'

interface SosAlertHistoryProps {
  alerts: SosAlertSummary[]
  isLoading: boolean
  error: unknown
}

function formatCreatedAt(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Time unavailable' : date.toLocaleString()
}

export function SosAlertHistory({ alerts, isLoading, error }: SosAlertHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock aria-hidden="true" className="size-5 text-primary" />
          Recent SOS Alerts
        </CardTitle>
        <CardDescription>Saved to your private account. Medical profile details are not shown in this history.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {isLoading && <p className="text-sm text-muted-foreground" role="status">Loading saved alerts…</p>}
        {Boolean(error) && (
          <Alert role="alert" className="border-destructive/30 bg-destructive/10">
            <AlertTriangle aria-hidden="true" className="size-4 text-destructive" />
            <AlertDescription>Could not load your saved SOS history. Refresh the page and try again.</AlertDescription>
          </Alert>
        )}
        {!isLoading && !error && alerts.length === 0 && (
          <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">No saved SOS alerts yet.</p>
        )}
        {alerts.map((alert) => {
          const hasLocation = typeof alert.latitude === 'number' && typeof alert.longitude === 'number'
          const mapUrl = hasLocation
            ? `https://maps.google.com/?q=${alert.latitude},${alert.longitude}`
            : null

          return (
            <div key={alert.id} className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-col gap-1">
                <span className="font-medium">{alert.emergencyType}</span>
                <span className="text-xs text-muted-foreground">{formatCreatedAt(alert.createdAt)}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={alert.urgency === 'critical' || alert.urgency === 'high' ? 'destructive' : 'secondary'}>
                  {alert.urgency}
                </Badge>
                <Badge variant="outline">{alert.status}</Badge>
                {mapUrl && (
                  <a className="inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline" href={mapUrl} target="_blank" rel="noopener noreferrer">
                    <MapPin aria-hidden="true" className="size-3" />
                    Location
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
