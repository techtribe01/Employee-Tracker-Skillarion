import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

/**
 * In-memory rate limiter
 * Production: Use Redis instead
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  keyGenerator?: (request: NextRequest) => string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

const defaultConfig: RateLimitConfig = {
  maxRequests: 100,
  windowMs: 60 * 1000, // 1 minute
  keyGenerator: (request) => request.ip || 'unknown',
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
}

export function getRateLimitKey(request: NextRequest, keyGenerator?: (req: NextRequest) => string) {
  const generator = keyGenerator || defaultConfig.keyGenerator
  return generator(request)
}

export function checkRateLimit(
  key: string,
  config: Partial<RateLimitConfig> = {}
): { limited: boolean; remaining: number; reset: number } {
  const finalConfig = { ...defaultConfig, ...config }
  const now = Date.now()

  let entry = rateLimitStore.get(key)

  if (!entry || entry.resetTime < now) {
    entry = {
      count: 1,
      resetTime: now + finalConfig.windowMs,
    }
    rateLimitStore.set(key, entry)
    return {
      limited: false,
      remaining: finalConfig.maxRequests - 1,
      reset: entry.resetTime,
    }
  }

  entry.count++

  const limited = entry.count > finalConfig.maxRequests
  const remaining = Math.max(0, finalConfig.maxRequests - entry.count)

  return {
    limited,
    remaining,
    reset: entry.resetTime,
  }
}

export function withRateLimit(config?: Partial<RateLimitConfig>) {
  return (handler: Function) => {
    return async (request: NextRequest, ...args: any[]) => {
      const key = getRateLimitKey(request, config?.keyGenerator)
      const limit = checkRateLimit(key, config)

      const response = await handler(request, ...args)

      // Add rate limit headers
      const headers = new Headers(response.headers)
      headers.set('X-RateLimit-Limit', String(config?.maxRequests || 100))
      headers.set('X-RateLimit-Remaining', String(limit.remaining))
      headers.set('X-RateLimit-Reset', String(Math.ceil(limit.reset / 1000)))

      if (limit.limited) {
        logger.warn('Rate limit exceeded', {
          key,
          maxRequests: config?.maxRequests,
          windowMs: config?.windowMs,
        })

        return NextResponse.json(
          { error: 'Too many requests', retryAfter: Math.ceil(limit.reset / 1000) },
          {
            status: 429,
            headers: {
              'Retry-After': String(Math.ceil(limit.reset / 1000)),
              ...Object.fromEntries(headers),
            },
          }
        )
      }

      return new NextResponse(response.body, {
        status: response.status,
        headers,
      })
    }
  }
}
