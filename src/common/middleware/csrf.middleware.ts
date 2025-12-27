import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'

/**
 * CSRF protection middleware
 * Validates CSRF token for state-changing operations (POST, PUT, PATCH, DELETE)
 * Uses double-submit cookie pattern for CSRF protection
 */
@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Skip CSRF check for GET, HEAD, OPTIONS requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next()
    }

    // Skip CSRF check for public endpoints
    const publicRoutes = [
      '/auth/csrf-token',
      '/graphql', // GraphQL handles auth differently
      '/images/upload', // File uploads - will be handled separately if needed
    ]

    const isPublicRoute = publicRoutes.some(route => req.path.startsWith(route))
    if (isPublicRoute) {
      return next()
    }

    // Get CSRF token from header
    const headerToken = req.headers['x-csrf-token'] as string
    // Get CSRF token from cookie
    const cookieToken = req.cookies?.['csrf-token'] as string

    // Validate token using double-submit cookie pattern
    if (!headerToken || !cookieToken || headerToken !== cookieToken) {
      throw new UnauthorizedException('Invalid or missing CSRF token')
    }

    // Validate Origin/Referer headers for additional CSRF protection
    const origin = req.headers.origin || req.headers.referer
    const host = req.headers.host

    if (origin && host) {
      // Extract host from origin/referer
      let originHost: string
      try {
        if (origin.startsWith('http://') || origin.startsWith('https://')) {
          const url = new URL(origin)
          originHost = url.host
        } else {
          originHost = origin
        }
      } catch {
        originHost = origin
      }

      // Compare hosts (allow localhost for development)
      const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1')
      const originIsLocalhost = originHost.includes('localhost') || originHost.includes('127.0.0.1')

      if (!isLocalhost && !originIsLocalhost && originHost !== host) {
        throw new UnauthorizedException('Invalid Origin/Referer header')
      }
    }

    next()
  }
}
