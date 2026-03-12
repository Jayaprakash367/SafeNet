'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { backendTests, generateTestReport } from '@/lib/backend-tests'
import { Play, CheckCircle2, AlertCircle, XCircle, Loader } from 'lucide-react'

export function BackendTestRunner() {
  const [isRunning, setIsRunning] = useState(false)
  const [testResults, setTestResults] = useState<any>(null)
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'auth' | 'sos' | 'location' | 'offline' | 'security'>('all')

  const handleRunTests = async () => {
    setIsRunning(true)
    setTestResults(null)

    try {
      let results

      switch (selectedCategory) {
        case 'auth':
          results = await backendTests.runAuthenticationTests()
          break
        case 'sos':
          results = await backendTests.runSOSTests()
          break
        case 'location':
          results = await backendTests.runLocationTests()
          break
        case 'offline':
          results = await backendTests.runOfflineQueueTests()
          break
        case 'security':
          results = await backendTests.runSecurityTests()
          break
        default:
          results = await backendTests.runAllTests()
      }

      const report = generateTestReport(results)
      setTestResults(report)
    } catch (error) {
      console.error('Test execution failed:', error)
    } finally {
      setIsRunning(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />
      case 'FAIL':
        return <XCircle className="w-5 h-5 text-destructive" />
      case 'WARN':
        return <AlertCircle className="w-5 h-5 text-accent" />
      default:
        return null
    }
  }

  return (
    <Card className="shadow-md">
      <CardHeader className="bg-gradient-to-r from-secondary/5 to-primary/5 border-b border-border">
        <CardTitle className="flex items-center gap-2">
          <Play className="w-5 h-5 text-secondary" />
          Backend Test Suite
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Test Category Selection */}
          <div className="space-y-3">
            <label className="text-sm font-semibold">Test Category</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                { id: 'all', label: 'All Tests' },
                { id: 'auth', label: 'Authentication' },
                { id: 'sos', label: 'SOS System' },
                { id: 'location', label: 'Location' },
                { id: 'offline', label: 'Offline Queue' },
                { id: 'security', label: 'Security' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id as any)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ease-out ${
                    selectedCategory === cat.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80 text-foreground'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Run Tests Button */}
          <Button
            onClick={handleRunTests}
            disabled={isRunning}
            className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold py-6"
            size="lg"
          >
            {isRunning ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Run Tests
              </>
            )}
          </Button>

          {/* Test Results */}
          {testResults && (
            <div className="space-y-4 animate-in slide-in-from-bottom duration-300">
              {/* Summary */}
              <div className="p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-secondary">{testResults.summary.passed}</p>
                    <p className="text-xs text-muted-foreground">Passed</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-destructive">{testResults.summary.failed}</p>
                    <p className="text-xs text-muted-foreground">Failed</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-accent">{testResults.summary.warnings}</p>
                    <p className="text-xs text-muted-foreground">Warnings</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">{testResults.summary.successRate}</p>
                    <p className="text-xs text-muted-foreground">Success</p>
                  </div>
                </div>
              </div>

              {/* Detailed Results */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {testResults.results.map((result: any, index: number) => (
                  <div
                    key={index}
                    className="p-3 border border-border rounded-lg hover:bg-muted/50 transition-all duration-300 ease-out flex items-start gap-3"
                  >
                    <div className="flex-shrink-0 mt-1">{getStatusIcon(result.status)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-foreground">{result.name}</span>
                        <Badge
                          className={
                            result.status === 'PASS'
                              ? 'bg-green-600/10 text-green-700'
                              : result.status === 'FAIL'
                                ? 'bg-destructive/10 text-destructive'
                                : 'bg-accent/10 text-accent'
                          }
                        >
                          {result.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground break-words">{result.message}</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">{result.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Export Button */}
              <Button
                onClick={() => {
                  const blob = new Blob([JSON.stringify(testResults, null, 2)], {
                    type: 'application/json',
                  })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `safenet-test-report-${new Date().toISOString().split('T')[0]}.json`
                  a.click()
                }}
                variant="outline"
                className="w-full"
              >
                Export Report
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
