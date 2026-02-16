import { NextRequest, NextResponse } from 'next/server'
import { metricsCollector } from '@/lib/monitoring'

export async function GET(request: NextRequest) {
  const metrics = metricsCollector.getMetrics()

  return NextResponse.json(
    {
      timestamp: new Date().toISOString(),
      metrics,
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    }
  )
}
