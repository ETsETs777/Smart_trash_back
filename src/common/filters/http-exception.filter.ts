import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { Request, Response } from 'express'

/**
 * Global exception filter
 * Hides sensitive error details in production
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()
    const isDevelopment = process.env.NODE_ENV !== 'production'

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let message = 'Internal server error'
    let details: any = null

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const exceptionResponse = exception.getResponse()

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse
      } else if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || exception.message || 'An error occurred'
        details = isDevelopment ? (exceptionResponse as any) : undefined
      } else {
        message = exception.message
      }
    } else if (exception instanceof Error) {
      message = isDevelopment ? exception.message : 'Internal server error'
      details = isDevelopment ? { stack: exception.stack } : undefined
    }

    // Log full error details (for debugging)
    this.logger.error(
      `${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : JSON.stringify(exception),
    )

    // In production, don't expose internal error details
    const errorResponse = {
      statusCode: status,
      message: isDevelopment ? message : this.sanitizeErrorMessage(message),
      ...(isDevelopment && details ? { details } : {}),
      timestamp: new Date().toISOString(),
      path: request.url,
    }

    response.status(status).json(errorResponse)
  }

  /**
   * Sanitize error messages for production
   */
  private sanitizeErrorMessage(message: string): string {
    // Don't expose internal error details
    if (message.includes('Cannot') || message.includes('TypeORM') || message.includes('database')) {
      return 'An error occurred while processing your request'
    }

    // Keep user-friendly messages
    if (
      message.includes('Unauthorized') ||
      message.includes('Forbidden') ||
      message.includes('Not Found') ||
      message.includes('Validation')
    ) {
      return message
    }

    // Generic message for unknown errors
    return 'An error occurred. Please try again later.'
  }
}

  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { Request, Response } from 'express'

/**
 * Global exception filter
 * Hides sensitive error details in production
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()
    const isDevelopment = process.env.NODE_ENV !== 'production'

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let message = 'Internal server error'
    let details: any = null

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const exceptionResponse = exception.getResponse()

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse
      } else if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || exception.message || 'An error occurred'
        details = isDevelopment ? (exceptionResponse as any) : undefined
      } else {
        message = exception.message
      }
    } else if (exception instanceof Error) {
      message = isDevelopment ? exception.message : 'Internal server error'
      details = isDevelopment ? { stack: exception.stack } : undefined
    }

    // Log full error details (for debugging)
    this.logger.error(
      `${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : JSON.stringify(exception),
    )

    // In production, don't expose internal error details
    const errorResponse = {
      statusCode: status,
      message: isDevelopment ? message : this.sanitizeErrorMessage(message),
      ...(isDevelopment && details ? { details } : {}),
      timestamp: new Date().toISOString(),
      path: request.url,
    }

    response.status(status).json(errorResponse)
  }

  /**
   * Sanitize error messages for production
   */
  private sanitizeErrorMessage(message: string): string {
    // Don't expose internal error details
    if (message.includes('Cannot') || message.includes('TypeORM') || message.includes('database')) {
      return 'An error occurred while processing your request'
    }

    // Keep user-friendly messages
    if (
      message.includes('Unauthorized') ||
      message.includes('Forbidden') ||
      message.includes('Not Found') ||
      message.includes('Validation')
    ) {
      return message
    }

    // Generic message for unknown errors
    return 'An error occurred. Please try again later.'
  }
}

  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { Request, Response } from 'express'

/**
 * Global exception filter
 * Hides sensitive error details in production
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()
    const isDevelopment = process.env.NODE_ENV !== 'production'

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let message = 'Internal server error'
    let details: any = null

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const exceptionResponse = exception.getResponse()

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse
      } else if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || exception.message || 'An error occurred'
        details = isDevelopment ? (exceptionResponse as any) : undefined
      } else {
        message = exception.message
      }
    } else if (exception instanceof Error) {
      message = isDevelopment ? exception.message : 'Internal server error'
      details = isDevelopment ? { stack: exception.stack } : undefined
    }

    // Log full error details (for debugging)
    this.logger.error(
      `${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : JSON.stringify(exception),
    )

    // In production, don't expose internal error details
    const errorResponse = {
      statusCode: status,
      message: isDevelopment ? message : this.sanitizeErrorMessage(message),
      ...(isDevelopment && details ? { details } : {}),
      timestamp: new Date().toISOString(),
      path: request.url,
    }

    response.status(status).json(errorResponse)
  }

  /**
   * Sanitize error messages for production
   */
  private sanitizeErrorMessage(message: string): string {
    // Don't expose internal error details
    if (message.includes('Cannot') || message.includes('TypeORM') || message.includes('database')) {
      return 'An error occurred while processing your request'
    }

    // Keep user-friendly messages
    if (
      message.includes('Unauthorized') ||
      message.includes('Forbidden') ||
      message.includes('Not Found') ||
      message.includes('Validation')
    ) {
      return message
    }

    // Generic message for unknown errors
    return 'An error occurred. Please try again later.'
  }
}



