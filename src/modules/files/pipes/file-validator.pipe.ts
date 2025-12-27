import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { validateFileSize, sanitizeFilename } from '../utils/file-content-validator';

@Injectable()
export class FileValidatorPipe implements PipeTransform {
  private readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  transform(file: Express.Multer.File): Express.Multer.File {
    if (!file) {
      throw new BadRequestException('Файл не был загружен');
    }

    // Validate file size
    validateFileSize(file.size, this.MAX_FILE_SIZE);

    // Sanitize filename
    if (file.originalname) {
      file.originalname = sanitizeFilename(file.originalname);
    }

    return file;
  }
}

import { validateFileSize, sanitizeFilename } from '../utils/file-content-validator';

@Injectable()
export class FileValidatorPipe implements PipeTransform {
  private readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  transform(file: Express.Multer.File): Express.Multer.File {
    if (!file) {
      throw new BadRequestException('Файл не был загружен');
    }

    // Validate file size
    validateFileSize(file.size, this.MAX_FILE_SIZE);

    // Sanitize filename
    if (file.originalname) {
      file.originalname = sanitizeFilename(file.originalname);
    }

    return file;
  }
}

import { validateFileSize, sanitizeFilename } from '../utils/file-content-validator';

@Injectable()
export class FileValidatorPipe implements PipeTransform {
  private readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  transform(file: Express.Multer.File): Express.Multer.File {
    if (!file) {
      throw new BadRequestException('Файл не был загружен');
    }

    // Validate file size
    validateFileSize(file.size, this.MAX_FILE_SIZE);

    // Sanitize filename
    if (file.originalname) {
      file.originalname = sanitizeFilename(file.originalname);
    }

    return file;
  }
}


