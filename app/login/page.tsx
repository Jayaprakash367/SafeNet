'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, AlertCircle, Eye, EyeOff, CheckCircle2, Lock, Mail, User, Phone } from 'lucide-react'

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
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [emergencyContact, setEmergencyContact] = useState('')
  const [showSignupPassword, setShowSignupPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [signupErrors, setSignupErrors] = useState<Record<string, string>>({})
  const [signupTouched, setSignupTouched] = useState<Record<string, boolean>>({})

  // Validate login fields on blur
  const validateLoginField = (field: string, value: string) => {
    const newErrors = { ...loginErrors }
    
    if (field === 'email') {
      if (!value) {
        newErrors.email = 'Email is required'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        newErrors.email = 'Please enter a valid email address'
      } else {
        delete newErrors.email
      }
    } else if (field === 'password') {
      if (!value) {
        newErrors.password = 'Password is required'
      } else if (value.length < 6) {
        newErrors.password = 'Password must be at least 6 characters'
      } else {
        delete newErrors.password
      }
    }
    
    setLoginErrors(newErrors)
  }

  // Validate signup fields on blur
  const validateSignupField = (field: string, value: string) => {
    const newErrors = { ...signupErrors }
    
    if (field === 'name') {
      if (!value) {
        newErrors.name = 'Name is required'
      } else if (value.trim().length < 2) {
        newErrors.name = 'Name must be at least 2 characters'
      } else {
        delete newErrors.name
      }
    } else if (field === 'email') {
      if (!value) {
        newErrors.email = 'Email is required'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        newErrors.email = 'Please enter a valid email address'
      } else {
        delete newErrors.email
      }
    } else if (field === 'password') {
      if (!value) {
        newErrors.password = 'Password is required'
      } else if (value.length < 6) {
        newErrors.password = 'Password must be at least 6 characters'
      } else {
        delete newErrors.password
      }
    } else if (field === 'confirmPassword') {
      if (!value) {
        newErrors.confirmPassword = 'Please confirm your password'
      } else if (value !== signupPassword) {
        newErrors.confirmPassword = 'Passwords do not match'
      } else {
        delete newErrors.confirmPassword
      }
    }
    
    setSignupErrors(newErrors)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    // Validate all fields before submission
    validateLoginField('email', loginEmail)
    validateLoginField('password', loginPassword)
    
    if (Object.keys(loginErrors).length > 0) {
      setError('Please fix the errors above')
      return
    }
    
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login-supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setLoginErrors(data.errors || {})
        setError(data.message || 'Login failed')
        return
      }

      setSuccess('Login successful! Redirecting...')
      setTimeout(() => router.push('/'), 1500)
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    // Validate all fields before submission
    validateSignupField('name', name)
    validateSignupField('email', signupEmail)
    validateSignupField('password', signupPassword)
    validateSignupField('confirmPassword', confirmPassword)
    
    const newErrors = { ...signupErrors }
    if (!name) newErrors.name = 'Name is required'
    if (!signupEmail) newErrors.email = 'Email is required'
    if (!signupPassword) newErrors.password = 'Password is required'
    if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your password'
    
    if (Object.keys(newErrors).length > 0) {
      setSignupErrors(newErrors)
      setError('Please fix the errors above')
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
          confirmPassword,
          name: name.trim(),
          emergencyContacts: emergencyContact ? [emergencyContact] : [],
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setSignupErrors(data.errors || {})
        setError(data.message || 'Signup failed')
        return
      }

      setSuccess('Account created successfully! Redirecting...')
      setTimeout(() => router.push('/'), 1500)
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-950 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Top-left gradient blob */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse opacity-50"></div>
        {/* Bottom-right gradient blob */}
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse opacity-50 animation-delay-2000"></div>
        {/* Center accent blob */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent/5 rounded-full blur-3xl opacity-30"></div>
      </div>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Auth Card */}
      <Card className="w-full max-w-2xl relative z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-300 border-2 border-primary/20 overflow-hidden">
        <div className="flex">
          {/* Left Column - Branding & Features */}
          <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-secondary p-12 flex-col justify-between text-white">
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="flex items-center justify-center w-14 h-14 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold">SafeNet</h1>
              </div>
              <p className="text-lg font-light mb-8 opacity-90">Enterprise Disaster Management & Emergency Response System</p>
            </div>

            <div className="space-y-6">
              <div className="flex gap-4">
                <CheckCircle2 className="w-6 h-6 flex-shrink-0 text-accent" />
                <div>
                  <h3 className="font-semibold mb-1">Real-time Coordination</h3>
                  <p className="text-sm opacity-80">Instant emergency response coordination</p>
                </div>
              </div>
              <div className="flex gap-4">
                <CheckCircle2 className="w-6 h-6 flex-shrink-0 text-accent" />
                <div>
                  <h3 className="font-semibold mb-1">GPS Tracking</h3>
                  <p className="text-sm opacity-80">Military-grade location tracking</p>
                </div>
              </div>
              <div className="flex gap-4">
                <CheckCircle2 className="w-6 h-6 flex-shrink-0 text-accent" />
                <div>
                  <h3 className="font-semibold mb-1">Secure Communication</h3>
                  <p className="text-sm opacity-80">End-to-end encrypted messaging</p>
                </div>
              </div>
            </div>

            <div className="text-sm opacity-75 border-t border-white/20 pt-6">
              <p>ISO 27001 Certified • GDPR Compliant • Government Approved</p>
            </div>
          </div>

          {/* Right Column - Auth Form */}
          <div className="w-full lg:w-1/2 p-8 lg:p-12">
            {/* Tab Switch */}
            <div className="flex gap-2 mb-8 border-b border-border">
              <button
                onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                className={`pb-3 px-4 font-semibold transition-all ${
                  mode === 'login'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}
                className={`pb-3 px-4 font-semibold transition-all ${
                  mode === 'signup'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Messages */}
            {error && (
              <div className="p-4 mb-6 bg-destructive/10 border-l-4 border-destructive rounded-lg flex items-start gap-3 animate-in slide-in-from-top duration-300">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <span className="text-sm font-medium text-destructive">{error}</span>
              </div>
            )}

            {success && (
              <div className="p-4 mb-6 bg-green-50 border-l-4 border-green-600 rounded-lg flex items-start gap-3 animate-in slide-in-from-top duration-300">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm font-medium text-green-700">{success}</span>
              </div>
            )}

            {/* Login Form */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="operator@safenet.gov"
                    value={loginEmail}
                    onChange={(e) => {
                      setLoginEmail(e.target.value)
                      if (loginTouched.email) validateLoginField('email', e.target.value)
                    }}
                    onBlur={() => {
                      setLoginTouched({ ...loginTouched, email: true })
                      validateLoginField('email', loginEmail)
                    }}
                    className={`transition-all duration-300 ease-out focus:ring-2 border-2 hover:border-primary/50 animate-fade-in ${
                      loginErrors.email
                        ? 'border-destructive focus:ring-destructive'
                        : 'border-border focus:ring-primary focus:border-primary'
                    }`}
                    disabled={isLoading}
                  />
                  {loginTouched.email && loginErrors.email && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {loginErrors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Lock className="w-4 h-4 text-primary" />
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showLoginPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value)
                        if (loginTouched.password) validateLoginField('password', e.target.value)
                      }}
                      onBlur={() => {
                        setLoginTouched({ ...loginTouched, password: true })
                        validateLoginField('password', loginPassword)
                      }}
                      className={`transition-all duration-300 ease-out focus:ring-2 border-2 hover:border-primary/50 pr-10 ${
                        loginErrors.password
                          ? 'border-destructive focus:ring-destructive'
                          : 'border-border focus:ring-primary focus:border-primary'
                      }`}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-all duration-300 ease-out"
                      disabled={isLoading}
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
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 text-base transition-all duration-300 ease-out hover:shadow-lg"
                  disabled={isLoading}
                >
                  {isLoading ? 'Authenticating...' : 'Login to SafeNet'}
                </Button>

                <div className="p-4 bg-secondary/10 border border-secondary/30 rounded-lg">
                  <p className="text-xs font-semibold text-secondary mb-2">Demo Credentials</p>
                  <p className="text-xs text-foreground">Email: demo@safenet.gov</p>
                  <p className="text-xs text-foreground">Password: password123</p>
                </div>
              </form>
            )}

            {/* Signup Form */}
            {mode === 'signup' && (
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    Full Name
                  </label>
                  <Input
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      if (signupTouched.name) validateSignupField('name', e.target.value)
                    }}
                    onBlur={() => {
                      setSignupTouched({ ...signupTouched, name: true })
                      validateSignupField('name', name)
                    }}
                    className={`transition-all duration-300 ease-out focus:ring-2 border-2 hover:border-primary/50 ${
                      signupErrors.name
                        ? 'border-destructive focus:ring-destructive'
                        : 'border-border focus:ring-primary focus:border-primary'
                    }`}
                    disabled={isLoading}
                  />
                  {signupTouched.name && signupErrors.name && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {signupErrors.name}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="your.email@safenet.gov"
                    value={signupEmail}
                    onChange={(e) => {
                      setSignupEmail(e.target.value)
                      if (signupTouched.email) validateSignupField('email', e.target.value)
                    }}
                    onBlur={() => {
                      setSignupTouched({ ...signupTouched, email: true })
                      validateSignupField('email', signupEmail)
                    }}
                    className={`transition-all duration-300 ease-out focus:ring-2 border-2 hover:border-primary/50 ${
                      signupErrors.email
                        ? 'border-destructive focus:ring-destructive'
                        : 'border-border focus:ring-primary focus:border-primary'
                    }`}
                    disabled={isLoading}
                  />
                  {signupTouched.email && signupErrors.email && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {signupErrors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Lock className="w-4 h-4 text-primary" />
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showSignupPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={signupPassword}
                      onChange={(e) => {
                        setSignupPassword(e.target.value)
                        if (signupTouched.password) validateSignupField('password', e.target.value)
                      }}
                      onBlur={() => {
                        setSignupTouched({ ...signupTouched, password: true })
                        validateSignupField('password', signupPassword)
                      }}
                      className={`transition-all duration-300 ease-out focus:ring-2 border-2 hover:border-primary/50 pr-10 ${
                        signupErrors.password
                          ? 'border-destructive focus:ring-destructive'
                          : 'border-border focus:ring-primary focus:border-primary'
                      }`}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-all"
                      disabled={isLoading}
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
                  {!signupErrors.password && (
                    <p className="text-xs text-muted-foreground">At least 6 characters</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Lock className="w-4 h-4 text-primary" />
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value)
                        if (signupTouched.confirmPassword) validateSignupField('confirmPassword', e.target.value)
                      }}
                      onBlur={() => {
                        setSignupTouched({ ...signupTouched, confirmPassword: true })
                        validateSignupField('confirmPassword', confirmPassword)
                      }}
                      className={`transition-all duration-300 ease-out focus:ring-2 border-2 hover:border-primary/50 pr-10 ${
                        signupErrors.confirmPassword
                          ? 'border-destructive focus:ring-destructive'
                          : 'border-border focus:ring-primary focus:border-primary'
                      }`}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-all"
                      disabled={isLoading}
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

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Phone className="w-4 h-4 text-primary" />
                    Emergency Contact (Optional)
                  </label>
                  <Input
                    type="tel"
                    placeholder="+91-xxxxxxxxxx"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    className="transition-all duration-300 ease-out focus:ring-2 focus:ring-primary border-2 border-border hover:border-primary/50"
                    disabled={isLoading}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 text-base transition-all duration-300 ease-out hover:shadow-lg"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  By signing up, you agree to our Terms of Service and Privacy Policy
                </p>
              </form>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
