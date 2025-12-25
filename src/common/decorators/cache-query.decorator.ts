import { SetMetadata } from '@nestjs/common'

export const CACHE_QUERY_KEY = 'cache_query'
export const CACHE_TTL_KEY = 'cache_ttl'
export const CACHE_KEY_GENERATOR_KEY = 'cache_key_generator'

export interface CacheQueryOptions {
  /**
   * Time to live in seconds (default: 300 = 5 minutes)
   */
  ttl?: number
  /**
   * Custom cache key generator function
   * If not provided, will use default: `query:${resolverName}:${methodName}:${argsHash}`
   */
  keyGenerator?: (args: any, context: any) => string
}

/**
 * Decorator to cache GraphQL query results
 * 
 * @example
 * @CacheQuery({ ttl: 600 }) // Cache for 10 minutes
 * @Query(() => [CompanyEntity])
 * publicCompanies() { ... }
 */
export const CacheQuery = (options: CacheQueryOptions = {}) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    SetMetadata(CACHE_QUERY_KEY, true)(target, propertyKey, descriptor)
    SetMetadata(CACHE_TTL_KEY, options.ttl || 300)(target, propertyKey, descriptor)
    if (options.keyGenerator) {
      SetMetadata(CACHE_KEY_GENERATOR_KEY, options.keyGenerator)(target, propertyKey, descriptor)
    }
  }
}

