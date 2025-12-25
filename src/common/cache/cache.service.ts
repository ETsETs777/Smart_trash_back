import { Injectable, Inject, Logger } from '@nestjs/common'
import { ConfigService } from '../../modules/config/config.service'
import Redis from 'ioredis'

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name)
  private redis: Redis | null = null
  private readonly enabled: boolean

  constructor(private readonly configService: ConfigService) {
    this.enabled = process.env.REDIS_CACHE_ENABLED !== 'false'
    
    if (this.enabled) {
      try {
        this.redis = new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: Number(process.env.REDIS_PORT || 6379),
          db: Number(process.env.REDIS_CACHE_DB || 1), // Use DB 1 for cache (DB 0 is for BullMQ)
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000)
            return delay
          },
          maxRetriesPerRequest: 3,
        })

        this.redis.on('error', (err) => {
          this.logger.warn(`Redis cache connection error: ${err.message}`)
        })

        this.redis.on('connect', () => {
          this.logger.log('Redis cache connected')
        })
      } catch (error) {
        this.logger.warn(`Failed to initialize Redis cache: ${error.message}`)
        this.redis = null
      }
    }
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.enabled || !this.redis) {
      return null
    }

    try {
      const value = await this.redis.get(key)
      if (!value) {
        return null
      }
      return JSON.parse(value) as T
    } catch (error) {
      this.logger.warn(`Cache get error for key ${key}: ${error.message}`)
      return null
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set(key: string, value: any, ttlSeconds: number = 300): Promise<boolean> {
    if (!this.enabled || !this.redis) {
      return false
    }

    try {
      await this.redis.setex(key, ttlSeconds, JSON.stringify(value))
      return true
    } catch (error) {
      this.logger.warn(`Cache set error for key ${key}: ${error.message}`)
      return false
    }
  }

  /**
   * Delete key from cache
   */
  async delete(key: string): Promise<boolean> {
    if (!this.enabled || !this.redis) {
      return false
    }

    try {
      await this.redis.del(key)
      return true
    } catch (error) {
      this.logger.warn(`Cache delete error for key ${key}: ${error.message}`)
      return false
    }
  }

  /**
   * Delete keys by pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    if (!this.enabled || !this.redis) {
      return 0
    }

    try {
      const keys = await this.redis.keys(pattern)
      if (keys.length === 0) {
        return 0
      }
      return await this.redis.del(...keys)
    } catch (error) {
      this.logger.warn(`Cache deletePattern error for pattern ${pattern}: ${error.message}`)
      return 0
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.enabled || !this.redis) {
      return false
    }

    try {
      const result = await this.redis.exists(key)
      return result === 1
    } catch (error) {
      this.logger.warn(`Cache exists error for key ${key}: ${error.message}`)
      return false
    }
  }

  /**
   * Get or set with cache
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = 300,
  ): Promise<T> {
    const cached = await this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    const value = await fetcher()
    await this.set(key, value, ttlSeconds)
    return value
  }

  /**
   * Invalidate cache for a company
   */
  async invalidateCompanyCache(companyId: string): Promise<void> {
    await this.deletePattern(`analytics:company:${companyId}:*`)
    await this.deletePattern(`leaderboard:company:${companyId}:*`)
  }

  onModuleDestroy() {
    if (this.redis) {
      this.redis.quit()
    }
  }
}

