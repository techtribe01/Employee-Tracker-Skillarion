import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { AppError, getErrorResponse } from '@/lib/errors'

/**
 * Global error handler for API routes
 * Logs errors and returns standardized error responses
 */

export function createErrorHandler(handler: Function) {
  return async (request: NextRequest, ...args: any[]) => {
    try {
      return await handler(request, ...args)
    } catch (error) {
      const errorResponse = getErrorResponse(error)

      logger.error('API error', error instanceof Error ? error : new Error(String(error)), {
        method: request.method,
        path: request.nextUrl.pathname,
        statusCode: errorResponse.statusCode,
        code: errorResponse.code,
      })

      return NextResponse.json(errorResponse, {
        status: errorResponse.statusCode,
      })
    }
  }
}

/**
 * Safe JSON parse with error handling
 */
export function safeJsonParse(json: string, fallback?: any) {
  try {
    return JSON.parse(json)
  } catch (error) {
    logger.warn('JSON parse error', { json: json.substring(0, 100) })
    return fallback || null
  }
}

/**
 * Safe async operation with retry
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * Math.pow(2, i)))
      }
    }
  }

  throw lastError || new Error('Operation failed after retries')
}

/**
 * Safe timeout wrapper
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 30000
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Operation timeout')), timeoutMs)
    ),
  ])
}
