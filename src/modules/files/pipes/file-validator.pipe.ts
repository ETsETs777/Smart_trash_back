import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { validateFileSize, sanitizeFilename, validateFileContent } from '../utils/file-content-validator';

@Injectable()
export class FileValidatorPipe implements PipeTransform {
  private readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  private readonly ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
  ];

  transform(file: Express.Multer.File): Express.Multer.File {
    if (!file) {
      throw new BadRequestException('Файл не был загружен');
    }

    // Validate file size
    validateFileSize(file.size, this.MAX_FILE_SIZE);

    // Validate MIME type
    if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Тип файла ${file.mimetype} не разрешен. Разрешенные типы: ${this.ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }

    // Validate file content using magic numbers (if buffer is available)
    if (file.buffer && file.mimetype) {
      try {
        validateFileContent(file.buffer, file.mimetype);
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw error;
        }
        throw new BadRequestException('Не удалось проверить содержимое файла');
      }
    }

    // Sanitize filename
    if (file.originalname) {
      file.originalname = sanitizeFilename(file.originalname);
    }

    return file;
  }
}



