'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { AlertCircle, ArrowRight, HeartPulse, ShieldCheck } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  DEMO_EMERGENCY_PROFILE,
  type EmergencyProfileData,
  isEmergencyProfileComplete,
} from '@/lib/supabase/hooks'

interface UserDetailsFormProps {
  initialProfile: EmergencyProfileData
  onSave: (profile: EmergencyProfileData) => Promise<EmergencyProfileData>
  onSaved: (profile: EmergencyProfileData) => void
}

export function UserDetailsForm({ initialProfile, onSave, onSaved }: UserDetailsFormProps) {
  const [profile, setProfile] = useState(initialProfile)
  const [hasEdited, setHasEdited] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const hasSavedDetails = Boolean(
    initialProfile.age ||
      initialProfile.bloodGroup ||
      initialProfile.emergencyContact1 ||
      initialProfile.emergencyContact2 ||
      initialProfile.address ||
      initialProfile.medicalConditions ||
      initialProfile.allergies ||
      initialProfile.medications,
  )

  useEffect(() => {
    if (!hasEdited) {
      setProfile(initialProfile)
    }
  }, [hasEdited, initialProfile])

  const updateField = (field: keyof EmergencyProfileData, value: string) => {
    setHasEdited(true)
    setProfile((current) => ({ ...current, [field]: value }))
    setError('')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!isEmergencyProfileComplete(profile)) {
      setError('Enter your name, age, blood group, and first emergency contact to continue.')
      return
    }

    setIsSaving(true)

    try {
      const savedProfile = await onSave(profile)
      setProfile(savedProfile)
      setHasEdited(false)
      onSaved(savedProfile)
    } catch (saveError) {
      console.error('[v0] Private profile save failed:', saveError instanceof Error ? saveError.name : 'UnknownError')
      setError('We could not save your details. Check your connection and try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="border-primary/15 shadow-xl shadow-primary/5">
      <form onSubmit={handleSubmit} className="flex flex-col">
      <CardHeader className="gap-3 border-b border-border/70 pb-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck aria-hidden="true" className="size-5" />
            </div>
            <div>
              <CardTitle className="text-xl">Your emergency details</CardTitle>
              <CardDescription className="mt-1">These details are saved privately and attached to your SOS record. SafeNet does not dispatch responders.</CardDescription>
            </div>
          </div>
          {!hasSavedDetails && !hasEdited && (
            <div className="flex flex-col gap-2 sm:items-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSaving}
                onClick={() => {
                  setProfile(DEMO_EMERGENCY_PROFILE)
                  setHasEdited(true)
                  setError('')
                }}
              >
                Fill with sample data
              </Button>
              <p className="max-w-xs text-xs text-muted-foreground sm:text-right">
                Not saved until you submit. The fictional phone number is blocked from SMS.
              </p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-6 pt-6">
        {error && (
          <Alert className="border-destructive/30 bg-destructive/10" role="alert">
            <AlertCircle aria-hidden="true" className="size-4 text-destructive" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="sr-only">Personal and emergency contact details</legend>
            <div className="flex flex-col gap-2">
              <Label htmlFor="profile-name">Full name <span aria-hidden="true">*</span></Label>
              <Input
                id="profile-name"
                autoComplete="name"
                value={profile.name}
                maxLength={120}
                required
                onChange={(event) => updateField('name', event.target.value)}
                placeholder="Enter your full name"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="profile-age">Age <span aria-hidden="true">*</span></Label>
              <Input
                id="profile-age"
                type="number"
                inputMode="numeric"
                min="0"
                max="120"
                step="1"
                value={profile.age}
                required
                onChange={(event) => updateField('age', event.target.value)}
                placeholder="Enter your age"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="profile-blood-group">Blood group <span aria-hidden="true">*</span></Label>
              <Select value={profile.bloodGroup} onValueChange={(value) => updateField('bloodGroup', value)}>
                <SelectTrigger id="profile-blood-group" aria-required="true" aria-invalid={!profile.bloodGroup}>
                  <SelectValue placeholder="Select your blood group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="profile-contact-1">Emergency contact phone <span aria-hidden="true">*</span></Label>
              <Input
                id="profile-contact-1"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={profile.emergencyContact1}
                maxLength={40}
                required
                onChange={(event) => updateField('emergencyContact1', event.target.value)}
                placeholder="International phone number"
              />
              <p className="text-xs text-muted-foreground">Include a +country code and use a contact you control. Reserved fictional U.S. 555 demo numbers cannot receive SMS.</p>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="profile-contact-2">Second emergency contact</Label>
              <Input
                id="profile-contact-2"
                type="tel"
                inputMode="tel"
                value={profile.emergencyContact2}
                maxLength={40}
                onChange={(event) => updateField('emergencyContact2', event.target.value)}
                placeholder="Optional phone number"
              />
            </div>

            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="profile-address">Home address</Label>
              <Textarea
                id="profile-address"
                autoComplete="street-address"
                value={profile.address}
                maxLength={1000}
                onChange={(event) => updateField('address', event.target.value)}
                placeholder="Optional address for responders"
                className="min-h-20"
              />
            </div>
          </fieldset>

          <section aria-labelledby="medical-details-heading" className="flex flex-col gap-4 border-t border-border pt-5">
            <div className="flex items-center gap-2">
              <HeartPulse aria-hidden="true" className="size-5 text-primary" />
              <h2 id="medical-details-heading" className="font-semibold">Medical details</h2>
              <span className="text-sm text-muted-foreground">Optional</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="profile-conditions">Medical conditions</Label>
                <Textarea
                  id="profile-conditions"
                  value={profile.medicalConditions}
                  maxLength={2000}
                  onChange={(event) => updateField('medicalConditions', event.target.value)}
                  placeholder="Conditions responders should know about"
                  className="min-h-24"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="profile-allergies">Allergies</Label>
                <Textarea
                  id="profile-allergies"
                  value={profile.allergies}
                  maxLength={2000}
                  onChange={(event) => updateField('allergies', event.target.value)}
                  placeholder="Known allergies"
                  className="min-h-24"
                />
              </div>
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label htmlFor="profile-medications">Current medications</Label>
                <Textarea
                  id="profile-medications"
                  value={profile.medications}
                  maxLength={2000}
                  onChange={(event) => updateField('medications', event.target.value)}
                  placeholder="Medications and dosages"
                  className="min-h-20"
                />
              </div>
            </div>
          </section>

          <Alert className="border-primary/15 bg-primary/5">
            <ShieldCheck aria-hidden="true" className="size-4 text-primary" />
            <AlertDescription>
              Your emergency details are saved to your account and protected by private, per-user database access. Sign in on another device to access them.
            </AlertDescription>
          </Alert>

      </CardContent>
      <CardFooter className="justify-end border-t border-border pt-5">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving your details…' : 'Save and view my profile'}
          {!isSaving && <ArrowRight aria-hidden="true" data-icon="inline-end" />}
        </Button>
      </CardFooter>
      </form>
    </Card>
  )
}
