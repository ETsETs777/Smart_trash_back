import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { LoginAttemptEntity } from '../../entities/security/login-attempt.entity'

export interface LoginAttemptData {
  email: string
  ipAddress?: string
  userAgent?: string
  success: boolean
  failureReason?: string
  userId?: string
}

@Injectable()
export class LoginAttemptTrackerService {
  private readonly logger = new Logger(LoginAttemptTrackerService.name)
  private readonly MAX_FAILED_ATTEMPTS = 5
  private readonly LOCKOUT_DURATION_MS = 15 * 60 * 1000 // 15 minutes

  constructor(
    @InjectRepository(LoginAttemptEntity)
    private readonly loginAttemptRepository: Repository<LoginAttemptEntity>,
  ) {}

  /**
   * Log a login attempt
   */
  async logAttempt(data: LoginAttemptData): Promise<void> {
    try {
      const attempt = this.loginAttemptRepository.create({
        email: data.email,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        success: data.success,
        failureReason: data.failureReason,
        userId: data.userId,
        attemptedAt: new Date(),
      })

      await this.loginAttemptRepository.save(attempt)

      // Log to console for monitoring
      if (data.success) {
        this.logger.log(`Successful login: ${data.email} from ${data.ipAddress || 'unknown IP'}`)
      } else {
        this.logger.warn(
          `Failed login attempt: ${data.email} from ${data.ipAddress || 'unknown IP'} - ${data.failureReason || 'Unknown reason'}`,
        )
      }

      // Check for suspicious activity
      if (!data.success) {
        await this.checkSuspiciousActivity(data.email, data.ipAddress)
      }
    } catch (error) {
      this.logger.error('Failed to log login attempt', error)
    }
  }

  /**
   * Check if account should be locked due to too many failed attempts
   */
  async shouldLockAccount(email: string, ipAddress?: string): Promise<boolean> {
    const cutoffTime = new Date(Date.now() - this.LOCKOUT_DURATION_MS)
    
    const recentFailedAttempts = await this.loginAttemptRepository.count({
      where: {
        email,
        success: false,
        attemptedAt: MoreThanOrEqual(cutoffTime),
      },
    })

    if (recentFailedAttempts >= this.MAX_FAILED_ATTEMPTS) {
      this.logger.warn(`Account locked due to ${recentFailedAttempts} failed attempts: ${email}`)
      return true
    }

    // Also check by IP address
    if (ipAddress) {
      const ipFailedAttempts = await this.loginAttemptRepository.count({
        where: {
          ipAddress,
          success: false,
          attemptedAt: MoreThanOrEqual(cutoffTime),
        },
      })

      if (ipFailedAttempts >= this.MAX_FAILED_ATTEMPTS * 2) {
        this.logger.warn(`IP address locked due to ${ipFailedAttempts} failed attempts: ${ipAddress}`)
        return true
      }
    }

    return false
  }

  /**
   * Get recent failed attempts count
   */
  async getRecentFailedAttempts(email: string, minutes: number = 15): Promise<number> {
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000)
    
    return await this.loginAttemptRepository.count({
      where: {
        email,
        success: false,
        attemptedAt: MoreThanOrEqual(cutoffTime),
      },
    })
  }

  /**
   * Check for suspicious activity and log alerts
   */
  private async checkSuspiciousActivity(email: string, ipAddress?: string): Promise<void> {
    const recentFailed = await this.getRecentFailedAttempts(email, 15)

    if (recentFailed >= 3) {
      this.logger.warn(
        `⚠️ SUSPICIOUS ACTIVITY: ${recentFailed} failed login attempts for ${email} in the last 15 minutes`,
      )
    }

    if (ipAddress) {
      const cutoffTime = new Date(Date.now() - 15 * 60 * 1000)
      const ipAttempts = await this.loginAttemptRepository.count({
        where: {
          ipAddress,
          success: false,
          attemptedAt: MoreThanOrEqual(cutoffTime),
        },
      })

      if (ipAttempts >= 10) {
        this.logger.error(
          `🚨 SECURITY ALERT: ${ipAttempts} failed login attempts from IP ${ipAddress} in the last 15 minutes - Possible brute force attack!`,
        )
      }
    }
  }

  /**
   * Clean up old login attempts (older than 30 days)
   */
  async cleanupOldAttempts(): Promise<void> {
    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days
    
    const result = await this.loginAttemptRepository
      .createQueryBuilder()
      .delete()
      .where('attemptedAt < :cutoffDate', { cutoffDate })
      .execute()

    if (result.affected && result.affected > 0) {
      this.logger.log(`Cleaned up ${result.affected} old login attempts`)
    }
  }
}

