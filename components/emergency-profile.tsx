"use client"

import { useEffect, useState } from "react"
import { AlertCircle, CheckCircle, Edit, Heart, MapPin, Phone, Save, User } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  EMPTY_EMERGENCY_PROFILE,
  type EmergencyProfileData,
  useEmergencyProfile,
} from "@/lib/supabase/hooks"

interface EmergencyProfileProps {
  userId: string
}

export function EmergencyProfile({ userId }: EmergencyProfileProps) {
  const { data, error: loadError, isLoading, saveProfile } = useEmergencyProfile(userId)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState("")
  const [profile, setProfile] = useState<EmergencyProfileData>(EMPTY_EMERGENCY_PROFILE)

  useEffect(() => {
    if (data && !isEditing) {
      setProfile(data.profile)
    }
  }, [data, isEditing])

  const handleSave = async () => {
    setSaveError("")
    setIsSaving(true)

    try {
      const savedProfile = await saveProfile(profile)
      setProfile(savedProfile)
      setIsEditing(false)
      setIsSaved(true)
      window.setTimeout(() => setIsSaved(false), 3000)
    } catch (error) {
      console.error("[v0] Emergency profile save failed:", error instanceof Error ? error.name : "UnknownError")
      setSaveError("We could not save your profile. Check your connection and try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditToggle = () => {
    if (isEditing) {
      setProfile(data?.profile ?? EMPTY_EMERGENCY_PROFILE)
      setIsEditing(false)
      setSaveError("")
      return
    }

    setIsEditing(true)
    setSaveError("")
  }

  const handleInputChange = (field: keyof EmergencyProfileData, value: string) => {
    setProfile((previous) => ({ ...previous, [field]: value }))
  }

  const isProfileComplete = Boolean(
    profile.name.trim() && profile.age.trim() && profile.bloodGroup && profile.emergencyContact1.trim(),
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <User aria-hidden="true" className="size-5 text-primary" />
            <CardTitle>Emergency Profile</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {isProfileComplete && (
              <Badge variant="default" className="bg-primary">
                <CheckCircle aria-hidden="true" className="mr-1 size-3" />
                Complete
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleEditToggle}
              disabled={isLoading || isSaving}
              className="flex items-center gap-1"
            >
              <Edit aria-hidden="true" className="size-3" />
              {isEditing ? "Cancel" : "Edit"}
            </Button>
          </div>
        </div>
        <CardDescription>Critical information stays in your private profile and is included with your SOS alerts.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && <p className="text-sm text-muted-foreground" role="status">Loading your saved profile...</p>}

        {loadError && (
          <Alert className="border-destructive/30 bg-destructive/10" role="alert">
            <AlertCircle aria-hidden="true" className="size-4 text-destructive" />
            <AlertDescription>We could not load your saved profile. Refresh the page and try again.</AlertDescription>
          </Alert>
        )}

        {saveError && (
          <Alert className="border-destructive/30 bg-destructive/10" role="alert">
            <AlertCircle aria-hidden="true" className="size-4 text-destructive" />
            <AlertDescription>{saveError}</AlertDescription>
          </Alert>
        )}

        {isSaved && (
          <Alert className="border-primary bg-primary/10" role="status">
            <CheckCircle aria-hidden="true" className="size-4 text-primary" />
            <AlertDescription className="text-primary">
              Profile saved successfully. This information is ready for your SOS alerts.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <div>
              <Label htmlFor="name" className="text-sm font-medium">
                Full Name *
              </Label>
              {isEditing ? (
                <Input
                  id="name"
                  value={profile.name}
                  maxLength={120}
                  onChange={(event) => handleInputChange("name", event.target.value)}
                  placeholder="Enter your full name"
                  className="mt-1"
                />
              ) : (
                <div className="mt-1 rounded-md bg-muted p-2 text-sm">{profile.name || "Not set"}</div>
              )}
            </div>

            <div>
              <Label htmlFor="age" className="text-sm font-medium">
                Age *
              </Label>
              {isEditing ? (
                <Input
                  id="age"
                  type="number"
                  min="0"
                  max="120"
                  step="1"
                  value={profile.age}
                  onChange={(event) => handleInputChange("age", event.target.value)}
                  placeholder="Enter your age"
                  className="mt-1"
                />
              ) : (
                <div className="mt-1 rounded-md bg-muted p-2 text-sm">{profile.age || "Not set"}</div>
              )}
            </div>

            <div>
              <Label htmlFor="bloodGroup" className="text-sm font-medium">
                Blood Group *
              </Label>
              {isEditing ? (
                <Select value={profile.bloodGroup} onValueChange={(value) => handleInputChange("bloodGroup", value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select blood group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="mt-1 flex items-center gap-2 rounded-md bg-muted p-2 text-sm">
                  <Heart aria-hidden="true" className="size-4 text-destructive" />
                  {profile.bloodGroup || "Not set"}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="contact1" className="text-sm font-medium">
                Emergency Contact 1 *
              </Label>
              {isEditing ? (
                <Input
                  id="contact1"
                  type="tel"
                  value={profile.emergencyContact1}
                  maxLength={40}
                  onChange={(event) => handleInputChange("emergencyContact1", event.target.value)}
                  placeholder="+1 555 123 4567"
                  className="mt-1"
                />
              ) : (
                <div className="mt-1 flex items-center gap-2 rounded-md bg-muted p-2 text-sm">
                  <Phone aria-hidden="true" className="size-4 text-primary" />
                  {profile.emergencyContact1 || "Not set"}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="contact2" className="text-sm font-medium">
                Emergency Contact 2
              </Label>
              {isEditing ? (
                <Input
                  id="contact2"
                  type="tel"
                  value={profile.emergencyContact2}
                  maxLength={40}
                  onChange={(event) => handleInputChange("emergencyContact2", event.target.value)}
                  placeholder="+1 555 987 6543"
                  className="mt-1"
                />
              ) : (
                <div className="mt-1 flex items-center gap-2 rounded-md bg-muted p-2 text-sm">
                  <Phone aria-hidden="true" className="size-4 text-primary" />
                  {profile.emergencyContact2 || "Not set"}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="address" className="text-sm font-medium">
                Home Address
              </Label>
              {isEditing ? (
                <Textarea
                  id="address"
                  value={profile.address}
                  maxLength={1000}
                  onChange={(event) => handleInputChange("address", event.target.value)}
                  placeholder="Enter your home address"
                  className="mt-1 min-h-[60px]"
                />
              ) : (
                <div className="mt-1 flex items-start gap-2 rounded-md bg-muted p-2 text-sm">
                  <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span className="text-pretty">{profile.address || "Not set"}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3 border-t border-border pt-4">
          <h4 className="flex items-center gap-2 text-sm font-medium">
            <Heart aria-hidden="true" className="size-4 text-destructive" />
            Medical Information
          </h4>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label htmlFor="conditions" className="text-sm font-medium">
                Medical Conditions
              </Label>
              {isEditing ? (
                <Textarea
                  id="conditions"
                  value={profile.medicalConditions}
                  maxLength={2000}
                  onChange={(event) => handleInputChange("medicalConditions", event.target.value)}
                  placeholder="Diabetes, hypertension, etc."
                  className="mt-1 min-h-[60px]"
                />
              ) : (
                <div className="mt-1 rounded-md bg-muted p-2 text-sm">
                  {profile.medicalConditions || "None specified"}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="allergies" className="text-sm font-medium">
                Allergies
              </Label>
              {isEditing ? (
                <Textarea
                  id="allergies"
                  value={profile.allergies}
                  maxLength={2000}
                  onChange={(event) => handleInputChange("allergies", event.target.value)}
                  placeholder="Penicillin, peanuts, etc."
                  className="mt-1 min-h-[60px]"
                />
              ) : (
                <div className="mt-1 rounded-md bg-muted p-2 text-sm">{profile.allergies || "None specified"}</div>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="medications" className="text-sm font-medium">
              Current Medications
            </Label>
            {isEditing ? (
              <Textarea
                id="medications"
                value={profile.medications}
                maxLength={2000}
                onChange={(event) => handleInputChange("medications", event.target.value)}
                placeholder="List current medications and dosages"
                className="mt-1 min-h-[60px]"
              />
            ) : (
              <div className="mt-1 rounded-md bg-muted p-2 text-sm">{profile.medications || "None specified"}</div>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="flex justify-end border-t border-border pt-4">
            <Button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2">
              <Save aria-hidden="true" className="size-4" />
              {isSaving ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        )}

        {!isProfileComplete && !isEditing && !isLoading && (
          <Alert className="border-secondary bg-secondary/10">
            <AlertDescription className="text-secondary">
              Complete your emergency profile with your name, age, blood group, and first emergency contact.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
