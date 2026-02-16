'use server'

import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

/**
 * System notification types and handlers
 */

export type NotificationType =
  | 'system_alert'
  | 'maintenance'
  | 'incident'
  | 'performance_issue'
  | 'security_alert'
  | 'update_available'

export interface SystemNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  severity: 'info' | 'warning' | 'critical'
  timestamp: string
  resolved: boolean
  resolvedAt?: string
  affectedUsers?: number
}

/**
 * Send system notification to all admins
 */
export async function notifyAdmins(
  notification: Omit<SystemNotification, 'id' | 'timestamp'>
) {
  try {
    const supabase = await createClient()

    // Get all admin users
    const { data: admins, error: adminError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('role', 'admin')

    if (adminError) throw adminError

    // Create notifications for each admin
    const notifications = admins.map((admin) => ({
      user_id: admin.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      created_at: new Date().toISOString(),
    }))

    const { error: insertError } = await supabase
      .from('notifications')
      .insert(notifications)

    if (insertError) throw insertError

    logger.info('System notification sent to admins', {
      type: notification.type,
      adminCount: admins.length,
    })

    return { success: true, notifiedCount: admins.length }
  } catch (error) {
    logger.error('Failed to send admin notification', error as Error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Create system incident report
 */
export async function reportIncident(
  title: string,
  description: string,
  severity: 'low' | 'medium' | 'high' | 'critical'
) {
  try {
    logger.error(`INCIDENT [${severity.toUpperCase()}]: ${title}`, new Error(description))

    // Notify admins of critical incidents
    if (severity === 'critical') {
      await notifyAdmins({
        type: 'incident',
        title,
        message: description,
        severity: 'critical',
        resolved: false,
      })
    }

    return { success: true }
  } catch (error) {
    logger.error('Failed to report incident', error as Error)
    return { success: false }
  }
}

/**
 * Create maintenance notification
 */
export async function notifyMaintenance(
  startTime: string,
  duration: number,
  affectedServices: string[]
) {
  const maintenanceNotif: Omit<SystemNotification, 'id' | 'timestamp'> = {
    type: 'maintenance',
    title: 'Scheduled Maintenance',
    message: `Maintenance scheduled from ${new Date(startTime).toLocaleString()}. Duration: ${duration} minutes. Affected services: ${affectedServices.join(', ')}`,
    severity: 'warning',
    resolved: false,
  }

  return notifyAdmins(maintenanceNotif)
}

/**
 * Performance warning notification
 */
export async function notifyPerformanceIssue(
  metric: string,
  currentValue: number,
  threshold: number
) {
  const perfNotif: Omit<SystemNotification, 'id' | 'timestamp'> = {
    type: 'performance_issue',
    title: 'Performance Degradation Detected',
    message: `${metric} is ${currentValue}ms, exceeding threshold of ${threshold}ms`,
    severity: 'warning',
    resolved: false,
  }

  return notifyAdmins(perfNotif)
}

/**
 * Security alert notification
 */
export async function notifySecurityAlert(alert: string, details: Record<string, any>) {
  const secNotif: Omit<SystemNotification, 'id' | 'timestamp'> = {
    type: 'security_alert',
    title: 'Security Alert',
    message: alert,
    severity: 'critical',
    resolved: false,
  }

  logger.error('SECURITY ALERT: ' + alert, new Error(JSON.stringify(details)))

  return notifyAdmins(secNotif)
}

/**
 * Get system notifications
 */
export async function getSystemNotifications(limit = 50) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    logger.error('Failed to fetch notifications', error as Error)
    return { success: false, data: [] }
  }
}
