"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Shield, MapPin } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface UserData {
  name: string
  email: string
  phone: string
  emergencyContact: string
  bloodGroup: string
  medicalConditions: string
}

export default function LoginPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState<UserData>({
    name: "",
    email: "",
    phone: "",
    emergencyContact: "",
    bloodGroup: "",
    medicalConditions: "",
  })

  const handleInputChange = (field: keyof UserData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const requestLocationPermission = async () => {
    try {
      const permission = await navigator.geolocation.getCurrentPosition(
        () => console.log("[v0] Location permission granted"),
        () => console.log("[v0] Location permission denied"),
      )
      return true
    } catch (error) {
      console.log("[v0] Location permission error:", error)
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (isLogin) {
        // Login logic - check if user exists in localStorage
        const existingUser = localStorage.getItem("safenet-user")
        if (existingUser) {
          const userData = JSON.parse(existingUser)
          if (userData.email === formData.email) {
            localStorage.setItem("safenet-auth", "true")
            await requestLocationPermission()
            router.push("/")
            return
          }
        }
        setError("User not found. Please sign up first.")
      } else {
        // Signup logic - validate and store user data
        if (!formData.name || !formData.email || !formData.phone) {
          setError("Please fill in all required fields")
          return
        }

        const userData = {
          ...formData,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
        }

        localStorage.setItem("safenet-user", JSON.stringify(userData))
        localStorage.setItem("safenet-auth", "true")

        // Request location permission after signup
        await requestLocationPermission()

        router.push("/")
      }
    } catch (error) {
      console.log("[v0] Auth error:", error)
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center px-4 sm:px-6">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-red-600 mr-2" />
            <h1 className="text-xl sm:text-2xl font-bold text-red-600">SafeNet</h1>
          </div>
          <CardTitle className="text-lg sm:text-xl">{isLogin ? "Welcome Back" : "Join SafeNet"}</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            {isLogin ? "Sign in to access emergency services" : "Create your emergency profile for instant help"}
          </CardDescription>
        </CardHeader>

        <CardContent className="px-4 sm:px-6">
          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700 text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {!isLogin && (
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="name" className="text-sm">
                  Full Name *
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter your full name"
                  required={!isLogin}
                  className="text-sm sm:text-base"
                />
              </div>
            )}

            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="email" className="text-sm">
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Enter your email"
                required
                className="text-sm sm:text-base"
              />
            </div>

            {!isLogin && (
              <>
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="phone" className="text-sm">
                    Phone Number *
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="Enter your phone number"
                    required
                    className="text-sm sm:text-base"
                  />
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="emergencyContact" className="text-sm">
                    Emergency Contact
                  </Label>
                  <Input
                    id="emergencyContact"
                    type="tel"
                    value={formData.emergencyContact}
                    onChange={(e) => handleInputChange("emergencyContact", e.target.value)}
                    placeholder="Emergency contact number"
                    className="text-sm sm:text-base"
                  />
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="bloodGroup" className="text-sm">
                    Blood Group
                  </Label>
                  <select
                    id="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={(e) => handleInputChange("bloodGroup", e.target.value)}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">Select blood group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="medicalConditions" className="text-sm">
                    Medical Conditions
                  </Label>
                  <Input
                    id="medicalConditions"
                    type="text"
                    value={formData.medicalConditions}
                    onChange={(e) => handleInputChange("medicalConditions", e.target.value)}
                    placeholder="Any medical conditions or allergies"
                    className="text-sm sm:text-base"
                  />
                </div>
              </>
            )}

            <Button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-sm sm:text-base py-2 sm:py-3"
              disabled={loading}
            >
              {loading ? "Processing..." : isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-red-600 hover:text-red-700 text-xs sm:text-sm underline"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>

          {!isLogin && (
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center text-blue-700 mb-2">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                <span className="text-xs sm:text-sm font-medium">Location Services</span>
              </div>
              <p className="text-xs text-blue-600">
                SafeNet requires location access to provide accurate emergency services. You'll be prompted to enable
                location after creating your account.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
