"use client"

import { useState, useEffect } from "react"
import { User, MapPin, Phone, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"

interface UserData {
  name: string
  email: string
  phone: string
  emergencyContact: string
  bloodGroup: string
  medicalConditions: string
}

export function UserProfileHeader() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [locationStatus, setLocationStatus] = useState<"granted" | "denied" | "prompt">("prompt")

  useEffect(() => {
    // Load user data from localStorage
    const userData = localStorage.getItem("safenet-user")
    if (userData) {
      setUser(JSON.parse(userData))
    }

    // Check location permission status
    if (navigator.geolocation) {
      navigator.permissions?.query({ name: "geolocation" }).then((result) => {
        setLocationStatus(result.state as "granted" | "denied" | "prompt")
      })
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("safenet-auth")
    localStorage.removeItem("safenet-user")
    router.push("/login")
  }

  const requestLocation = () => {
    navigator.geolocation.getCurrentPosition(
      () => {
        setLocationStatus("granted")
        console.log("[v0] Location permission granted")
      },
      () => {
        setLocationStatus("denied")
        console.log("[v0] Location permission denied")
      },
    )
  }

  if (!user) return null

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const getLocationIcon = () => {
    switch (locationStatus) {
      case "granted":
        return <MapPin className="h-4 w-4 text-green-600" />
      case "denied":
        return <MapPin className="h-4 w-4 text-red-600" />
      default:
        return <MapPin className="h-4 w-4 text-yellow-600" />
    }
  }

  return (
    <div className="fixed top-2 sm:top-4 right-2 sm:right-4 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white shadow-lg border">
            <Avatar className="h-7 w-7 sm:h-9 sm:w-9">
              <AvatarFallback className="bg-red-100 text-red-700 font-semibold text-xs sm:text-sm">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-72 sm:w-80 mr-2 sm:mr-0" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <User className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="font-medium text-sm sm:text-base truncate">{user.name}</span>
              </div>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-1">
                  {getLocationIcon()}
                  <span className="text-xs">
                    {locationStatus === "granted"
                      ? "Location On"
                      : locationStatus === "denied"
                        ? "Location Off"
                        : "Location Needed"}
                  </span>
                </div>

                {locationStatus !== "granted" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={requestLocation}
                    className="h-5 sm:h-6 text-xs bg-transparent px-2"
                  >
                    Enable
                  </Button>
                )}
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <div className="p-2 space-y-2 max-h-32 sm:max-h-none overflow-y-auto">
            <div className="text-xs text-muted-foreground">Emergency Info:</div>

            {user.phone && (
              <div className="flex items-center space-x-2 text-xs">
                <Phone className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{user.phone}</span>
              </div>
            )}

            {user.bloodGroup && (
              <div className="text-xs">
                <span className="font-medium">Blood Group:</span> {user.bloodGroup}
              </div>
            )}

            {user.emergencyContact && (
              <div className="text-xs">
                <span className="font-medium">Emergency Contact:</span>
                <span className="block sm:inline sm:ml-1 truncate">{user.emergencyContact}</span>
              </div>
            )}

            {user.medicalConditions && (
              <div className="text-xs">
                <span className="font-medium">Medical:</span>
                <span className="block sm:inline sm:ml-1 break-words">{user.medicalConditions}</span>
              </div>
            )}
          </div>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleLogout} className="text-red-600 text-sm">
            <LogOut className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
