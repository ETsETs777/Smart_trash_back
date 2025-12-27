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

    next()
  }
}
