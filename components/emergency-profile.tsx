"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { User, Phone, Heart, MapPin, Save, Edit, CheckCircle } from "lucide-react"

interface EmergencyProfileData {
  name: string
  age: string
  bloodGroup: string
  medicalConditions: string
  emergencyContact1: string
  emergencyContact2: string
  address: string
  allergies: string
  medications: string
}

export function EmergencyProfile() {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [profile, setProfile] = useState<EmergencyProfileData>({
    name: "",
    age: "",
    bloodGroup: "",
    medicalConditions: "",
    emergencyContact1: "",
    emergencyContact2: "",
    address: "",
    allergies: "",
    medications: "",
  })

  // Load profile from localStorage on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem("safenet-profile")
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile))
    }
  }, [])

  const handleSave = () => {
    localStorage.setItem("safenet-profile", JSON.stringify(profile))
    setIsEditing(false)
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 3000)
  }

  const handleInputChange = (field: keyof EmergencyProfileData, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }))
  }

  const isProfileComplete = profile.name && profile.age && profile.bloodGroup && profile.emergencyContact1

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            <CardTitle>Emergency Profile</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {isProfileComplete && (
              <Badge variant="default" className="bg-primary">
                <CheckCircle className="w-3 h-3 mr-1" />
                Complete
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-1"
            >
              <Edit className="w-3 h-3" />
              {isEditing ? "Cancel" : "Edit"}
            </Button>
          </div>
        </div>
        <CardDescription>Critical information shared during emergencies for faster response</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isSaved && (
          <Alert className="border-primary bg-primary/10">
            <CheckCircle className="h-4 w-4 text-primary" />
            <AlertDescription className="text-primary">
              Profile saved successfully! This information will be shared during SOS alerts.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {/* Basic Information */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="name" className="text-sm font-medium">
                Full Name *
              </Label>
              {isEditing ? (
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter your full name"
                  className="mt-1"
                />
              ) : (
                <div className="mt-1 p-2 bg-muted rounded-md text-sm">{profile.name || "Not set"}</div>
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
                  value={profile.age}
                  onChange={(e) => handleInputChange("age", e.target.value)}
                  placeholder="Enter your age"
                  className="mt-1"
                />
              ) : (
                <div className="mt-1 p-2 bg-muted rounded-md text-sm">{profile.age || "Not set"}</div>
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
                <div className="mt-1 p-2 bg-muted rounded-md text-sm flex items-center gap-2">
                  <Heart className="w-4 h-4 text-destructive" />
                  {profile.bloodGroup || "Not set"}
                </div>
              )}
            </div>
          </div>

          {/* Contact Information */}
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
                  onChange={(e) => handleInputChange("emergencyContact1", e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="mt-1"
                />
              ) : (
                <div className="mt-1 p-2 bg-muted rounded-md text-sm flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" />
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
                  onChange={(e) => handleInputChange("emergencyContact2", e.target.value)}
                  placeholder="+1 (555) 987-6543"
                  className="mt-1"
                />
              ) : (
                <div className="mt-1 p-2 bg-muted rounded-md text-sm flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" />
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
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Enter your home address"
                  className="mt-1 min-h-[60px]"
                />
              ) : (
                <div className="mt-1 p-2 bg-muted rounded-md text-sm flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-pretty">{profile.address || "Not set"}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Medical Information */}
        <div className="space-y-3 pt-4 border-t border-border">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Heart className="w-4 h-4 text-destructive" />
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
                  onChange={(e) => handleInputChange("medicalConditions", e.target.value)}
                  placeholder="Diabetes, Hypertension, etc."
                  className="mt-1 min-h-[60px]"
                />
              ) : (
                <div className="mt-1 p-2 bg-muted rounded-md text-sm">
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
                  onChange={(e) => handleInputChange("allergies", e.target.value)}
                  placeholder="Penicillin, Peanuts, etc."
                  className="mt-1 min-h-[60px]"
                />
              ) : (
                <div className="mt-1 p-2 bg-muted rounded-md text-sm">{profile.allergies || "None specified"}</div>
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
                onChange={(e) => handleInputChange("medications", e.target.value)}
                placeholder="List current medications and dosages"
                className="mt-1 min-h-[60px]"
              />
            ) : (
              <div className="mt-1 p-2 bg-muted rounded-md text-sm">{profile.medications || "None specified"}</div>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="flex justify-end pt-4 border-t border-border">
            <Button onClick={handleSave} className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save Profile
            </Button>
          </div>
        )}

        {!isProfileComplete && !isEditing && (
          <Alert className="border-secondary bg-secondary/10">
            <AlertDescription className="text-secondary">
              Please complete your emergency profile. Required fields: Name, Age, Blood Group, and Emergency Contact.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
