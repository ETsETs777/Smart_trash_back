import { SetMetadata } from '@nestjs/common'

export const DEFER_FIELD_KEY = 'defer_field'

/**
 * Decorator to mark a field resolver for @defer optimization
 * This indicates that the field can be deferred and sent incrementally
 * 
 * @example
 * @DeferField()
 * @ResolveField(() => [CompanyBinUsageStats])
 * binUsage() { ... }
 */
export const DeferField = () => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    SetMetadata(DEFER_FIELD_KEY, true)(target, propertyKey, descriptor)
  }
}

