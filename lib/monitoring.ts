import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

/**
 * Metrics collection and monitoring
 */

export interface MetricsData {
  timestamp: string
  method: string
  path: string
  statusCode: number
  duration: number
  userId?: string
}

export interface SystemMetrics {
  totalRequests: number
  averageResponseTime: number
  errorRate: number
  activeUsers: number
  databaseLatency: number
  memoryUsage: number
  cpuUsage: number
}

class MetricsCollector {
  private metrics: MetricsData[] = []
  private maxMetrics = 10000

  recordRequest(data: MetricsData) {
    this.metrics.push(data)
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift()
    }
  }

  getMetrics(): SystemMetrics {
    const now = Date.now()
    const recentMetrics = this.metrics.filter(
      (m) => new Date(m.timestamp).getTime() > now - 60 * 60 * 1000 // Last hour
    )

    const totalRequests = recentMetrics.length
    const errorCount = recentMetrics.filter((m) => m.statusCode >= 400).length
    const avgResponseTime =
      recentMetrics.length > 0
        ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length
        : 0

    const memUsage = process.memoryUsage()

    return {
      totalRequests,
      averageResponseTime: Math.round(avgResponseTime),
      errorRate: totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0,
      activeUsers: new Set(recentMetrics.map((m) => m.userId)).size,
      databaseLatency: 0, // Set in health check
      memoryUsage: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      cpuUsage: 0, // Platform dependent
    }
  }
}

export const metricsCollector = new MetricsCollector()

/**
 * Database performance monitoring
 */
export async function checkDatabasePerformance() {
  try {
    const supabase = await createClient()
    const startTime = Date.now()

    // Check with a simple query
    const { error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)

    const duration = Date.now() - startTime

    return {
      status: error ? 'down' : 'up',
      latency: duration,
      error: error?.message,
    }
  } catch (error) {
    logger.error('Database performance check failed', error as Error)
    return {
      status: 'down',
      latency: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Authentication service monitoring
 */
export async function checkAuthService() {
  try {
    const supabase = await createClient()
    const startTime = Date.now()

    const { error } = await supabase.auth.getUser()
    const duration = Date.now() - startTime

    // Error is expected if not authenticated, that's ok
    return {
      status: 'up',
      latency: duration,
    }
  } catch (error) {
    logger.error('Auth service check failed', error as Error)
    return {
      status: 'down',
      latency: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * External services monitoring
 */
export async function checkExternalServices() {
  const services: Record<string, any> = {}

  // Check email service availability
  services.email = {
    status: process.env.SENDGRID_API_KEY ? 'configured' : 'not_configured',
  }

  // Check SMS gateway
  services.sms = {
    status: process.env.TWILIO_ACCOUNT_SID ? 'configured' : 'not_configured',
  }

  return services
}

/**
 * Get detailed system diagnostics
 */
export async function getSystemDiagnostics() {
  const [dbPerf, authStatus, externalServices] = await Promise.all([
    checkDatabasePerformance(),
    checkAuthService(),
    checkExternalServices(),
  ])

  const memUsage = process.memoryUsage()

  return {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    database: dbPerf,
    authentication: authStatus,
    externalServices,
    memory: {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024),
      rss: Math.round(memUsage.rss / 1024 / 1024),
    },
    version: process.env.npm_package_version || '1.0.0',
  }
}
