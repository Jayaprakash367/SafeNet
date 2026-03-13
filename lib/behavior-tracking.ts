import { supabase } from './supabase-auth'

export interface UserActivity {
  userId: string
  eventType: string
  action: string
  description?: string
  metadata?: Record<string, any>
  timestamp?: string
}

export interface UserEngagement {
  userId: string
  lastSosActivated?: string
  sosCount: number
  lastLocationUpdate?: string
  emergencyContactsUpdated?: string
  communicationsSent: number
  averageResponseTime?: number
}

/**
 * Track user activity
 */
export async function trackUserActivity(activity: UserActivity): Promise<boolean> {
  try {
    const { error } = await supabase.from('user_activities').insert([
      {
        user_id: activity.userId,
        event_type: activity.eventType,
        action: activity.action,
        description: activity.description,
        metadata: activity.metadata,
        timestamp: activity.timestamp || new Date().toISOString(),
      },
    ])

    if (error) {
      console.error('[v0] Activity tracking error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('[v0] Error tracking activity:', error)
    return false
  }
}

/**
 * Get user engagement metrics
 */
export async function getUserEngagement(userId: string): Promise<UserEngagement | null> {
  try {
    const { data: engagement, error } = await supabase
      .from('user_engagement_metrics')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('[v0] Error fetching engagement metrics:', error)
      return null
    }

    return {
      userId: engagement.user_id,
      lastSosActivated: engagement.last_sos_activated,
      sosCount: engagement.sos_count,
      lastLocationUpdate: engagement.last_location_update,
      emergencyContactsUpdated: engagement.emergency_contacts_updated,
      communicationsSent: engagement.communications_sent,
      averageResponseTime: engagement.average_response_time,
    }
  } catch (error) {
    console.error('[v0] Error getting engagement metrics:', error)
    return null
  }
}

/**
 * Update user engagement
 */
export async function updateUserEngagement(
  userId: string,
  updates: Partial<UserEngagement>,
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_engagement_metrics')
      .update({
        last_sos_activated: updates.lastSosActivated,
        sos_count: updates.sosCount,
        last_location_update: updates.lastLocationUpdate,
        emergency_contacts_updated: updates.emergencyContactsUpdated,
        communications_sent: updates.communicationsSent,
        average_response_time: updates.averageResponseTime,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)

    if (error) {
      console.error('[v0] Error updating engagement:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('[v0] Error updating engagement metrics:', error)
    return false
  }
}

/**
 * Log form submission (useful for behavior tracking)
 */
export async function logFormSubmission(
  userId: string,
  formType: string,
  formData: Record<string, any>,
  status: 'success' | 'error' | 'pending',
): Promise<boolean> {
  return trackUserActivity({
    userId,
    eventType: 'form_submission',
    action: formType,
    description: `Form submission: ${formType}`,
    metadata: {
      formData,
      status,
      timestamp: new Date().toISOString(),
    },
  })
}

/**
 * Log page visit
 */
export async function logPageVisit(userId: string, pagePath: string): Promise<boolean> {
  return trackUserActivity({
    userId,
    eventType: 'page_visit',
    action: pagePath,
    description: `User visited ${pagePath}`,
  })
}

/**
 * Log authentication event
 */
export async function logAuthEvent(
  userId: string,
  eventType: 'login' | 'logout' | 'signup' | 'failed_login',
  success: boolean,
): Promise<boolean> {
  return trackUserActivity({
    userId,
    eventType: 'authentication',
    action: eventType,
    description: `${eventType} ${success ? 'successful' : 'failed'}`,
    metadata: { success, timestamp: new Date().toISOString() },
  })
}
