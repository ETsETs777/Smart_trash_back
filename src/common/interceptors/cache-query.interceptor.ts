import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { GqlExecutionContext } from '@nestjs/graphql'
import { Observable, of } from 'rxjs'
import { tap } from 'rxjs/operators'
import { CacheService } from '../cache/cache.service'
import { CACHE_QUERY_KEY, CACHE_TTL_KEY, CACHE_KEY_GENERATOR_KEY } from '../decorators/cache-query.decorator'
import { createHash } from 'crypto'

@Injectable()
export class CacheQueryInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly cacheService: CacheService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const isCacheable = this.reflector.getAllAndOverride<boolean>(CACHE_QUERY_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (!isCacheable) {
      return next.handle()
    }

    const gqlContext = GqlExecutionContext.create(context)
    const info = gqlContext.getInfo()
    const args = gqlContext.getArgs()
    const resolverName = context.getClass().name
    const methodName = context.getHandler().name

    // Get TTL from metadata
    const ttl = this.reflector.getAllAndOverride<number>(CACHE_TTL_KEY, [
      context.getHandler(),
      context.getClass(),
    ]) || 300

    // Get custom key generator if provided
    const keyGenerator = this.reflector.getAllAndOverride<(args: any, context: any) => string>(
      CACHE_KEY_GENERATOR_KEY,
      [context.getHandler(), context.getClass()],
    )

    // Generate cache key
    let cacheKey: string
    if (keyGenerator) {
      cacheKey = keyGenerator(args, { resolverName, methodName, info })
    } else {
      // Default key generation: hash the arguments
      const argsString = JSON.stringify(args, Object.keys(args).sort())
      const argsHash = createHash('md5').update(argsString).digest('hex').substring(0, 8)
      cacheKey = `query:${resolverName}:${methodName}:${argsHash}`
    }

    // Try to get from cache
    const cached = await this.cacheService.get(cacheKey)
    if (cached !== null) {
      return of(cached)
    }

    // Execute query and cache result
    return next.handle().pipe(
      tap(async (data) => {
        if (data !== null && data !== undefined) {
          await this.cacheService.set(cacheKey, data, ttl)
        }
      }),
    )
  }
}

