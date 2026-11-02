'use client'

import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { User as UserIcon, MapPin, Phone } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useEmergencyProfile } from '@/lib/supabase/hooks'

interface UserProfileHeaderProps {
  user: User
}

export function UserProfileHeader({ user }: UserProfileHeaderProps) {
  const router = useRouter()
  const { profile } = useEmergencyProfile(user.id)
  const [locationStatus, setLocationStatus] = useState<'granted' | 'denied' | 'prompt'>('prompt')

  useEffect(() => {
    let isMounted = true

    if (!navigator.permissions?.query) {
      return
    }

    void navigator.permissions
      .query({ name: 'geolocation' })
      .then((result) => {
        if (isMounted) {
          setLocationStatus(result.state as 'granted' | 'denied' | 'prompt')
        }
      })
      .catch(() => undefined)

    return () => {
      isMounted = false
    }
  }, [])

  const displayName =
    profile.name ||
    (typeof user.user_metadata?.name === 'string' ? user.user_metadata.name : '') ||
    user.email?.split('@')[0] ||
    'SafeNet user'

  const handleEditProfile = () => {
    router.push('/profile')
  }

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('denied')
      return
    }

    navigator.geolocation.getCurrentPosition(
      () => setLocationStatus('granted'),
      () => setLocationStatus('denied'),
    )
  }

  const getInitials = (name: string) =>
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'SN'

  const locationIcon =
    locationStatus === 'granted' ? (
      <MapPin aria-hidden="true" className="size-4 text-green-600" />
    ) : locationStatus === 'denied' ? (
      <MapPin aria-hidden="true" className="size-4 text-destructive" />
    ) : (
      <MapPin aria-hidden="true" className="size-4 text-yellow-600" />
    )

  return (
    <div className="shrink-0">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label={`Open profile menu for ${displayName}`}
            variant="ghost"
            className="relative size-10 rounded-full border border-border bg-card shadow-sm transition-colors hover:bg-muted"
          >
            <Avatar className="size-9">
              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="mr-2 w-72 sm:mr-0 sm:w-80" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <UserIcon aria-hidden="true" className="size-3 sm:size-4" />
                <span className="truncate text-sm font-medium sm:text-base">{displayName}</span>
              </div>
              <p className="truncate text-xs text-muted-foreground">Private guest profile · this browser</p>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-1">
                  {locationIcon}
                  <span className="text-xs">
                    {locationStatus === 'granted'
                      ? 'Location On'
                      : locationStatus === 'denied'
                        ? 'Location Off'
                        : 'Location Needed'}
                  </span>
                </div>

                {locationStatus !== 'granted' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={requestLocation}
                    className="h-5 bg-transparent px-2 text-xs sm:h-6"
                  >
                    Enable
                  </Button>
                )}
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <div className="max-h-32 space-y-2 overflow-y-auto p-2 sm:max-h-none">
            <div className="text-xs text-muted-foreground">Emergency Info:</div>

            {user.phone && (
              <div className="flex items-center space-x-2 text-xs">
                <Phone aria-hidden="true" className="size-3 shrink-0" />
                <span className="truncate">{user.phone}</span>
              </div>
            )}

            {profile.bloodGroup && (
              <div className="text-xs">
                <span className="font-medium">Blood Group:</span> {profile.bloodGroup}
              </div>
            )}

            {profile.emergencyContact1 && (
              <div className="text-xs">
                <span className="font-medium">Emergency Contact:</span>
                <span className="block truncate sm:ml-1 sm:inline">{profile.emergencyContact1}</span>
              </div>
            )}

            {profile.medicalConditions && (
              <div className="break-words text-xs">
                <span className="font-medium">Medical:</span>
                <span className="block sm:ml-1 sm:inline">{profile.medicalConditions}</span>
              </div>
            )}
          </div>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleEditProfile} className="text-sm">
            <UserIcon aria-hidden="true" className="mr-2 size-3 sm:size-4" />
            <span>Edit profile</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
