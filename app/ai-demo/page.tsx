'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Brain, ShieldCheck } from 'lucide-react'
import { AIEmergencyClassifier } from '@/components/ai-emergency-classifier'
import { AIVoiceRecorder } from '@/components/ai-voice-recorder'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuthUser, useEmergencyProfile } from '@/lib/supabase/hooks'

const emergencyTypes = [
  { value: 'medical_heart', label: 'Medical emergency' },
  { value: 'fire_building', label: 'Fire emergency' },
  { value: 'accident_car', label: 'Vehicle accident' },
  { value: 'natural_earthquake', label: 'Natural hazard' },
  { value: 'security_break', label: 'Security emergency' },
  { value: 'other_general', label: 'General emergency' },
]

export default function AIDemoPage() {
  const { user, isLoading: isAuthLoading, error: authError } = useAuthUser()
  const { profile, isLoading: isProfileLoading, error: profileError } = useEmergencyProfile(user?.id ?? '')
  const [selectedEmergency, setSelectedEmergency] = useState('')
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => setHasMounted(true), [])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/">
              <ArrowLeft aria-hidden="true" data-icon="inline-start" />
              Back to SafeNet
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Brain aria-hidden="true" className="size-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">AI Demo Center</h1>
              <p className="text-sm text-muted-foreground">Authenticated, server-side scenario analysis</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6">
        {!hasMounted || isAuthLoading ? (
          <p role="status" className="text-sm text-muted-foreground">Checking your SafeNet account…</p>
        ) : authError || !user ? (
          <Card className="mx-auto w-full max-w-xl">
            <CardHeader>
              <CardTitle>Sign in to use AI analysis</CardTitle>
              <CardDescription>Analysis is tied to your SafeNet account and never creates an alert.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button asChild><Link href="/login?next=%2Fai-demo">Sign in</Link></Button>
              <Button asChild variant="outline"><Link href="/sign-up?next=%2Fprofile">Create account</Link></Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Alert className="border-primary/20 bg-primary/5" role="note">
              <ShieldCheck aria-hidden="true" className="size-4 text-primary" />
              <AlertDescription>
                Analysis runs only after you request it. Scenario analysis may use your saved age, medical conditions, and allergies; voice analysis sends the recording for transcription. Results are not stored and never contact responders. Do not use this demo to decide whether to seek emergency help.
              </AlertDescription>
            </Alert>

            {profileError && (
              <Alert role="alert" className="border-destructive/30 bg-destructive/10">
                <AlertDescription>Your private profile could not be loaded. Analysis is paused until the profile is available.</AlertDescription>
              </Alert>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Choose a scenario</CardTitle>
                <CardDescription>Select a scenario, then explicitly request server-side analysis.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex w-full max-w-md flex-col gap-2">
                  <Label htmlFor="emergency-scenario">Emergency scenario</Label>
                  <Select value={selectedEmergency} onValueChange={setSelectedEmergency} disabled={isProfileLoading || Boolean(profileError)}>
                    <SelectTrigger id="emergency-scenario">
                      <SelectValue placeholder="Select a scenario" />
                    </SelectTrigger>
                    <SelectContent>
                      {emergencyTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">
                  {isProfileLoading
                    ? 'Loading your private profile…'
                    : profile.age || profile.medicalConditions || profile.allergies
                      ? 'Limited profile context is available for the requested analysis.'
                      : 'No saved medical profile data is available; analysis will use only the selected scenario.'}
                </p>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <AIVoiceRecorder />
              <AIEmergencyClassifier emergencyType={selectedEmergency} />
            </div>
          </>
        )}

        <footer className="border-t border-border pt-4 text-center text-xs text-muted-foreground">
          SafeNet does not dispatch emergency services. For immediate danger, contact local emergency services directly.
        </footer>
      </main>
    </div>
  )
}
