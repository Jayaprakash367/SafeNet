'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { AlertCircle, Eye, EyeOff, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'

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

      setSuccess('Login successful! Redirecting...')
      setTimeout(() => router.push('/'), 1500)
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

      setSuccess('Account created successfully! Redirecting...')
      setTimeout(() => router.push('/'), 1500)
    } catch (err) {
      console.error('[v0] Signup error:', err)
      setError('Network error. Please check your connection.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-950 flex items-center justify-center px-4 py-12">
      {/* Subtle background animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-secondary/10 rounded-full blur-3xl opacity-50"></div>
      </div>

      {/* Auth Card */}
      <Card className="w-full max-w-md relative z-10 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 shadow-2xl">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-3xl font-bold text-white mb-2">SafeNet</h1>
            <p className="text-slate-400 text-sm">Emergency Response Platform</p>
          </div>

          {/* Mode Tabs */}
          <div className="flex gap-2 mb-8 bg-slate-900/50 p-1 rounded-lg">
            <button
              onClick={() => {
                setMode('login')
                setError('')
                setSuccess('')
              }}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all duration-200 ${
                mode === 'login'
                  ? 'bg-primary text-white'
                  : 'text-slate-400 hover:text-slate-300'
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
                  ? 'bg-primary text-white'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg flex gap-3 items-start animate-slide-in-left">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-900/20 border border-green-500/50 rounded-lg flex gap-3 items-start animate-slide-in-left">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-green-400 text-sm">{success}</p>
            </div>
          )}

          {/* Login Form */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4 animate-fade-in">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Email Address</label>
                <Input
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
                  className={`bg-slate-900/50 border ${
                    loginErrors.email ? 'border-red-500' : 'border-slate-700'
                  } text-white placeholder-slate-500 focus:border-primary transition-all`}
                />
                {loginTouched.email && loginErrors.email && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {loginErrors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Password</label>
                <div className="relative">
                  <Input
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
                    className={`bg-slate-900/50 border ${
                      loginErrors.password ? 'border-red-500' : 'border-slate-700'
                    } text-white placeholder-slate-500 focus:border-primary transition-all pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    disabled={isLoading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {loginTouched.password && loginErrors.password && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {loginErrors.password}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-2 mt-6 transition-all duration-300 active:scale-95"
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
                <label className="text-sm font-medium text-slate-300">Full Name</label>
                <Input
                  type="text"
                  placeholder="John Doe"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  onBlur={() => setSignupTouched({ ...signupTouched, name: true })}
                  disabled={isLoading}
                  className={`bg-slate-900/50 border ${
                    signupErrors.name ? 'border-red-500' : 'border-slate-700'
                  } text-white placeholder-slate-500 focus:border-primary transition-all`}
                />
                {signupTouched.name && signupErrors.name && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {signupErrors.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Email Address</label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  onBlur={() => setSignupTouched({ ...signupTouched, email: true })}
                  disabled={isLoading}
                  className={`bg-slate-900/50 border ${
                    signupErrors.email ? 'border-red-500' : 'border-slate-700'
                  } text-white placeholder-slate-500 focus:border-primary transition-all`}
                />
                {signupTouched.email && signupErrors.email && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {signupErrors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Password</label>
                <div className="relative">
                  <Input
                    type={showSignupPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    onBlur={() => setSignupTouched({ ...signupTouched, password: true })}
                    disabled={isLoading}
                    className={`bg-slate-900/50 border ${
                      signupErrors.password ? 'border-red-500' : 'border-slate-700'
                    } text-white placeholder-slate-500 focus:border-primary transition-all pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    disabled={isLoading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {signupTouched.password && signupErrors.password && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {signupErrors.password}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Confirm Password</label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onBlur={() => setSignupTouched({ ...signupTouched, confirmPassword: true })}
                    disabled={isLoading}
                    className={`bg-slate-900/50 border ${
                      signupErrors.confirmPassword ? 'border-red-500' : 'border-slate-700'
                    } text-white placeholder-slate-500 focus:border-primary transition-all pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {signupTouched.confirmPassword && signupErrors.confirmPassword && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {signupErrors.confirmPassword}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-2 mt-6 transition-all duration-300 active:scale-95"
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
          <p className="text-center text-xs text-slate-500 mt-6">
            Your data is secured with enterprise-grade encryption
          </p>
        </div>
      </Card>
    </div>
  )
}
