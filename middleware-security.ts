import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

/**
 * Security Middleware
 * Applies security headers and rate limiting
 */

export function withSecurityHeaders(handler: Function) {
  return async (request: NextRequest, ...args: any[]) => {
    const response = await handler(request, ...args)

    // Add security headers
    const headers = new Headers(response.headers)
    
    // Prevent clickjacking
    headers.set('X-Frame-Options', 'DENY')
    
    // Enable XSS protection
    headers.set('X-XSS-Protection', '1; mode=block')
    
    // Prevent MIME type sniffing
    headers.set('X-Content-Type-Options', 'nosniff')
    
    // Referrer policy
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    
    // Permissions policy
    headers.set(
      'Permissions-Policy',
      'geolocation=(self), microphone=(), camera=()'
    )
    
    // Content Security Policy
    headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'"
    )

    return new NextResponse(response.body, { status: response.status, headers })
  }
}

/**
 * Rate Limiting Middleware
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>()

export function withRateLimit(maxRequests: number = 100, windowMs: number = 60000) {
  return async (request: NextRequest, ...args: any[]) => {
    const ip = request.ip || 'unknown'
    const now = Date.now()

    const record = requestCounts.get(ip) || { count: 0, resetTime: now + windowMs }

    if (now > record.resetTime) {
      record.count = 1
      record.resetTime = now + windowMs
    } else {
      record.count++
    }

    requestCounts.set(ip, record)

    if (record.count > maxRequests) {
      logger.warn('Rate limit exceeded', { ip, count: record.count })
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }

    return NextResponse.next()
  }
}

/**
 * Error Handling Middleware
 */
export function withErrorHandling(handler: Function) {
  return async (request: NextRequest, ...args: any[]) => {
    try {
      return await handler(request, ...args)
    } catch (error) {
      logger.error('Request handler error', error as Error, {
        path: request.nextUrl.pathname,
        method: request.method,
      })

      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}
