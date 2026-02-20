import { NextRequest, NextResponse } from 'next/server'

/**
 * Security headers middleware for all responses
 */

export function withSecurityHeaders(handler: Function) {
  return async (request: NextRequest, ...args: any[]) => {
    const response = await handler(request, ...args)
    const headers = new Headers(response.headers)

    // Prevent clickjacking attacks
    headers.set('X-Frame-Options', 'DENY')

    // Enable XSS protection
    headers.set('X-XSS-Protection', '1; mode=block')

    // Prevent MIME type sniffing
    headers.set('X-Content-Type-Options', 'nosniff')

    // Referrer policy - strict-origin-when-cross-origin
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

    // Permissions policy - restrict camera, microphone, geolocation
    headers.set(
      'Permissions-Policy',
      'geolocation=(self), microphone=(), camera=(), payment=()'
    )

    // Content Security Policy
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' *.vercel.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https:",
      'frame-ancestors none',
      'base-uri \'self\'',
      'form-action \'self\'',
    ]
    headers.set('Content-Security-Policy', csp.join('; '))

    // Strict Transport Security
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')

    // Prevent cache poisoning
    headers.set('Cache-Control', 'public, max-age=0, must-revalidate')

    // Add custom security headers
    headers.set('X-Content-Type-Options', 'nosniff')
    headers.set('X-Frame-Options', 'SAMEORIGIN')
    headers.set('X-Permitted-Cross-Domain-Policies', 'none')

    return new NextResponse(response.body, {
      status: response.status,
      headers,
    })
  }
}

/**
 * CORS headers for API routes
 */
export function withCORS(allowedOrigins?: string[]) {
  return (handler: Function) => {
    return async (request: NextRequest, ...args: any[]) => {
      // Handle preflight requests
      if (request.method === 'OPTIONS') {
        return new NextResponse(null, {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': allowedOrigins?.[0] || '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400',
          },
        })
      }

      const response = await handler(request, ...args)
      const headers = new Headers(response.headers)

      headers.set(
        'Access-Control-Allow-Origin',
        allowedOrigins?.[0] || request.headers.get('origin') || '*'
      )
      headers.set('Access-Control-Allow-Credentials', 'true')
      headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
      headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      headers.set('Access-Control-Expose-Headers', 'X-RateLimit-Limit, X-RateLimit-Remaining')

      return new NextResponse(response.body, {
        status: response.status,
        headers,
      })
    }
  }
}

/**
 * Combine multiple middleware
 */
export function compose(...middlewares: Function[]) {
  return (handler: Function) => {
    return middlewares.reduceRight((fn, middleware) => middleware(fn), handler)
  }
}
