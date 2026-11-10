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

export const DEMO_EMERGENCY_PROFILE: EmergencyProfileData = {
  name: 'SafeNet Demo User',
  age: '35',
  bloodGroup: 'O+',
  medicalConditions: 'Sample condition for testing only',
  emergencyContact1: '+12125550123',
  emergencyContact2: '+12125550124',
  address: 'Example Street, Sample City',
  allergies: 'Sample allergy for testing only',
  medications: 'Sample medication for testing only',
}

export function isEmergencyProfileComplete(profile: EmergencyProfileData) {
  return Boolean(
    profile.name.trim() &&
      profile.age.trim() &&
      profile.bloodGroup &&
      /^\+[1-9]\d{7,14}$/.test(profile.emergencyContact1.replace(/[\s()-]/g, '')),
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

const AUTH_USER_KEY = 'safenet/auth-user'
const PROFILE_CACHE_KEY = 'safenet/emergency-profile'
const PROFILE_COLUMNS =
  'full_name, age, blood_group, medical_conditions, emergency_contact1, emergency_contact2, address, allergies, medications'

async function loadCurrentUser(): Promise<User | null> {
  const supabase = createClient()
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error) {
    throw error
  }

  return session?.user ?? null
}

export function useAuthUser() {
  const supabase = typeof window === 'undefined' ? null : createClient()
  const { data, error, isLoading, mutate } = useSWR<User | null>(
    supabase ? AUTH_USER_KEY : null,
    loadCurrentUser,
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
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()
  const user = session?.user

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

    const normalizePhone = (value: string) => value.replace(/[\s()-]/g, '')
    const emergencyContact1 = normalizePhone(profile.emergencyContact1.trim())
    const emergencyContact2 = normalizePhone(profile.emergencyContact2.trim())
    const e164PhonePattern = /^\+[1-9]\d{7,14}$/
    if (!e164PhonePattern.test(emergencyContact1)) {
      throw new Error('Enter the first emergency contact in international format with a +country code.')
    }
    if (emergencyContact2 && !e164PhonePattern.test(emergencyContact2)) {
      throw new Error('Enter the second emergency contact in international format with a +country code.')
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
      emergencyContact1: emergencyContact1.slice(0, 16),
      emergencyContact2: emergencyContact2.slice(0, 16),
      address: profile.address.trim().slice(0, 1000),
      allergies: profile.allergies.trim().slice(0, 2000),
      medications: profile.medications.trim().slice(0, 2000),
    }

    const supabase = createClient()
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()
    const user = session?.user

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
        emergency_contact2: normalizedProfile.emergencyContact2 || null,
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

export interface SosAlertSummary {
  id: string
  emergencyType: string
  urgency: string
  status: string
  createdAt: string
  latitude: number | null
  longitude: number | null
}

const SOS_HISTORY_CACHE_KEY = 'safenet/sos-history'

async function loadSosAlertHistory(
  [, userId]: readonly [string, string],
): Promise<SosAlertSummary[]> {
  const response = await fetch('/api/sos?limit=5', { cache: 'no-store' })
  const result: unknown = await response.json()
  const payload = typeof result === 'object' && result !== null
    ? result as { alerts?: unknown; error?: unknown }
    : {}

  if (!response.ok || !Array.isArray(payload.alerts)) {
    throw new Error(typeof payload.error === 'string' ? payload.error : 'SOS alert history could not be loaded.')
  }

  return payload.alerts as SosAlertSummary[]
}

export function useSosAlertHistory(userId: string) {
  const key = userId ? ([SOS_HISTORY_CACHE_KEY, userId] as const) : null
  const { data, error, isLoading, mutate } = useSWR(key, loadSosAlertHistory, {
    revalidateOnFocus: true,
    shouldRetryOnError: false,
  })

  return {
    alerts: data ?? [],
    error,
    isLoading,
    refresh: () => mutate(),
  }
}
