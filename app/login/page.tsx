'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { AlertCircle, Eye, EyeOff, Loader2, CheckCircle2, AlertTriangle, Shield } from 'lucide-react'

type AuthMode = 'login' | 'signup'

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<AuthMode>('login')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Login state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({})
  const [loginTouched, setLoginTouched] = useState<Record<string, boolean>>({})

  // Signup state
  const [signupName, setSignupName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showSignupPassword, setShowSignupPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [signupErrors, setSignupErrors] = useState<Record<string, string>>({})
  const [signupTouched, setSignupTouched] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const authError = new URLSearchParams(window.location.search).get('authError')

    if (authError === 'service') {
      setError('Authentication is temporarily unavailable. Please try again shortly.')
    } else if (authError === 'callback') {
      setError('We could not verify that email link. Please request a new confirmation email.')
    }
  }, [])

  // Validate email
  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validate
    const newErrors: Record<string, string> = {}
    if (!loginEmail) newErrors.email = 'Email is required'
    else if (!validateEmail(loginEmail)) newErrors.email = 'Invalid email format'
    if (!loginPassword) newErrors.password = 'Password is required'
    else if (loginPassword.length < 6) newErrors.password = 'Password must be at least 6 characters'

    if (Object.keys(newErrors).length > 0) {
      setLoginErrors(newErrors)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/login-supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail.toLowerCase(),
          password: loginPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Login failed. Please try again.')
        if (data.errors) {
          setLoginErrors(data.errors)
        }
        return
      }

      setSuccess(data.message || 'Login successful! Redirecting...')
      setTimeout(() => router.replace('/'), 900)
    } catch (err) {
      console.error('[v0] Login error:', err)
      setError('Network error. Please check your connection.')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle signup
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validate
    const newErrors: Record<string, string> = {}
    if (!signupName) newErrors.name = 'Name is required'
    else if (signupName.trim().length < 2) newErrors.name = 'Name must be at least 2 characters'
    if (!signupEmail) newErrors.email = 'Email is required'
    else if (!validateEmail(signupEmail)) newErrors.email = 'Invalid email format'
    if (!signupPassword) newErrors.password = 'Password is required'
    else if (signupPassword.length < 6) newErrors.password = 'Password must be at least 6 characters'
    if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your password'
    else if (confirmPassword !== signupPassword) newErrors.confirmPassword = 'Passwords do not match'

    if (Object.keys(newErrors).length > 0) {
      setSignupErrors(newErrors)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/signup-supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: signupEmail.toLowerCase(),
          password: signupPassword,
          confirmPassword: confirmPassword,
          name: signupName.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Signup failed. Please try again.')
        if (data.errors) {
          setSignupErrors(data.errors)
        }
        return
      }

      if (data.requiresConfirmation) {
        setSuccess(data.message)
        return
      }

      setSuccess(data.message || 'Account created successfully! Redirecting...')
      setTimeout(() => router.replace('/'), 900)
    } catch (err) {
      console.error('[v0] Signup error:', err)
      setError('Network error. Please check your connection.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-red-50 via-background to-orange-50 px-4 py-12 dark:from-background dark:via-background dark:to-background">
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-secondary/10 rounded-full blur-3xl opacity-50"></div>
      </div>

      {/* Auth Card */}
      <Card className="relative z-10 w-full max-w-md border border-border/80 bg-card/95 shadow-2xl shadow-primary/10 backdrop-blur-xl">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8 text-center animate-fade-in">
            <div className="mb-4 flex justify-center">
              <span className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-md">
                <Shield aria-hidden="true" className="size-6" />
              </span>
            </div>
            <h1 className="mb-2 text-3xl font-bold text-primary">SafeNet</h1>
            <p className="text-sm text-muted-foreground">Emergency Response Platform</p>
          </div>

          {/* Mode Tabs */}
          <div className="flex gap-2 mb-8 bg-muted/70 p-1 rounded-lg">
            <button
              onClick={() => {
                setMode('login')
                setError('')
                setSuccess('')
              }}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all duration-200 ${
                mode === 'login'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setMode('signup')
                setError('')
                setSuccess('')
              }}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all duration-200 ${
                mode === 'signup'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex gap-3 items-start animate-slide-in-left">
              <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-600/10 border border-green-600/30 dark:bg-green-400/10 dark:border-green-400/30 rounded-lg flex gap-3 items-start animate-slide-in-left">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-300 flex-shrink-0 mt-0.5" />
              <p className="text-green-700 dark:text-green-300 text-sm">{success}</p>
            </div>
          )}

          {/* Login Form */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4 animate-fade-in">
              <div className="space-y-2">
                <label htmlFor="login-email" className="text-sm font-medium text-foreground">Email Address</label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="your@email.com"
                  value={loginEmail}
                  onChange={(e) => {
                    setLoginEmail(e.target.value)
                    if (loginTouched.email) {
                      const err = { ...loginErrors }
                      if (!e.target.value) err.email = 'Email is required'
                      else if (!validateEmail(e.target.value)) err.email = 'Invalid email format'
                      else delete err.email
                      setLoginErrors(err)
                    }
                  }}
                  onBlur={() => setLoginTouched({ ...loginTouched, email: true })}
                  disabled={isLoading}
                  className={`bg-background/80 border ${
                    loginErrors.email ? 'border-destructive' : 'border-border'
                  } text-foreground placeholder:text-muted-foreground focus:border-primary transition-all`}
                />
                {loginTouched.email && loginErrors.email && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {loginErrors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="login-password" className="text-sm font-medium text-foreground">Password</label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showLoginPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value)
                      if (loginTouched.password) {
                        const err = { ...loginErrors }
                        if (!e.target.value) err.password = 'Password is required'
                        else if (e.target.value.length < 6) err.password = 'Password must be at least 6 characters'
                        else delete err.password
                        setLoginErrors(err)
                      }
                    }}
                    onBlur={() => setLoginTouched({ ...loginTouched, password: true })}
                    disabled={isLoading}
                    className={`bg-background/80 border ${
                      loginErrors.password ? 'border-destructive' : 'border-border'
                    } text-foreground placeholder:text-muted-foreground focus:border-primary transition-all pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    disabled={isLoading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {loginTouched.password && loginErrors.password && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {loginErrors.password}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 mt-6 transition-all duration-300 active:scale-95"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          )}

          {/* Signup Form */}
          {mode === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-4 animate-fade-in">
              <div className="space-y-2">
                <label htmlFor="signup-name" className="text-sm font-medium text-foreground">Full Name</label>
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="John Doe"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  onBlur={() => setSignupTouched({ ...signupTouched, name: true })}
                  disabled={isLoading}
                  className={`bg-background/80 border ${
                    signupErrors.name ? 'border-destructive' : 'border-border'
                  } text-foreground placeholder:text-muted-foreground focus:border-primary transition-all`}
                />
                {signupTouched.name && signupErrors.name && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {signupErrors.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="signup-email" className="text-sm font-medium text-foreground">Email Address</label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="your@email.com"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  onBlur={() => setSignupTouched({ ...signupTouched, email: true })}
                  disabled={isLoading}
                  className={`bg-background/80 border ${
                    signupErrors.email ? 'border-destructive' : 'border-border'
                  } text-foreground placeholder:text-muted-foreground focus:border-primary transition-all`}
                />
                {signupTouched.email && signupErrors.email && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {signupErrors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="signup-password" className="text-sm font-medium text-foreground">Password</label>
                <div className="relative">
                  <Input
                    id="signup-password"
                    type={showSignupPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    onBlur={() => setSignupTouched({ ...signupTouched, password: true })}
                    disabled={isLoading}
                    className={`bg-background/80 border ${
                      signupErrors.password ? 'border-destructive' : 'border-border'
                    } text-foreground placeholder:text-muted-foreground focus:border-primary transition-all pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    disabled={isLoading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {signupTouched.password && signupErrors.password && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {signupErrors.password}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="signup-confirm-password" className="text-sm font-medium text-foreground">Confirm Password</label>
                <div className="relative">
                  <Input
                    id="signup-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      // Real-time validation
                      if (signupTouched.confirmPassword && e.target.value !== signupPassword) {
                        setSignupErrors({
                          ...signupErrors,
                          confirmPassword: 'Passwords do not match',
                        })
                      } else if (signupTouched.confirmPassword) {
                        const { confirmPassword: _, ...rest } = signupErrors
                        setSignupErrors(rest)
                      }
                    }}
                    onBlur={() => {
                      setSignupTouched({ ...signupTouched, confirmPassword: true })
                      if (confirmPassword !== signupPassword) {
                        setSignupErrors({
                          ...signupErrors,
                          confirmPassword: 'Passwords do not match',
                        })
                      }
                    }}
                    disabled={isLoading}
                    className={`bg-background/80 border ${
                      signupErrors.confirmPassword
                        ? 'border-destructive'
                        : confirmPassword && confirmPassword === signupPassword && signupTouched.confirmPassword
                        ? 'border-green-600'
                        : 'border-border'
                    } text-foreground placeholder:text-muted-foreground focus:border-primary transition-all pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {signupTouched.confirmPassword && signupErrors.confirmPassword && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {signupErrors.confirmPassword}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 mt-6 transition-all duration-300 active:scale-95"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>
          )}

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            Your data is secured with enterprise-grade encryption
          </p>
        </div>
      </Card>
    </div>
  )
}
