import { AuthForm } from '@/components/auth-form'

interface SignUpPageProps {
  searchParams?: { next?: string; error?: string }
}

export default function SignUpPage({ searchParams }: SignUpPageProps) {
  return <AuthForm mode="sign-up" nextPath={searchParams?.next} callbackError={searchParams?.error} />
}
