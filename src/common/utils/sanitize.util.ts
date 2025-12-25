import sanitizeHtml from 'sanitize-html'

/**
 * Sanitize string to prevent XSS attacks
 * Removes HTML tags and dangerous content
 */
export function sanitizeString(input: string | null | undefined): string {
  if (!input || typeof input !== 'string') {
    return ''
  }

  // Remove all HTML tags and return plain text
  return sanitizeHtml(input, {
    allowedTags: [], // No HTML tags allowed
    allowedAttributes: {},
    textContent: true, // Return only text content
  }).trim()
}

/**
 * Sanitize string but allow basic formatting (for rich text fields)
 * Use with caution - only for trusted content
 */
export function sanitizeRichText(input: string | null | undefined): string {
  if (!input || typeof input !== 'string') {
    return ''
  }

  // Allow only safe HTML tags
  return sanitizeHtml(input, {
    allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
    allowedAttributes: {},
    allowedSchemes: [],
  }).trim()
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj }

  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeString(sanitized[key]) as any
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      if (Array.isArray(sanitized[key])) {
        sanitized[key] = sanitized[key].map((item: any) =>
          typeof item === 'string' ? sanitizeString(item) : item,
        ) as any
      } else {
        sanitized[key] = sanitizeObject(sanitized[key]) as any
      }
    }
  }

  return sanitized
}

