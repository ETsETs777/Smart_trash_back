import { SetMetadata } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

/**
 * Decorator for login endpoints with stricter rate limiting
 * Limits: 5 attempts per 15 minutes per IP
 */
export const ThrottleLogin = () =>
  SetMetadata('skipThrottle', false) &&
  Throttle([
    {
      name: 'login',
      ttl: 900000, // 15 minutes
      limit: 5, // 5 attempts per 15 minutes
    },
  ]);

