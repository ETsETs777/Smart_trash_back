import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager, In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import path from 'node:path';
import * as uuid from 'uuid';
import ContentDisposition from 'content-disposition';

import { S3Service } from './s3.service';

import { FileEntity } from 'src/entities/files/file.entity';
import { FileEndpoints } from '../endpoints/file.endpoints';
import { Readable } from 'stream';
import { streamToBuffer } from 'stream-to-buffer';
/**
 * Files service for uploading files to S3, creating file store entity, etc.
 */
@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);

  constructor(
    private readonly s3: S3Service,
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
  ) {}

  /**
   * Upload file to S3 and create FileStoreEntity.
   * @param fileName File name with extension.
   * @param buffer File content.
   * @param description File description if needed.
   * @return FileStoreEntity
   */
  async createFileStore(
    fileName: string,
    buffer: Buffer,
    description?: string,
  ): Promise<FileEntity> {
    const id = uuid.v4();
    const ext = path.extname(fileName);

    await this.s3
      .uploadFile(FileEndpoints.getS3ObjectKey({ id, ext }), buffer, {
        'Content-Disposition': ContentDisposition(fileName, {
          type: 'attachment',
        }),
      })
      .catch((error) => {
        this.logger.error(
          `Ошибка загрузки файла в S3, fileName: ${fileName} error: ${error.message}`,
          error.stack,
        );
        throw new InternalServerErrorException(
          'Не удалось загрузить файл в хранилище S3',
        );
      });

    const fileResult = await this.fileRepository
      .save({
        id,
        name: fileName,
        ext,
        description,
      })
      .catch((error) => {
        this.logger.error(
          `Ошибка сохранения файла в БД, fileName: ${fileName} error: ${error.message}`,
          error.stack,
        );
        throw new InternalServerErrorException(
          'Не удалось сохранить информацию о файле в базу данных',
        );
      });

    return fileResult;
  }

  async findOneByIdOrFail(id: string): Promise<FileEntity | null> {
    const file = await this.fileRepository.findOneByOrFail({ id }).catch(() => {
      this.logger.log(
        `(${this.findOneByIdOrFail.name}) FileEntity с id=${id} не найден`,
      );
      throw new NotFoundException(`FileEntity с id=${id} не найден`);
    });
    return file;
  }

  async getFileBuffer(fileUrl: string): Promise<Buffer> {
    const key = fileUrl.replace('/files/', '');
    const fileStream: Readable = await this.s3.getFileStream(key);
    return new Promise((resolve, reject) => {
      streamToBuffer(fileStream, (err, buffer) => {
        if (err) {
          this.logger.error(
            `Ошибка преобразования потока в буфер: ${err.message}`,
          );
          return reject(
            new InternalServerErrorException('Не удалось получить файл'),
          );
        }
        resolve(buffer);
      });
    });
  }

  async remove(fileIds: string[], manager?: EntityManager): Promise<void> {
    const fileRepository =
      manager?.getRepository(FileEntity) ?? this.fileRepository;

    const files = await fileRepository.find({
      where: {
        id: In(fileIds),
      },
    });

    await fileRepository.delete({
      id: In(fileIds),
    });

    // Генерация ключей для S3 и удаление
    const s3Keys = files.map((file) =>
      FileEndpoints.getS3ObjectKey({ id: file.id, ext: file.ext }),
    );

    if (s3Keys.length > 0) {
      await this.s3.removeFiles(s3Keys); // Удаляем только если есть ключи
    }
  }
}
