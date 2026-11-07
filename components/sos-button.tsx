'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, MessageSquare, Phone } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SOSButtonProps {
  isActive: boolean
  onActivate: () => void
  onDeactivate: () => void
  userLocation: { lat: number; lng: number; accuracy?: number } | null
  connectionStatus: 'online' | 'offline'
  emergencyType: string
  canActivate: boolean
  accessMessage: string
  onAccessRequired: () => void
}

type RequestState = 'idle' | 'sending' | 'success' | 'error'

export function SOSButton({
  isActive,
  onActivate,
  onDeactivate,
  userLocation,
  connectionStatus,
  emergencyType,
  canActivate,
  accessMessage,
  onAccessRequired,
}: SOSButtonProps) {
  const [countdown, setCountdown] = useState<number | null>(null)
  const [isPressed, setIsPressed] = useState(false)
  const [requestState, setRequestState] = useState<RequestState>('idle')
  const [requestMessage, setRequestMessage] = useState('')

  const handleSOSActivation = useCallback(async () => {
    if (!canActivate) return

    setIsPressed(false)
    setRequestState('sending')
    setRequestMessage('Saving your SOS alert...')

    try {
      const response = await fetch('/api/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emergencyType,
          urgency: 'high',
          location: userLocation
            ? { latitude: userLocation.lat, longitude: userLocation.lng, accuracy: userLocation.accuracy }
            : null,
        }),
      })

      const result = (await response.json()) as {
        id?: unknown
        notificationsSent?: unknown
      }

      if (!response.ok || typeof result.id !== 'string') {
        throw new Error('Unable to save the SOS alert.')
      }

      const notificationsSent =
        typeof result.notificationsSent === 'number' ? result.notificationsSent : 0
      setRequestState('success')
      setRequestMessage(
        notificationsSent > 0
          ? `SOS alert ${result.id} was saved. An SMS notification was submitted to ${notificationsSent} emergency contact${notificationsSent === 1 ? '' : 's'}.`
          : `SOS alert ${result.id} was saved, but no SMS notification was submitted. Contact local emergency services directly if you need immediate help.`,
      )
      onActivate()
    } catch (error) {
      console.error('[v0] SOS persistence failed:', error instanceof Error ? error.name : 'UnknownError')
      setRequestState('error')
      setRequestMessage(
        'The SOS alert could not be saved. Check your connection and try again, or contact local emergency services directly.',
      )
    }
  }, [canActivate, emergencyType, onActivate, userLocation])

  useEffect(() => {
    if (countdown === null) {
      return
    }

    if (countdown === 0) {
      setCountdown(null)
      void handleSOSActivation()
      return
    }

    const timeout = window.setTimeout(() => {
      setCountdown((current) => (current === null ? null : current - 1))
    }, 1000)

    return () => window.clearTimeout(timeout)
  }, [countdown, handleSOSActivation])

  const handleSOSPress = () => {
    if (!canActivate) {
      onAccessRequired()
      return
    }

    if (isActive || requestState === 'sending') {
      return
    }

    setRequestState('idle')
    setRequestMessage('')
    setIsPressed(true)
    setCountdown(5)
  }

  const cancelCountdown = () => {
    setCountdown(null)
    setIsPressed(false)
  }

  useEffect(() => {
    if (!canActivate && countdown !== null) {
      setCountdown(null)
      setIsPressed(false)
    }
  }, [countdown, canActivate])

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-4">
      {countdown !== null && (
        <div className="text-center">
          <div className="mb-2 text-2xl font-bold text-destructive sm:text-3xl">{countdown}</div>
          <p className="mb-4 text-xs text-muted-foreground sm:text-sm">
            SOS will activate in {countdown} seconds
          </p>
          <Button variant="outline" size="sm" onClick={cancelCountdown} className="mb-4 bg-transparent">
            Cancel
          </Button>
        </div>
      )}

      <Button
        size="lg"
        variant={isActive ? 'destructive' : 'secondary'}
        disabled={isActive || requestState === 'sending'}
        className={cn(
          'h-24 w-24 rounded-full text-sm font-bold transition-all duration-200 sm:h-28 sm:w-28 sm:text-base md:h-32 md:w-32 md:text-lg',
          'touch-manipulation hover:scale-105 active:scale-95',
          isPressed && 'animate-pulse',
          isActive && 'bg-destructive hover:bg-destructive/90',
        )}
        onClick={handleSOSPress}
      >
        <span className="flex flex-col items-center gap-1 sm:gap-2">
          <AlertTriangle aria-hidden="true" className="size-6 sm:size-7 md:size-8" />
          {isActive ? 'ALERT SENT' : requestState === 'sending' ? 'SAVING' : 'SOS'}
        </span>
      </Button>

      {requestMessage && (
        <Alert
          role={requestState === 'error' ? 'alert' : 'status'}
          className={cn(
            'w-full max-w-sm',
            requestState === 'error' && 'border-destructive/30 bg-destructive/10',
            requestState === 'success' && 'border-primary/30 bg-primary/5',
          )}
        >
          <AlertDescription>{requestMessage}</AlertDescription>
        </Alert>
      )}

      {isActive && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            onDeactivate()
            setRequestState('idle')
            setRequestMessage('')
          }}
        >
          Start another SOS
        </Button>
      )}

      <div className="max-w-sm px-4 text-center">
        <p className="text-xs text-muted-foreground sm:text-sm">
          {isActive
            ? 'This alert was saved; any SMS already sent cannot be recalled. SafeNet does not dispatch emergency services.'
            : canActivate
              ? 'Press SOS to start a 5-second countdown. Cancel it if you did not mean to send an alert.'
              : accessMessage}
        </p>

        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground sm:gap-4">
          <div className="flex items-center gap-1">
            {connectionStatus === 'online' ? (
              <Phone aria-hidden="true" className="size-3 text-primary" />
            ) : (
              <MessageSquare aria-hidden="true" className="size-3 text-secondary" />
            )}
            <span>{connectionStatus === 'online' ? 'Network available' : 'No network connection'}</span>
          </div>
          {userLocation && (
            <div className="flex items-center gap-1">
              <span aria-hidden="true" className="size-2 rounded-full bg-primary" />
              <span>GPS ready</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
