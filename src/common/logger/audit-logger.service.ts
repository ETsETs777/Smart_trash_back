import { Injectable, Inject, Optional } from '@nestjs/common'
import { PinoLogger } from 'nestjs-pino'

export enum AuditAction {
  // Authentication
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  REGISTER = 'REGISTER',
  PASSWORD_RESET = 'PASSWORD_RESET',
  EMAIL_CONFIRMED = 'EMAIL_CONFIRMED',
  
  // User Management
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  
  // Company Management
  COMPANY_CREATED = 'COMPANY_CREATED',
  COMPANY_UPDATED = 'COMPANY_UPDATED',
  COMPANY_DELETED = 'COMPANY_DELETED',
  
  // Employee Management
  EMPLOYEE_ADDED = 'EMPLOYEE_ADDED',
  EMPLOYEE_REMOVED = 'EMPLOYEE_REMOVED',
  EMPLOYEE_UPDATED = 'EMPLOYEE_UPDATED',
  
  // Collection Areas
  AREA_CREATED = 'AREA_CREATED',
  AREA_UPDATED = 'AREA_UPDATED',
  AREA_DELETED = 'AREA_DELETED',
  
  // Bins
  BIN_ADDED = 'BIN_ADDED',
  BIN_UPDATED = 'BIN_UPDATED',
  BIN_DELETED = 'BIN_DELETED',
  
  // Waste Classification
  WASTE_CLASSIFIED = 'WASTE_CLASSIFIED',
  WASTE_PHOTO_UPLOADED = 'WASTE_PHOTO_UPLOADED',
  
  // Settings
  SETTINGS_UPDATED = 'SETTINGS_UPDATED',
  
  // Admin Actions
  ADMIN_ACTION = 'ADMIN_ACTION',
}

export interface AuditLogData {
  action: AuditAction
  userId?: string
  userEmail?: string
  userRole?: string
  companyId?: string
  resourceType?: string
  resourceId?: string
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

@Injectable()
export class AuditLoggerService {
  constructor(
    @Optional() @Inject(PinoLogger)
    private readonly logger?: PinoLogger,
  ) {}

  /**
   * Log audit event
   */
  log(data: AuditLogData): void {
    const logEntry = {
      type: 'audit',
      action: data.action,
      userId: data.userId,
      userEmail: data.userEmail,
      userRole: data.userRole,
      companyId: data.companyId,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      metadata: data.metadata || {},
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      timestamp: new Date().toISOString(),
    }

    // Log to structured logger
    if (this.logger) {
      this.logger.info(logEntry, `Audit: ${data.action}`)
    } else {
      // Fallback to console if PinoLogger is not available
      console.log(JSON.stringify(logEntry))
    }

    // In production, you might want to also store in database
    // For now, we'll rely on structured logging
  }

  /**
   * Log user action
   */
  logUserAction(
    action: AuditAction,
    userId: string,
    metadata?: Record<string, any>,
  ): void {
    this.log({
      action,
      userId,
      metadata,
    })
  }

  /**
   * Log admin action
   */
  logAdminAction(
    action: AuditAction,
    adminId: string,
    adminEmail: string,
    resourceType?: string,
    resourceId?: string,
    metadata?: Record<string, any>,
  ): void {
    this.log({
      action: AuditAction.ADMIN_ACTION,
      userId: adminId,
      userEmail: adminEmail,
      userRole: 'ADMIN',
      resourceType,
      resourceId,
      metadata: {
        ...metadata,
        originalAction: action,
      },
    })
  }
}

