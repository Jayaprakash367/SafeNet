'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle2, Clock, Users, MapPin, Activity } from 'lucide-react'

export function EnterpriseDashboard() {
  const stats = [
    { label: 'Active Alerts', value: '12', icon: AlertCircle, color: 'text-primary' },
    { label: 'Resolved Today', value: '45', icon: CheckCircle2, color: 'text-green-600' },
    { label: 'Response Time', value: '2.3m', icon: Clock, color: 'text-accent' },
    { label: 'Teams Active', value: '8', icon: Users, color: 'text-secondary' },
  ]

  const recentAlerts = [
    { id: '001', type: 'Earthquake', location: 'Delhi, India', time: '2 mins ago', severity: 'Critical' },
    { id: '002', type: 'Flood', location: 'Mumbai, India', time: '15 mins ago', severity: 'High' },
    { id: '003', type: 'Landslide', location: 'Himachal Pradesh', time: '1 hour ago', severity: 'Medium' },
  ]

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="shadow-md transition-all duration-300 ease-out hover:shadow-lg hover:-translate-y-0.5">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">Real-time monitoring</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Alerts */}
        <Card className="lg:col-span-2 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="text-primary" />
              Active Emergency Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-accent/10 transition-all duration-300 ease-out"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground">{alert.type}</span>
                      <Badge
                        className={
                          alert.severity === 'Critical'
                            ? 'bg-primary text-primary-foreground'
                            : alert.severity === 'High'
                              ? 'bg-accent text-accent-foreground'
                              : 'bg-yellow-600 text-white'
                        }
                      >
                        {alert.severity}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      {alert.location}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{alert.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Status */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="text-green-600" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">API Services</span>
                <Badge className="bg-green-600 text-white">Operational</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">GPS Tracking</span>
                <Badge className="bg-green-600 text-white">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">SMS Gateway</span>
                <Badge className="bg-green-600 text-white">Connected</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Data Sync</span>
                <Badge className="bg-green-600 text-white">Synced</Badge>
              </div>
            </div>
            <div className="mt-6 p-3 bg-green-600/10 border border-green-600/20 rounded-lg">
              <p className="text-xs font-semibold text-green-700 dark:text-green-400">
                All systems operational. Last check 2 mins ago.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
