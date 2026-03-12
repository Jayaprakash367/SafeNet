'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { EnterpriseNavigation } from '@/components/enterprise-navigation'
import { EnterpriseDashboard } from '@/components/enterprise-dashboard'
import { SOSButton } from '@/components/sos-button'
import { UserProfileHeader } from '@/components/user-profile-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertCircle, MapPin, Smartphone } from 'lucide-react'

export default function SafeNetDashboard() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline'>('online')
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    // Check authentication
    const authStatus = localStorage.getItem('safenet-auth')
    const userData = localStorage.getItem('safenet-user')

    if (authStatus === 'true' && userData) {
      setIsAuthenticated(true)
    } else {
      router.push('/login')
      return
    }

    // Monitor connection status
    const updateConnectionStatus = () => {
      setConnectionStatus(navigator.onLine ? 'online' : 'offline')
    }

    window.addEventListener('online', updateConnectionStatus)
    window.addEventListener('offline', updateConnectionStatus)

    // Request location permission
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        () => {
          console.log('[v0] Location access denied - app will work without location')
        },
        { timeout: 5000, enableHighAccuracy: true }
      )
    }

    setIsLoading(false)

    return () => {
      window.removeEventListener('online', updateConnectionStatus)
      window.removeEventListener('offline', updateConnectionStatus)
    }
  }, [router])

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-fade-scale">
          <Card className="card-shadow">
            <CardContent className="p-8 text-center">
              <div className="animate-pulse text-primary text-4xl mb-4">SafeNet</div>
              <p className="text-muted-foreground">Loading emergency response system...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <EnterpriseNavigation />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8 animate-slide-in">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gradient-disaster bg-clip-text text-transparent mb-2">
                Emergency Response Dashboard
              </h1>
              <p className="text-muted-foreground">
                Real-time disaster management and emergency coordination system
              </p>
            </div>
            <UserProfileHeader />
          </div>

          {/* Status Bar */}
          <div className="flex flex-wrap gap-3 mt-6">
            <Badge
              className={`transition-smooth ${
                connectionStatus === 'online'
                  ? 'bg-green-600 text-white'
                  : 'bg-destructive text-destructive-foreground'
              }`}
            >
              {connectionStatus === 'online' ? '🟢 Online' : '🔴 Offline'}
            </Badge>
            {userLocation && (
              <Badge className="bg-secondary text-secondary-foreground flex items-center gap-2">
                <MapPin className="w-3 h-3" />
                GPS Active
              </Badge>
            )}
            <Badge className="bg-accent text-accent-foreground">System Operational</Badge>
          </div>
        </div>

        {/* SOS Emergency Section */}
        <Card className="mb-8 bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/20 card-shadow animate-slide-in">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-primary">
              <AlertCircle className="w-6 h-6" />
              Emergency SOS System
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">One-Tap Emergency Alert</h3>
                <p className="text-muted-foreground mb-4">
                  Instantly notify rescue teams and emergency services with your GPS location
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span> Automatic location sharing
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span> SMS backup notification
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span> Offline queue support
                  </li>
                </ul>
              </div>
              <div className="flex flex-col items-center gap-4">
                <SOSButton
                  isActive={false}
                  onActivate={() => {
                    console.log('[v0] SOS activated')
                  }}
                  onDeactivate={() => {
                    console.log('[v0] SOS deactivated')
                  }}
                  userLocation={userLocation}
                  connectionStatus={connectionStatus}
                />
                <Button variant="outline" size="sm" className="transition-smooth">
                  <Smartphone className="w-4 h-4 mr-2" />
                  View on Mobile
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dashboard */}
        <EnterpriseDashboard />

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-border text-center text-muted-foreground text-sm animate-slide-in">
          <p>SafeNet Emergency Response System • Built with enterprise-grade reliability</p>
          <p className="mt-2">For emergencies, press the SOS button or call local emergency services</p>
        </footer>
      </main>
    </div>
  )
}
