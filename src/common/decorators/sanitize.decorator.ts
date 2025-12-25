import { Transform } from 'class-transformer'
import { sanitizeString, sanitizeRichText } from '../utils/sanitize.util'

/**
 * Decorator to sanitize string fields to prevent XSS attacks
 * Removes all HTML tags and dangerous content
 * 
 * @example
 * @Sanitize()
 * @Field()
 * name: string;
 */
export const Sanitize = () => {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      return sanitizeString(value)
    }
    if (Array.isArray(value)) {
      return value.map((item) => 
        typeof item === 'string' ? sanitizeString(item) : item
      )
    }
    return value
  })
}

/**
 * Decorator to sanitize rich text fields (allows basic HTML formatting)
 * Use with caution - only for trusted content
 * 
 * @example
 * @SanitizeRichText()
 * @Field()
 * description: string;
 */
export const SanitizeRichText = () => {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      return sanitizeRichText(value)
    }
    return value
  })
}

