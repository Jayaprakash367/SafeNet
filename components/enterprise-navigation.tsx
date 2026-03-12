'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Menu, X, Shield, Home, AlertCircle, Map, Users, Settings, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function EnterpriseNavigation() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const navItems = [
    { href: '/', label: 'Dashboard', icon: Home },
    { href: '/alerts', label: 'Active Alerts', icon: AlertCircle },
    { href: '/maps', label: 'Incident Map', icon: Map },
    { href: '/teams', label: 'Response Teams', icon: Users },
    { href: '/settings', label: 'Settings', icon: Settings },
  ]

  const handleLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('userData')
    router.push('/login')
  }

  return (
    <nav className="bg-sidebar text-sidebar-foreground sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 transition-all duration-300 ease-out hover:opacity-80">
            <div className="flex items-center justify-center w-10 h-10 bg-sidebar-primary rounded-lg">
              <Shield className="w-6 h-6 text-sidebar-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{textShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'}}>SafeNet</h1>
              <p className="text-xs text-sidebar-foreground/70">Emergency Response</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-sidebar-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground transition-all duration-300 ease-out"
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-300 ease-out"
            >
              <LogOut className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 hover:bg-sidebar-primary rounded-lg transition-all duration-300 ease-out"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-4 animate-in fade-in slide-in-from-top duration-300">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sidebar-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground transition-all duration-300 ease-out rounded-lg"
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </nav>
  )
}
