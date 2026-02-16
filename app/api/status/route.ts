'use server'

import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export interface SystemStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  uptime: number
  services: {
    database: 'up' | 'down'
    auth: 'up' | 'down'
    api: 'up' | 'down'
  }
  metrics: {
    activeUsers: number
    averageResponseTime: number
    errorRate: number
  }
  version: string
}

export async function getSystemStatus(): Promise<SystemStatus> {
  const startTime = Date.now()

  try {
    const supabase = await createClient()

    // Check database
    const dbStart = Date.now()
    const dbCheck = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
    const dbTime = Date.now() - dbStart

    const dbStatus = dbCheck.error ? 'down' : 'up'

    // Check authentication
    const authStart = Date.now()
    const authCheck = await supabase.auth.getUser()
    const authTime = Date.now() - authStart

    const authStatus = authCheck.error ? 'down' : 'up'

    // Calculate overall status
    const allHealthy = dbStatus === 'up' && authStatus === 'up'
    const overallStatus: 'healthy' | 'degraded' | 'unhealthy' = allHealthy
      ? 'healthy'
      : 'degraded'

    logger.info('System health check completed', {
      status: overallStatus,
      dbTime,
      authTime,
    })

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: dbStatus,
        auth: authStatus,
        api: 'up',
      },
      metrics: {
        activeUsers: 0,
        averageResponseTime: (dbTime + authTime) / 2,
        errorRate: 0,
      },
      version: process.env.npm_package_version || '1.0.0',
    }
  } catch (error) {
    logger.error('System status check failed', error as Error)

    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: 'down',
        auth: 'down',
        api: 'down',
      },
      metrics: {
        activeUsers: 0,
        averageResponseTime: 0,
        errorRate: 100,
      },
      version: process.env.npm_package_version || '1.0.0',
    }
  }
}
