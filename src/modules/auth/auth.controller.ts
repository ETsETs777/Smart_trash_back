import { Controller, Get, Res, Req } from '@nestjs/common'
import { Response, Request } from 'express'
import { Public } from 'src/decorators/auth/public.decorator'
import * as crypto from 'crypto'

@Controller('auth')
export class AuthController {
  /**
   * Generate and return CSRF token
   * Token is stored in httpOnly cookie and also returned in response
   */
  @Public()
  @Get('csrf-token')
  async getCsrfToken(@Req() req: Request, @Res() res: Response) {
    // Generate CSRF token
    const token = crypto.randomBytes(32).toString('hex')
    
    // Store token in httpOnly cookie (more secure than localStorage)
    res.cookie('csrf-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
      sameSite: 'strict', // CSRF protection
      maxAge: 3600000, // 1 hour
      path: '/',
    })

    // Also return token in response for client-side storage (as backup)
    return res.json({
      token,
      expiresIn: 3600000, // 1 hour in milliseconds
    })
  }
}


import { Public } from 'src/decorators/auth/public.decorator'
import * as crypto from 'crypto'

@Controller('auth')
export class AuthController {
  /**
   * Generate and return CSRF token
   * Token is stored in httpOnly cookie and also returned in response
   */
  @Public()
  @Get('csrf-token')
  async getCsrfToken(@Req() req: Request, @Res() res: Response) {
    // Generate CSRF token
    const token = crypto.randomBytes(32).toString('hex')
    
    // Store token in httpOnly cookie (more secure than localStorage)
    res.cookie('csrf-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
      sameSite: 'strict', // CSRF protection
      maxAge: 3600000, // 1 hour
      path: '/',
    })

    // Also return token in response for client-side storage (as backup)
    return res.json({
      token,
      expiresIn: 3600000, // 1 hour in milliseconds
    })
  }
}


import { Public } from 'src/decorators/auth/public.decorator'
import * as crypto from 'crypto'

@Controller('auth')
export class AuthController {
  /**
   * Generate and return CSRF token
   * Token is stored in httpOnly cookie and also returned in response
   */
  @Public()
  @Get('csrf-token')
  async getCsrfToken(@Req() req: Request, @Res() res: Response) {
    // Generate CSRF token
    const token = crypto.randomBytes(32).toString('hex')
    
    // Store token in httpOnly cookie (more secure than localStorage)
    res.cookie('csrf-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
      sameSite: 'strict', // CSRF protection
      maxAge: 3600000, // 1 hour
      path: '/',
    })

    // Also return token in response for client-side storage (as backup)
    return res.json({
      token,
      expiresIn: 3600000, // 1 hour in milliseconds
    })
  }
}

