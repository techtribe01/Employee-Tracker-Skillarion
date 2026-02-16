'use server'

import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Check database connectivity
    const dbCheck = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
    
    if (dbCheck.error && dbCheck.error.code !== 'PGRST116') {
      throw new Error(`Database check failed: ${dbCheck.error.message}`)
    }

    // Check authentication
    const authCheck = await supabase.auth.getUser()
    
    const timestamp = new Date().toISOString()
    
    return Response.json(
      {
        status: 'healthy',
        timestamp,
        services: {
          database: 'up',
          auth: 'up',
        },
        version: process.env.npm_package_version || '1.0.0',
      },
      { status: 200 }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return Response.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: errorMessage,
      },
      { status: 503 }
    )
  }
}
