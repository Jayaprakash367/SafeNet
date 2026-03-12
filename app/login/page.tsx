'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, AlertCircle, Eye, EyeOff, CheckCircle2, Lock } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Validate inputs
      if (!email || !password) {
        setError('Please enter email and password')
        setIsLoading(false)
        return
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError('Please enter a valid email address')
        setIsLoading(false)
        return
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters')
        setIsLoading(false)
        return
      }

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Store auth status
      localStorage.setItem('safenet-auth', 'true')
      localStorage.setItem('safenet-user', JSON.stringify({ email, role: 'responder' }))

      // Redirect to dashboard
      router.push('/')
    } catch (err) {
      setError('Authentication failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-md relative z-10 shadow-lg animate-in fade-in zoom-in-95 duration-300 border-2 border-primary/20">
        {/* Gradient Header */}
        <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b border-primary/10">
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-2xl shadow-lg transform hover:scale-105 transition-transform">
              <Shield className="w-10 h-10 text-white" style={{textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'}} />
            </div>
          </div>
          <CardTitle className="text-center text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            SafeNet
          </CardTitle>
          <CardDescription className="text-center text-sm font-medium">
            Enterprise Disaster Management System
          </CardDescription>
        </CardHeader>

        {/* Login Form Content */}
        <CardContent className="pt-8">
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="p-4 bg-destructive/10 border-l-4 border-destructive rounded-lg flex items-start gap-3 animate-in slide-in-from-top duration-300">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <span className="text-sm font-medium text-destructive">{error}</span>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground" style={{textShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'}}>Email Address</label>
              <Input
                type="email"
                placeholder="operator@safenet.gov"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="transition-all duration-300 ease-out focus:ring-2 focus:ring-primary border-2 border-border hover:border-primary/50"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">Official government emergency response email</p>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-foreground" style={{textShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'}}>Password</label>
                <Lock className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="relative group">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="transition-all duration-300 ease-out focus:ring-2 focus:ring-primary border-2 border-border hover:border-primary/50 pr-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-all duration-300 ease-out hover:scale-110"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition-all duration-300 ease-out hover:shadow-lg py-6 text-base"
              style={{textShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'}}
              disabled={isLoading}
              size="lg"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Authenticating...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Login to SafeNet
                </>
              )}
            </Button>

            {/* Demo Credentials Box */}
            <div className="p-4 bg-secondary/10 border border-secondary/30 rounded-lg transform hover:shadow-md transition-all duration-300 ease-out">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-secondary" />
                <p className="font-semibold text-secondary" style={{textShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'}}>Demo Credentials</p>
              </div>
              <div className="space-y-2 text-sm text-foreground">
                <p className="flex items-center gap-2">
                  <span className="text-primary">▸</span>
                  <span>Email: <code className="bg-secondary/10 px-2 py-1 rounded text-xs font-mono">demo@safenet.gov</code></span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-primary">▸</span>
                  <span>Password: <code className="bg-secondary/10 px-2 py-1 rounded text-xs font-mono">password123</code></span>
                </p>
              </div>
            </div>

            {/* Trust & Security Features */}
            <div className="pt-4 space-y-3 border-t border-border">
              <h4 className="font-semibold text-foreground text-sm" style={{textShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'}}>Why SafeNet is Trusted</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-3 hover:text-foreground transition-all duration-300 ease-out">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>Real-time emergency coordination</span>
                </li>
                <li className="flex items-center gap-3 hover:text-foreground transition-all duration-300 ease-out">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>Military-grade GPS tracking</span>
                </li>
                <li className="flex items-center gap-3 hover:text-foreground transition-all duration-300 ease-out">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>Multi-team communication hub</span>
                </li>
                <li className="flex items-center gap-3 hover:text-foreground transition-all duration-300 ease-out">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>End-to-end encrypted messages</span>
                </li>
              </ul>
            </div>
          </form>
        </CardContent>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/30 rounded-b-lg text-center">
          <p className="text-xs text-muted-foreground">
            For support: <a href="mailto:support@safenet.gov" className="text-primary hover:underline font-medium transition-all duration-300 ease-out">support@safenet.gov</a>
          </p>
          <p className="text-xs text-muted-foreground mt-2">ISO 27001 Certified • GDPR Compliant • Government Approved</p>
        </div>
      </Card>
    </div>
  )
}
