import { AuthForm } from '@/components/auth-form'

interface LoginPageProps {
  searchParams?: { next?: string; error?: string }
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  return <AuthForm mode="sign-in" nextPath={searchParams?.next} callbackError={searchParams?.error} />
}
