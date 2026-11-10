'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Brain, LoaderCircle } from 'lucide-react'
import type { EmergencyAnalysis } from '@/lib/emergency-analysis'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface AIEmergencyClassifierProps {
  emergencyType: string
}

interface ClassificationResponse {
  analysis?: EmergencyAnalysis
  error?: string
}

export function AIEmergencyClassifier({ emergencyType }: AIEmergencyClassifierProps) {
  const [analysis, setAnalysis] = useState<EmergencyAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setAnalysis(null)
    setError('')
  }, [emergencyType])

  const analyzeScenario = async () => {
    if (!emergencyType || isAnalyzing) return

    setIsAnalyzing(true)
    setError('')
    setAnalysis(null)

    try {
      const response = await fetch('/api/emergency-classifier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: emergencyType }),
      })
      const result = (await response.json()) as ClassificationResponse
      if (!response.ok || !result.analysis) {
        throw new Error(result.error ?? 'Emergency analysis could not be completed.')
      }
      setAnalysis(result.analysis)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Emergency analysis could not be completed.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const urgencyVariant = analysis?.urgency === 'critical'
    ? 'destructive'
    : analysis?.urgency === 'high'
      ? 'secondary'
      : 'outline'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Brain aria-hidden="true" className="size-5 text-primary" />
          <CardTitle>Emergency Scenario Analysis</CardTitle>
        </div>
        <CardDescription>
          Server-side AI classification for the selected scenario. It never triggers SOS, sends messages, or contacts responders.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {!emergencyType && <p className="text-sm text-muted-foreground">Choose a scenario to analyze.</p>}
        {error && (
          <Alert role="alert" className="border-destructive/30 bg-destructive/10">
            <AlertTriangle aria-hidden="true" className="size-4 text-destructive" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button onClick={analyzeScenario} disabled={!emergencyType || isAnalyzing}>
          {isAnalyzing ? <LoaderCircle aria-hidden="true" className="animate-spin" data-icon="inline-start" /> : <Brain aria-hidden="true" data-icon="inline-start" />}
          {isAnalyzing ? 'Analyzing scenario…' : analysis ? 'Analyze again' : 'Analyze scenario'}
        </Button>
        {analysis && (
          <div className="flex flex-col gap-4 rounded-lg border border-border bg-muted/50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold capitalize">{analysis.classification.replaceAll('_', ' ')}</span>
              <Badge variant={urgencyVariant}>{analysis.urgency} · demo classification</Badge>
            </div>
            <p className="text-sm leading-relaxed">{analysis.summary}</p>
            {analysis.factors.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold">Factors the model identified</h3>
                <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-muted-foreground">
                  {analysis.factors.map((factor, index) => <li key={`${index}-${factor}`}>{factor}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
        <Alert role="note" className="border-primary/20 bg-primary/5">
          <AlertDescription>
            AI output can be incomplete or wrong. For immediate danger, contact local emergency services directly; SafeNet does not dispatch responders.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
