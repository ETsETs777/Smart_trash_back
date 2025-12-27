import { BadRequestException } from '@nestjs/common'

/**
 * Magic numbers for common image formats
 */
const IMAGE_MAGIC_NUMBERS: Record<string, number[][]> = {
  jpeg: [
    [0xff, 0xd8, 0xff], // JPEG
  ],
  png: [
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], // PNG
  ],
  gif: [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
  ],
  webp: [
    [0x52, 0x49, 0x46, 0x46], // RIFF (WebP starts with RIFF)
  ],
}

/**
 * Validate file content by checking magic numbers
 * @param buffer File buffer
 * @param expectedMimeType Expected MIME type (e.g., 'image/jpeg')
 * @returns true if valid
 * @throws BadRequestException if invalid
 */
export function validateFileContent(
  buffer: Buffer,
  expectedMimeType: string,
): boolean {
  if (!buffer || buffer.length === 0) {
    throw new BadRequestException('Файл пуст')
  }

  // Extract format from MIME type (e.g., 'image/jpeg' -> 'jpeg')
  const format = expectedMimeType.split('/')[1]?.toLowerCase()

  if (!format || !IMAGE_MAGIC_NUMBERS[format]) {
    // If format not in our list, skip magic number validation
    // (but MIME type validation should have caught invalid types)
    return true
  }

  const magicNumbers = IMAGE_MAGIC_NUMBERS[format]
  const fileHeader = Array.from(buffer.slice(0, 16)) // Read first 16 bytes

  // Check if file header matches any of the magic numbers for this format
  const isValid = magicNumbers.some((magic) => {
    if (fileHeader.length < magic.length) {
      return false
    }
    return magic.every((byte, index) => fileHeader[index] === byte)
  })

  // Special case for WebP: check for 'WEBP' after RIFF header
  if (format === 'webp' && isValid) {
    const webpHeader = buffer.slice(8, 12).toString('ascii')
    if (webpHeader !== 'WEBP') {
      throw new BadRequestException(
        'Файл не является действительным изображением WebP',
      )
    }
  }

  if (!isValid) {
    throw new BadRequestException(
      `Содержимое файла не соответствует заявленному типу (${expectedMimeType}). Возможна попытка загрузки вредоносного файла.`,
    )
  }

  return true
}

/**
 * Sanitize filename to prevent path traversal and other attacks
 * @param filename Original filename
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) {
    return 'file'
  }

  // Remove path traversal attempts
  let sanitized = filename
    .replace(/\.\./g, '') // Remove ..
    .replace(/\//g, '_') // Replace / with _
    .replace(/\\/g, '_') // Replace \ with _
    .replace(/[<>:"|?*]/g, '_') // Replace invalid Windows characters
    .trim()

  // Remove leading/trailing dots and spaces
  sanitized = sanitized.replace(/^[.\s]+|[.\s]+$/g, '')

  // Ensure filename is not empty
  if (!sanitized || sanitized.length === 0) {
    sanitized = 'file'
  }

  // Limit filename length
  if (sanitized.length > 255) {
    const ext = sanitized.substring(sanitized.lastIndexOf('.'))
    sanitized = sanitized.substring(0, 255 - ext.length) + ext
  }

  return sanitized
}

/**
 * Validate file size
 * @param size File size in bytes
 * @param maxSize Maximum size in bytes
 * @throws BadRequestException if file is too large
 */
export function validateFileSize(size: number, maxSize: number): void {
  if (size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2)
    throw new BadRequestException(
      `Размер файла превышает максимально допустимый размер (${maxSizeMB} MB)`,
    )
  }
}


/**
 * Magic numbers for common image formats
 */
const IMAGE_MAGIC_NUMBERS: Record<string, number[][]> = {
  jpeg: [
    [0xff, 0xd8, 0xff], // JPEG
  ],
  png: [
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], // PNG
  ],
  gif: [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
  ],
  webp: [
    [0x52, 0x49, 0x46, 0x46], // RIFF (WebP starts with RIFF)
  ],
}

/**
 * Validate file content by checking magic numbers
 * @param buffer File buffer
 * @param expectedMimeType Expected MIME type (e.g., 'image/jpeg')
 * @returns true if valid
 * @throws BadRequestException if invalid
 */
export function validateFileContent(
  buffer: Buffer,
  expectedMimeType: string,
): boolean {
  if (!buffer || buffer.length === 0) {
    throw new BadRequestException('Файл пуст')
  }

  // Extract format from MIME type (e.g., 'image/jpeg' -> 'jpeg')
  const format = expectedMimeType.split('/')[1]?.toLowerCase()

  if (!format || !IMAGE_MAGIC_NUMBERS[format]) {
    // If format not in our list, skip magic number validation
    // (but MIME type validation should have caught invalid types)
    return true
  }

  const magicNumbers = IMAGE_MAGIC_NUMBERS[format]
  const fileHeader = Array.from(buffer.slice(0, 16)) // Read first 16 bytes

  // Check if file header matches any of the magic numbers for this format
  const isValid = magicNumbers.some((magic) => {
    if (fileHeader.length < magic.length) {
      return false
    }
    return magic.every((byte, index) => fileHeader[index] === byte)
  })

  // Special case for WebP: check for 'WEBP' after RIFF header
  if (format === 'webp' && isValid) {
    const webpHeader = buffer.slice(8, 12).toString('ascii')
    if (webpHeader !== 'WEBP') {
      throw new BadRequestException(
        'Файл не является действительным изображением WebP',
      )
    }
  }

  if (!isValid) {
    throw new BadRequestException(
      `Содержимое файла не соответствует заявленному типу (${expectedMimeType}). Возможна попытка загрузки вредоносного файла.`,
    )
  }

  return true
}

/**
 * Sanitize filename to prevent path traversal and other attacks
 * @param filename Original filename
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) {
    return 'file'
  }

  // Remove path traversal attempts
  let sanitized = filename
    .replace(/\.\./g, '') // Remove ..
    .replace(/\//g, '_') // Replace / with _
    .replace(/\\/g, '_') // Replace \ with _
    .replace(/[<>:"|?*]/g, '_') // Replace invalid Windows characters
    .trim()

  // Remove leading/trailing dots and spaces
  sanitized = sanitized.replace(/^[.\s]+|[.\s]+$/g, '')

  // Ensure filename is not empty
  if (!sanitized || sanitized.length === 0) {
    sanitized = 'file'
  }

  // Limit filename length
  if (sanitized.length > 255) {
    const ext = sanitized.substring(sanitized.lastIndexOf('.'))
    sanitized = sanitized.substring(0, 255 - ext.length) + ext
  }

  return sanitized
}

/**
 * Validate file size
 * @param size File size in bytes
 * @param maxSize Maximum size in bytes
 * @throws BadRequestException if file is too large
 */
export function validateFileSize(size: number, maxSize: number): void {
  if (size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2)
    throw new BadRequestException(
      `Размер файла превышает максимально допустимый размер (${maxSizeMB} MB)`,
    )
  }
}


/**
 * Magic numbers for common image formats
 */
const IMAGE_MAGIC_NUMBERS: Record<string, number[][]> = {
  jpeg: [
    [0xff, 0xd8, 0xff], // JPEG
  ],
  png: [
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], // PNG
  ],
  gif: [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
  ],
  webp: [
    [0x52, 0x49, 0x46, 0x46], // RIFF (WebP starts with RIFF)
  ],
}

/**
 * Validate file content by checking magic numbers
 * @param buffer File buffer
 * @param expectedMimeType Expected MIME type (e.g., 'image/jpeg')
 * @returns true if valid
 * @throws BadRequestException if invalid
 */
export function validateFileContent(
  buffer: Buffer,
  expectedMimeType: string,
): boolean {
  if (!buffer || buffer.length === 0) {
    throw new BadRequestException('Файл пуст')
  }

  // Extract format from MIME type (e.g., 'image/jpeg' -> 'jpeg')
  const format = expectedMimeType.split('/')[1]?.toLowerCase()

  if (!format || !IMAGE_MAGIC_NUMBERS[format]) {
    // If format not in our list, skip magic number validation
    // (but MIME type validation should have caught invalid types)
    return true
  }

  const magicNumbers = IMAGE_MAGIC_NUMBERS[format]
  const fileHeader = Array.from(buffer.slice(0, 16)) // Read first 16 bytes

  // Check if file header matches any of the magic numbers for this format
  const isValid = magicNumbers.some((magic) => {
    if (fileHeader.length < magic.length) {
      return false
    }
    return magic.every((byte, index) => fileHeader[index] === byte)
  })

  // Special case for WebP: check for 'WEBP' after RIFF header
  if (format === 'webp' && isValid) {
    const webpHeader = buffer.slice(8, 12).toString('ascii')
    if (webpHeader !== 'WEBP') {
      throw new BadRequestException(
        'Файл не является действительным изображением WebP',
      )
    }
  }

  if (!isValid) {
    throw new BadRequestException(
      `Содержимое файла не соответствует заявленному типу (${expectedMimeType}). Возможна попытка загрузки вредоносного файла.`,
    )
  }

  return true
}

/**
 * Sanitize filename to prevent path traversal and other attacks
 * @param filename Original filename
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) {
    return 'file'
  }

  // Remove path traversal attempts
  let sanitized = filename
    .replace(/\.\./g, '') // Remove ..
    .replace(/\//g, '_') // Replace / with _
    .replace(/\\/g, '_') // Replace \ with _
    .replace(/[<>:"|?*]/g, '_') // Replace invalid Windows characters
    .trim()

  // Remove leading/trailing dots and spaces
  sanitized = sanitized.replace(/^[.\s]+|[.\s]+$/g, '')

  // Ensure filename is not empty
  if (!sanitized || sanitized.length === 0) {
    sanitized = 'file'
  }

  // Limit filename length
  if (sanitized.length > 255) {
    const ext = sanitized.substring(sanitized.lastIndexOf('.'))
    sanitized = sanitized.substring(0, 255 - ext.length) + ext
  }

  return sanitized
}

/**
 * Validate file size
 * @param size File size in bytes
 * @param maxSize Maximum size in bytes
 * @throws BadRequestException if file is too large
 */
export function validateFileSize(size: number, maxSize: number): void {
  if (size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2)
    throw new BadRequestException(
      `Размер файла превышает максимально допустимый размер (${maxSizeMB} MB)`,
    )
  }
}


