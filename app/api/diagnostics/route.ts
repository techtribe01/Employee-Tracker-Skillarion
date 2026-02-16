'use server'

import { NextRequest, NextResponse } from 'next/server'
import { getSystemDiagnostics, checkDatabasePerformance } from '@/lib/monitoring'
import { withSecurityHeaders } from '@/lib/security-headers'

export async function GET(request: NextRequest) {
  try {
    const diagnostics = await getSystemDiagnostics()
    
    const status =
      diagnostics.database.status === 'up' && diagnostics.authentication.status === 'up'
        ? 'healthy'
        : 'degraded'

    return NextResponse.json(
      {
        status,
        diagnostics,
      },
      {
        status: status === 'healthy' ? 200 : 503,
      }
    )
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    )
  }
}
