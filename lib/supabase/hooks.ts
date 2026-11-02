'use client'

import { useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import useSWR from 'swr'
import { createClient } from './client'

export interface EmergencyProfileData {
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

export const EMPTY_EMERGENCY_PROFILE: EmergencyProfileData = {
  name: '',
  age: '',
  bloodGroup: '',
  medicalConditions: '',
  emergencyContact1: '',
  emergencyContact2: '',
  address: '',
  allergies: '',
  medications: '',
}

export function isEmergencyProfileComplete(profile: EmergencyProfileData) {
  return Boolean(
    profile.name.trim() &&
      profile.age.trim() &&
      profile.bloodGroup &&
      profile.emergencyContact1.trim(),
  )
}

interface ProfileRow {
  full_name: string | null
  age: number | null
  blood_group: string | null
  medical_conditions: string | null
  emergency_contact1: string | null
  emergency_contact2: string | null
  address: string | null
  allergies: string | null
  medications: string | null
}

interface EmergencyProfileSnapshot {
  userId: string
  profile: EmergencyProfileData
}

const GUEST_USER_KEY = 'safenet/guest-user'
const PROFILE_CACHE_KEY = 'safenet/emergency-profile'
const PROFILE_COLUMNS =
  'full_name, age, blood_group, medical_conditions, emergency_contact1, emergency_contact2, address, allergies, medications'

async function loadGuestUser(): Promise<User> {
  const supabase = createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (user) {
    return user
  }

  const missingSession =
    !error ||
    error.name === 'AuthSessionMissingError' ||
    error.status === 400 ||
    error.status === 401 ||
    error.status === 403

  if (error && !missingSession) {
    throw error
  }

  const { data, error: guestError } = await supabase.auth.signInAnonymously()

  if (guestError) {
    throw guestError
  }

  if (!data.user) {
    throw new Error('A private profile session could not be created.')
  }

  return data.user
}

export function useGuestUser() {
  const supabase = typeof window === 'undefined' ? null : createClient()
  const { data, error, isLoading, mutate } = useSWR<User>(
    supabase ? GUEST_USER_KEY : null,
    loadGuestUser,
    {
      revalidateOnFocus: true,
      shouldRetryOnError: false,
    },
  )

  useEffect(() => {
    if (!supabase) return

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      window.setTimeout(() => {
        void mutate()
      }, 0)
    })

    return () => subscription.unsubscribe()
  }, [mutate, supabase])

  return { user: data ?? null, error, isLoading, refresh: mutate }
}

async function loadEmergencyProfile(
  [, userId]: readonly [string, string],
): Promise<EmergencyProfileSnapshot> {
  const supabase = createClient()
  const {
    data: { user },
    error: sessionError,
  } = await supabase.auth.getUser()

  if (sessionError || !user || user.id !== userId) {
    throw new Error('Your private profile session could not be verified. Start again to load your profile.')
  }

  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  const row = data as ProfileRow | null
  const metadataName = user.user_metadata?.name
  const nameFromMetadata = typeof metadataName === 'string' ? metadataName.trim() : ''
  const fallbackName = user.email?.split('@')[0] ?? ''

  return {
    userId,
    profile: {
      name: row?.full_name?.trim() || nameFromMetadata || fallbackName,
      age: row?.age == null ? '' : String(row.age),
      bloodGroup: row?.blood_group ?? '',
      medicalConditions: row?.medical_conditions ?? '',
      emergencyContact1: row?.emergency_contact1 ?? '',
      emergencyContact2: row?.emergency_contact2 ?? '',
      address: row?.address ?? '',
      allergies: row?.allergies ?? '',
      medications: row?.medications ?? '',
    },
  }
}

export function useEmergencyProfile(userId: string) {
  const key = userId ? ([PROFILE_CACHE_KEY, userId] as const) : null
  const { data, error, isLoading, mutate } = useSWR(key, loadEmergencyProfile, {
    revalidateOnFocus: true,
    shouldRetryOnError: false,
  })

  const saveProfile = async (profile: EmergencyProfileData) => {
    if (!userId) {
      throw new Error('Start a private profile session before saving your details.')
    }

    const age = profile.age.trim() === '' ? null : Number(profile.age)
    if (age !== null && (!Number.isInteger(age) || age < 0 || age > 120)) {
      throw new Error('Enter an age between 0 and 120.')
    }

    const bloodGroup = profile.bloodGroup.trim()
    const allowedBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    if (bloodGroup && !allowedBloodGroups.includes(bloodGroup)) {
      throw new Error('Choose a valid blood group.')
    }

    const normalizedProfile: EmergencyProfileData = {
      name: profile.name.trim().slice(0, 120),
      age: age === null ? '' : String(age),
      bloodGroup,
      medicalConditions: profile.medicalConditions.trim().slice(0, 2000),
      emergencyContact1: profile.emergencyContact1.trim().slice(0, 40),
      emergencyContact2: profile.emergencyContact2.trim().slice(0, 40),
      address: profile.address.trim().slice(0, 1000),
      allergies: profile.allergies.trim().slice(0, 2000),
      medications: profile.medications.trim().slice(0, 2000),
    }

    const supabase = createClient()
    const {
      data: { user },
      error: sessionError,
    } = await supabase.auth.getUser()

    if (sessionError || !user || user.id !== userId) {
      throw new Error('Your private profile session expired. Refresh the page and try again.')
    }

    const { error: saveError } = await supabase.from('profiles').upsert(
      {
        id: user.id,
        full_name: normalizedProfile.name,
        age,
        blood_group: bloodGroup || null,
        medical_conditions: normalizedProfile.medicalConditions,
        emergency_contact1: normalizedProfile.emergencyContact1,
        emergency_contact2: normalizedProfile.emergencyContact2,
        address: normalizedProfile.address,
        allergies: normalizedProfile.allergies,
        medications: normalizedProfile.medications,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    )

    if (saveError) {
      throw saveError
    }

    await mutate({ userId, profile: normalizedProfile }, { revalidate: false })
    return normalizedProfile
  }

  return {
    data,
    profile: data?.profile ?? EMPTY_EMERGENCY_PROFILE,
    error,
    isLoading,
    saveProfile,
    refresh: () => mutate(),
  }
}
