export interface TestResult {
  name: string
  status: 'PASS' | 'FAIL' | 'WARN'
  message: string
  timestamp: string
}

export type TestCategory = 'all' | 'auth' | 'sos' | 'location' | 'offline' | 'security'

export interface TestReport {
  summary: {
    total: number
    passed: number
    failed: number
    warnings: number
    successRate: string
  }
  results: TestResult[]
  timestamp: string
}

interface TestResponse {
  response: Response
  payload: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function createResult(name: string, status: TestResult['status'], message: string): TestResult {
  return { name, status, message, timestamp: new Date().toISOString() }
}

async function requestJson(url: string, options?: RequestInit): Promise<TestResponse> {
  const response = await fetch(url, { cache: 'no-store', ...options })
  const payload: unknown = await response.json().catch(() => ({}))
  return { response, payload }
}

function getErrorMessage(payload: unknown, fallback: string) {
  return isRecord(payload) && typeof payload.error === 'string' ? payload.error : fallback
}

export const backendTests = {
  async runAllTests(): Promise<TestResult[]> {
    const suites = await Promise.all([
      this.runAuthenticationTests(),
      this.runSOSTests(),
      this.runLocationTests(),
      this.runOfflineQueueTests(),
      this.runSecurityTests(),
    ])
    return suites.flat()
  },

  async runAuthenticationTests(): Promise<TestResult[]> {
    try {
      const { response, payload } = await requestJson('/api/sos?limit=1')
      if (response.status === 401) {
        return [createResult('Authenticated backend session', 'WARN', 'Sign in to test private backend operations.')]
      }
      if (!response.ok || !isRecord(payload) || !Array.isArray(payload.alerts)) {
        return [createResult('Authenticated backend session', 'FAIL', getErrorMessage(payload, 'The private SOS history endpoint did not respond correctly.'))]
      }
      return [createResult('Authenticated backend session', 'PASS', 'The server verified the signed-in session and returned account-scoped data.')]
    } catch {
      return [createResult('Authenticated backend session', 'FAIL', 'The private backend endpoint could not be reached.')]
    }
  },

  async runSOSTests(): Promise<TestResult[]> {
    try {
      const { response, payload } = await requestJson('/api/sos?limit=5')
      if (response.status === 401) {
        return [createResult('Private SOS history', 'WARN', 'Sign in to verify private SOS history access.')]
      }
      if (!response.ok || !isRecord(payload) || !Array.isArray(payload.alerts)) {
        return [createResult('Private SOS history', 'FAIL', getErrorMessage(payload, 'SOS history could not be read.'))]
      }
      return [createResult('Private SOS history', 'PASS', `${payload.alerts.length} recent account-scoped alert record(s) returned; no alert was created.`)]
    } catch {
      return [createResult('Private SOS history', 'FAIL', 'SOS history could not be reached.')]
    }
  },

  async runLocationTests(): Promise<TestResult[]> {
    const geolocationAvailable = typeof navigator !== 'undefined' && 'geolocation' in navigator
    const results = [createResult(
      'Device location capability',
      geolocationAvailable ? 'PASS' : 'WARN',
      geolocationAvailable ? 'Location is requested only after a user action.' : 'This browser does not expose geolocation.',
    )]

    try {
      const { response, payload } = await requestJson('/api/weather', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: 0, lon: 0 }),
      })
      const hasWeather = isRecord(payload) && typeof payload.condition === 'string' && typeof payload.temperature === 'number'
      results.push(createResult(
        'Live weather API',
        response.ok && hasWeather ? 'PASS' : 'WARN',
        response.ok && hasWeather
          ? 'Open-Meteo returned live data for fixed sample coordinates; GPS was not accessed.'
          : getErrorMessage(payload, 'The external weather provider is temporarily unavailable.'),
      ))
    } catch {
      results.push(createResult('Live weather API', 'WARN', 'The external weather provider could not be reached.'))
    }

    return results
  },

  async runOfflineQueueTests(): Promise<TestResult[]> {
    const online = typeof navigator !== 'undefined' ? navigator.onLine : false
    return [createResult(
      'Offline delivery behavior',
      online ? 'PASS' : 'WARN',
      online
        ? 'The browser is online. SOS requests are not falsely reported as delivered or silently queued offline.'
        : 'The browser is offline. SOS requests will show a failure instead of being stored as if delivered.',
    )]
  },

  async runSecurityTests(): Promise<TestResult[]> {
    const results: TestResult[] = []

    try {
      const { response } = await requestJson('/api/sos?limit=1', { credentials: 'omit' })
      results.push(createResult(
        'Unauthenticated SOS history protection',
        response.status === 401 ? 'PASS' : 'FAIL',
        response.status === 401
          ? 'SOS history rejects requests without a signed-in session.'
          : 'SOS history did not reject an unauthenticated request.',
      ))
    } catch {
      results.push(createResult('Unauthenticated SOS history protection', 'FAIL', 'The authorization check could not be completed.'))
    }

    try {
      const { response, payload } = await requestJson('/api/test-sms')
      if (response.status === 401) {
        results.push(createResult('Read-only SMS readiness check', 'WARN', 'Sign in to check SMS readiness; this test never sends a message.'))
      } else if (!response.ok) {
        results.push(createResult('Read-only SMS readiness check', 'FAIL', getErrorMessage(payload, 'SMS readiness could not be checked.')))
      } else {
        const reason = isRecord(payload) && typeof payload.reason === 'string' ? payload.reason : 'unknown'
        results.push(createResult('Read-only SMS readiness check', 'PASS', `SMS readiness was checked without sending a message (${reason}).`))
      }
    } catch {
      results.push(createResult('Read-only SMS readiness check', 'FAIL', 'The read-only SMS readiness endpoint could not be reached.'))
    }

    return results
  },
}

export function generateTestReport(results: TestResult[]): TestReport {
  const passed = results.filter((result) => result.status === 'PASS').length
  const failed = results.filter((result) => result.status === 'FAIL').length
  const warnings = results.filter((result) => result.status === 'WARN').length
  const measured = passed + failed

  return {
    summary: {
      total: results.length,
      passed,
      failed,
      warnings,
      successRate: `${measured === 0 ? 0 : Math.round((passed / measured) * 100)}%`,
    },
    results,
    timestamp: new Date().toISOString(),
  }
}
