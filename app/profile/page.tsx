'use client'

import { useEffect, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProfileSummary } from '@/components/profile-summary'
import { UserDetailsForm } from '@/components/user-details-form'
import {
  isEmergencyProfileComplete,
  useAuthUser,
  useEmergencyProfile,
} from '@/lib/supabase/hooks'

function FlowLoading({ label }: { label: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-sm border-primary/10 shadow-lg shadow-primary/5">
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
          <ShieldCheck aria-hidden="true" className="size-8 animate-pulse text-primary" />
          <p role="status" className="font-medium text-foreground">{label}</p>
        </CardContent>
      </Card>
    </main>
  )
}

function FlowError({ title, message, onRetry }: { title: string; message: string; onRetry: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-lg border-destructive/20 shadow-lg">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Alert className="border-primary/15 bg-primary/5">
            <AlertDescription>
              Your profile is protected by your account and is only available after you sign in.
            </AlertDescription>
          </Alert>
          <Button onClick={onRetry} className="self-start">Try again</Button>
        </CardContent>
      </Card>
    </main>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const {
    user,
    error: authError,
    isLoading: isAuthLoading,
  } = useAuthUser()
  const {
    data,
    profile,
    error: profileError,
    isLoading: isProfileLoading,
    saveProfile,
    refresh: refreshProfile,
  } = useEmergencyProfile(user?.id ?? '')
  const [view, setView] = useState<'form' | 'summary' | null>(null)

  useEffect(() => {
    if (!isAuthLoading && (!user || authError)) {
      router.replace(`/login?next=${encodeURIComponent('/profile')}`)
    }
  }, [authError, isAuthLoading, router, user])

  useEffect(() => {
    if (data && view === null) {
      setView(isEmergencyProfileComplete(data.profile) ? 'summary' : 'form')
    }
  }, [data, view])

  if (isAuthLoading || !user || isProfileLoading) {
    return <FlowLoading label="Preparing your private profile…" />
  }

  if (authError) {
    return <FlowError title="Your account could not be verified" message="Sign in again to access your private profile." onRetry={() => router.replace('/login?next=%2Fprofile')} />
  }

  if (profileError) {
    console.error('[v0] Emergency profile could not be loaded:', profileError instanceof Error ? profileError.name : 'UnknownError')
    return (
      <FlowError
        title="Your profile could not be loaded"
        message="Check your connection and try again. Your saved details have not been changed."
        onRetry={() => void refreshProfile()}
      />
    )
  }

  const currentView = view ?? (isEmergencyProfileComplete(profile) ? 'summary' : 'form')

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="flex items-center justify-between gap-4 border-b border-border/70 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-md">
              <ShieldCheck aria-hidden="true" className="size-5" />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight">SafeNet</p>
              <p className="text-xs text-muted-foreground">Emergency response profile</p>
            </div>
          </div>
          <span className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            Private account
          </span>
        </header>

        <section className="mx-auto flex w-full max-w-3xl flex-col gap-5">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Your safety information</p>
            <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              {currentView === 'summary' ? 'Your profile is ready' : 'Set up your profile'}
            </h1>
            <p className="max-w-2xl text-pretty text-muted-foreground">
              {currentView === 'summary'
                ? 'Review your details, then continue to the SafeNet main page.'
                : 'Enter a few details so SafeNet can include them in your saved SOS alert record.'}
            </p>
          </div>

          {currentView === 'summary' ? (
            <ProfileSummary
              profile={profile}
              onEdit={() => setView('form')}
              onContinue={() => router.push('/')}
            />
          ) : (
            <UserDetailsForm
              initialProfile={profile}
              onSave={saveProfile}
              onSaved={() => setView('summary')}
            />
          )}

          <footer className="border-t border-border/70 pt-4 text-center text-xs text-muted-foreground">
            For immediate danger, contact your local emergency services.
          </footer>
        </section>
      </div>
    </main>
  )
}
