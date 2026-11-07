'use client'

import { ArrowRight, HeartPulse, MapPin, Pencil, UserRound } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { type EmergencyProfileData } from '@/lib/supabase/hooks'

interface ProfileSummaryProps {
  profile: EmergencyProfileData
  onEdit: () => void
  onContinue: () => void
}

function ProfileDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-muted/60 p-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm font-medium">{value || 'Not provided'}</dd>
    </div>
  )
}

export function ProfileSummary({ profile, onEdit, onContinue }: ProfileSummaryProps) {
  return (
    <Card className="border-primary/15 shadow-xl shadow-primary/5">
      <CardHeader className="gap-3 border-b border-border/70 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UserRound aria-hidden="true" className="size-5" />
            </div>
            <div>
              <CardTitle className="text-xl">Your profile</CardTitle>
              <CardDescription className="mt-1">Review your emergency details before continuing.</CardDescription>
            </div>
          </div>
          <Badge variant="secondary">Ready</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 pt-6">
        <section aria-labelledby="personal-summary-heading" className="flex flex-col gap-3">
          <h2 id="personal-summary-heading" className="flex items-center gap-2 text-sm font-semibold">
            <UserRound aria-hidden="true" className="size-4 text-primary" />
            Personal and contact details
          </h2>
          <dl className="grid gap-3 sm:grid-cols-2">
            <ProfileDetail label="Full name" value={profile.name} />
            <ProfileDetail label="Age" value={profile.age ? `${profile.age} years` : ''} />
            <ProfileDetail label="Blood group" value={profile.bloodGroup} />
            <ProfileDetail label="Emergency contact" value={profile.emergencyContact1} />
            <ProfileDetail label="Second contact" value={profile.emergencyContact2} />
            <div className="sm:col-span-2">
              <ProfileDetail label="Home address" value={profile.address} />
            </div>
          </dl>
        </section>

        <section aria-labelledby="medical-summary-heading" className="flex flex-col gap-3 border-t border-border pt-5">
          <h2 id="medical-summary-heading" className="flex items-center gap-2 text-sm font-semibold">
            <HeartPulse aria-hidden="true" className="size-4 text-primary" />
            Medical details
          </h2>
          <dl className="grid gap-3 sm:grid-cols-2">
            <ProfileDetail label="Medical conditions" value={profile.medicalConditions} />
            <ProfileDetail label="Allergies" value={profile.allergies} />
            <div className="sm:col-span-2">
              <ProfileDetail label="Medications" value={profile.medications} />
            </div>
          </dl>
        </section>

        <Alert className="border-primary/15 bg-primary/5">
          <MapPin aria-hidden="true" className="size-4 text-primary" />
          <AlertDescription>
            This profile stays linked to this browser. There is no password to remember, but clearing browser data or switching devices means it cannot be recovered.
          </AlertDescription>
        </Alert>
      </CardContent>
      <CardFooter className="flex flex-col-reverse justify-between gap-3 border-t border-border pt-5 sm:flex-row">
        <Button type="button" variant="outline" onClick={onEdit}>
          <Pencil aria-hidden="true" data-icon="inline-start" />
          Edit details
        </Button>
        <Button type="button" onClick={onContinue}>
          Continue to main page
          <ArrowRight aria-hidden="true" data-icon="inline-end" />
        </Button>
      </CardFooter>
    </Card>
  )
}
