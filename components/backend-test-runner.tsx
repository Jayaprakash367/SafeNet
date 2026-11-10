'use client'

import { useState } from 'react'
import { AlertCircle, CheckCircle2, Play, XCircle, Loader } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { backendTests, generateTestReport, type TestCategory, type TestReport } from '@/lib/backend-tests'

const categories: { id: TestCategory; label: string }[] = [
  { id: 'all', label: 'All checks' },
  { id: 'auth', label: 'Account' },
  { id: 'sos', label: 'SOS history' },
  { id: 'location', label: 'Location & weather' },
  { id: 'offline', label: 'Offline behavior' },
  { id: 'security', label: 'Security' },
]

export function BackendTestRunner() {
  const [isRunning, setIsRunning] = useState(false)
  const [testResults, setTestResults] = useState<TestReport | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<TestCategory>('all')
  const [runError, setRunError] = useState('')

  const handleRunTests = async () => {
    setIsRunning(true)
    setRunError('')
    setTestResults(null)

    try {
      const results = selectedCategory === 'all'
        ? await backendTests.runAllTests()
        : selectedCategory === 'auth'
          ? await backendTests.runAuthenticationTests()
          : selectedCategory === 'sos'
            ? await backendTests.runSOSTests()
            : selectedCategory === 'location'
              ? await backendTests.runLocationTests()
              : selectedCategory === 'offline'
                ? await backendTests.runOfflineQueueTests()
                : await backendTests.runSecurityTests()
      setTestResults(generateTestReport(results))
    } catch {
      setRunError('Backend checks could not be completed. Check your connection and try again.')
    } finally {
      setIsRunning(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS': return <CheckCircle2 aria-hidden="true" className="size-5 text-primary" />
      case 'FAIL': return <XCircle aria-hidden="true" className="size-5 text-destructive" />
      case 'WARN': return <AlertCircle aria-hidden="true" className="size-5 text-muted-foreground" />
      default: return null
    }
  }

  return (
    <Card>
      <CardHeader className="border-b border-border bg-gradient-to-r from-secondary/5 to-primary/5">
        <CardTitle className="flex items-center gap-2">
          <Play aria-hidden="true" className="size-5 text-secondary" />
          Backend connection checks
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 pt-6">
        <p className="text-sm text-muted-foreground">
          Checks are read-only. They never create SOS alerts, send SMS, access GPS, or write browser storage.
        </p>

        <div className="flex max-w-sm flex-col gap-2">
          <Label htmlFor="backend-check-category">Test category</Label>
          <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as TestCategory)}>
            <SelectTrigger id="backend-check-category">
              <SelectValue placeholder="Choose checks" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>{category.label}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleRunTests} disabled={isRunning}>
          {isRunning ? <Loader aria-hidden="true" className="animate-spin" data-icon="inline-start" /> : <Play aria-hidden="true" data-icon="inline-start" />}
          {isRunning ? 'Checking backend…' : 'Run checks'}
        </Button>

        {runError && (
          <Alert role="alert" className="border-destructive/30 bg-destructive/10">
            <AlertDescription>{runError}</AlertDescription>
          </Alert>
        )}

        {testResults && (
          <div className="flex flex-col gap-4" aria-live="polite">
            <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/50 p-4 text-center sm:grid-cols-4">
              <div><p className="text-2xl font-bold text-primary">{testResults.summary.passed}</p><p className="text-xs text-muted-foreground">Passed</p></div>
              <div><p className="text-2xl font-bold text-destructive">{testResults.summary.failed}</p><p className="text-xs text-muted-foreground">Failed</p></div>
              <div><p className="text-2xl font-bold text-muted-foreground">{testResults.summary.warnings}</p><p className="text-xs text-muted-foreground">Warnings</p></div>
              <div><p className="text-2xl font-bold">{testResults.summary.successRate}</p><p className="text-xs text-muted-foreground">Pass rate</p></div>
            </div>

            <div className="flex max-h-96 flex-col gap-2 overflow-y-auto">
              {testResults.results.map((result, index) => (
                <div key={`${result.name}-${index}`} className="flex items-start gap-3 rounded-lg border border-border p-3">
                  <div className="mt-0.5 shrink-0">{getStatusIcon(result.status)}</div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{result.name}</span>
                      <Badge variant={result.status === 'PASS' ? 'secondary' : result.status === 'FAIL' ? 'destructive' : 'outline'}>{result.status}</Badge>
                    </div>
                    <p className="break-words text-sm text-muted-foreground">{result.message}</p>
                    <time className="text-xs text-muted-foreground" dateTime={result.timestamp}>{new Date(result.timestamp).toLocaleTimeString()}</time>
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              onClick={() => {
                const blob = new Blob([JSON.stringify(testResults, null, 2)], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const anchor = document.createElement('a')
                anchor.href = url
                anchor.download = `safenet-backend-checks-${new Date().toISOString().slice(0, 10)}.json`
                anchor.click()
                URL.revokeObjectURL(url)
              }}
            >
              Export report
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
