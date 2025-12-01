import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import assert from 'src/common/assert';

@Injectable()
export class ImageMIMETypeValidator implements PipeTransform {
  constructor(private readonly mimeTypes: string[]) {
    assert(
      mimeTypes.length > 0,
      new Error('ImageMIMETypeValidator должен иметь хотя бы один тип MIME'),
    );
  }

  transform(file: Express.Multer.File): Express.Multer.File {
    if (!file) {
      throw new BadRequestException(
        `[${ImageMIMETypeValidator.name}]: Файл не был загружен`,
      );
    }

    // Проверка того что загружаемый файл является изображением
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException(
        'Загружаемый файл не является изображением',
      );
    }

    const format = file.mimetype.split('/')[1];
    if (!this.mimeTypes.includes(format)) {
      throw new BadRequestException(
        `Данный формат (${format}) изображения не поддерживается. Поддерживаются форматы изображений: ${this.mimeTypes.join(', ')}`,
      );
    }

    return file;
  }
}
