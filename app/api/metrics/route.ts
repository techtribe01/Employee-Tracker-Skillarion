import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      timestamp: new Date().toISOString(),
      metrics: {
        totalRequests: 0,
        averageResponseTime: 0,
        errorRate: 0,
        activeUsers: 0,
        databaseLatency: 0,
        memoryUsage: 0,
        cpuUsage: 0,
      },
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    }
  )
}
