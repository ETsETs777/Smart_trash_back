import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Response } from 'express';
import { EntityManager, In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import ContentDisposition from 'content-disposition';

import sharp from 'sharp';
import * as uuid from 'uuid';

import { createHashMd5InHex } from '../utils/hash';
import { createImageAndAvatar, IfHeicThenConvertToJpeg } from '../utils/image';

import { S3Service } from './s3.service';

import { ImageEntity } from 'src/entities/files/image.entity';

import { IFileOrImageUploadBody } from '../interfaces/file-or-image-upload-body.interface';
import { ImageStoreUpdateInput } from '../inputs/image-store-update.input';
import { ImageEndpoints } from '../endpoints/image.endpoints';
import { Readable } from 'stream';

/**
 * Image service for uploading/updating images to S3, creating image store entity, etc.
 */
@Injectable()
export class ImageService {
  private readonly logger = new Logger(ImageService.name);

  constructor(
    private readonly s3: S3Service,
    @InjectRepository(ImageEntity)
    private readonly imageRepository: Repository<ImageEntity>,
  ) {}

  /**
   * Get image from S3 and send to client.
   * @param id - imageId "<uuid>".
   * @param res - Express response object.
   * @param args - Additional arguments.
   */
  public async imageGet(
    id: string,
    res: Response,
    args: { wantAvatar?: boolean; doDownload?: boolean } = {},
  ): Promise<void> {
    const image = await this.imageRepository
      .findOneByOrFail({ id: id })
      .catch(() => {
        this.logger.log(
          `(${this.imageGet.name}) Изображение с id=${id} не найден`,
        );
        throw new NotFoundException(`Изображение с id=${id} не найден`);
      });

    const s3key = ImageEndpoints.imageGetS3Key(image.id, args.wantAvatar);

    if (args.doDownload) {
      const stream = await this.s3.createStream(s3key).catch((error) => {
        this.logger.error(
          `(${this.imageGet.name}) Не удалось создать Stream из S3 хранилище для скачивания файла с id=${id}, error:`,
          error.message,
          error.stack,
        );
        throw new InternalServerErrorException(
          `Не удалось создать Stream из S3 хранилище для скачивания файла с id=${id}`,
        );
      });

      stream.pipe(res);
      res.setHeader(
        'Content-Disposition',
        ContentDisposition(image.name, { type: 'attachment' }),
      );
      res.setHeader('Content-Type', 'image/jpeg');
    } else {
      const presignedUrl = await this.s3
        .getPresignedUrl(s3key)
        .catch((error) => {
          this.logger.error(
            `(${this.imageGet.name}) Не получить подписаный url для S3 хранилище для файла с id=${id}, error:`,
            error.message,
            error.stack,
          );
          throw new InternalServerErrorException(
            `Не получить подписаный url для S3 хранилище для файла с id=${id}`,
          );
        });

      res.redirect(presignedUrl);
    }
  }

  /**
   * Update image to S3 and save image metadata to database.
   * @param file - Multer file object.
   * @param body - Request body.
   * @param id - "<uuid>".
   * @param angle - Image rotation angle in degrees. "90", "135", "270".
   * @param md5 - MD5 checksum of the image.
   */
  public async update({
    file,
    body,
    imageId,
    angle,
    md5,
  }: {
    file: Express.Multer.File;
    body: IFileOrImageUploadBody;
    imageId?: string;
    angle?: string | number;
    md5?: string;
  }): Promise<ImageEntity> {
    const checksum = md5 || createHashMd5InHex(file.buffer);

    // Image ID is UUID without ext.
    const id = imageId ? imageId : uuid.v4();

    angle = Number(angle || 0);
    if (!Number.isFinite(angle)) {
      throw new BadRequestException(
        `Некорректное числовое значение для параметра angle. Значение должно быть конечным числом.`,
      );
    }

    if (imageId) {
      const ThrowNotFound = () => {
        throw new NotFoundException(`Изображение с id=${id} не найден`);
      };

      const count = await this.imageRepository
        .countBy({ id })
        .catch(() => ThrowNotFound());
      if (count === 0) ThrowNotFound();
    } else {
      // Image upload, return existed image if checksum is same.
      const existedImage = await this.imageRepository.findOneBy({ checksum });
      if (existedImage) {
        this.logger.log(
          `(${this.update.name}) Найдено уже существующие изображение с checksum=${checksum}`,
        );
        return existedImage;
      }
    }

    const fileOriginalName = body.filename || file.originalname;

    const originBuffer = await IfHeicThenConvertToJpeg({
      fileName: fileOriginalName,
      buffer: file.buffer,
    }).catch((error) => {
      this.logger.error(
        `(${this.update.name}) Не удалось конвертировать изображение в Jpeg c id=${id} error: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Не удалось конвертировать изображение в Jpeg c id=${id}`,
      );
    });

    const { bufferImage, bufferAvatar } = await createImageAndAvatar({
      buffer: originBuffer,
      angle,
    }).catch((error) => {
      this.logger.error(
        `(${this.update.name}) Не удалось создать аватар для изображение c id=${id} error: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Не удалось создать аватар для изображение c id=${id}`,
      );
    });

    const metadata = await sharp(bufferImage).metadata();
    const s3Key = ImageEndpoints.imageGetS3Key(id);
    const s3AvatarKey = ImageEndpoints.imageGetS3Key(id, true);

    await this.s3
      .uploadFile(s3Key, bufferImage, {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': ContentDisposition(fileOriginalName, {
          type: 'inline',
        }),
      })
      .catch((error) => {
        this.logger.error(
          `(${this.update.name}) Не удалось загрузить изображение в хранилище S3 c id=${id} error: ${error.message}`,
          error.stack,
        );
        throw new InternalServerErrorException(
          `Не удалось загрузить изображение в хранилище S3 c id=${id}`,
        );
      });

    await this.s3
      .uploadFile(s3AvatarKey, bufferAvatar, {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': ContentDisposition(
          `avatar_${fileOriginalName}`,
          { type: 'inline' },
        ),
      })
      .catch((error) => {
        this.logger.error(
          `(${this.update.name}) Не удалось загрузки аватар изображение в хранилище S3 с id=${id} error: ${error.message}`,
          error.stack,
        );
        throw new InternalServerErrorException(
          `Не удалось загрузить аватар изображение в хранилище S3 c id=${id}`,
        );
      });

    const imageUpdated = await this.imageRepository
      .save({
        id: id,
        name: fileOriginalName,
        ext: '.jpg',
        description: body.description,
        width: metadata.width,
        height: metadata.height,
        checksum,
      })
      .catch((error) => {
        this.logger.error(
          `(${this.update.name}) Не удалось обновить изображение c id=${id} error: ${error.message}`,
          error.stack,
        );
        throw new InternalServerErrorException(
          `Не удалось обновить изображение c id=${id}`,
        );
      });

    return imageUpdated;
  }

  /**
   * Upload image to S3 and save image metadata to database.
   * @param file - Multer file object.
   * @param body - Request body.
   */
  public async add({
    file,
    body: imageMeta,
  }: {
    file: Express.Multer.File;
    body: IFileOrImageUploadBody;
  }): Promise<ImageEntity> {
    const checksum = createHashMd5InHex(file.buffer);

    // Image ID in UUID.
    const id = uuid.v4();

    // Image upload, return existed image if checksum is same.
    const existedImage = await this.imageRepository.findOneBy({ checksum });
    if (existedImage) {
      this.logger.log(
        `(${this.add.name}) Найдено уже существующие изображение с checksum=${checksum}`,
      );
      return existedImage;
    }

    const fileOriginalName = imageMeta.filename || file.originalname;

    try {
      const originBuffer = await IfHeicThenConvertToJpeg({
        fileName: fileOriginalName,
        buffer: file.buffer,
      });

      const { bufferImage, bufferAvatar } = await createImageAndAvatar({
        buffer: originBuffer,
      });

      const metadata = await sharp(bufferImage).metadata();
      const s3Key = ImageEndpoints.imageGetS3Key(id);
      const s3AvatarKey = ImageEndpoints.imageGetS3Key(id, true);
      await Promise.all([
        this.s3.uploadFile(s3Key, bufferImage, {
          'Content-Type': 'image/jpeg',
          'Content-Disposition': ContentDisposition(fileOriginalName, {
            type: 'inline',
          }),
        }),
        this.s3.uploadFile(s3AvatarKey, bufferAvatar, {
          'Content-Type': 'image/jpeg',
          'Content-Disposition': ContentDisposition(
            `avatar_${fileOriginalName}`,
            { type: 'inline' },
          ),
        }),
        this.imageRepository.insert({
          id,
          name: fileOriginalName,
          ext: '.jpg',
          description: imageMeta.description,
          width: metadata.width,
          height: metadata.height,
          checksum,
        }),
      ]);
      return await this.imageRepository.findOneByOrFail({ id });
    } catch (error) {
      this.logger.error(
        `(${this.add.name}) Не удалось добавить изображение с fileOriginalName=${fileOriginalName} error: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Не удалось добавить изображение с fileOriginalName=${fileOriginalName}`,
      );
    }
  }

  /**
   * Updates the image store in the database
   * @param input - ImageStoreUpdateInput
   * @returns ImageStoreEntity
   */
  async updateVisible({
    id,
    isVisible,
  }: ImageStoreUpdateInput): Promise<ImageEntity> {
    const result = await this.imageRepository.update({ id }, { isVisible });
    if (result.affected !== 1) {
      throw new NotFoundException(`Изображение с id=${id} не найдено`);
    }
    const image = await this.imageRepository.findOneBy({ id });
    if (!image) {
      throw new NotFoundException(
        `Изображение с id=${id} не найдено после обновления`,
      );
    }
    return image;
  }

  /**
   * Gets a stream of an image from S3.
   * @param id - Image ID
   * @returns A Readable stream of the image.
   */
  async getImageStream(id: string): Promise<Readable> {
    const image = await this.imageRepository.findOneByOrFail({ id });
    const s3key = ImageEndpoints.imageGetS3Key(image.id);

    try {
      return await this.s3.createStream(s3key);
    } catch (error) {
      this.logger.error(
        `(${this.getImageStream.name}) Не удалось создать Stream из S3 для изображения с id=${id}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Не удалось создать Stream из S3 для изображения с id=${id}`,
      );
    }
  }

  async getImageBuffer(id: string): Promise<Buffer> {
    const stream = await this.getImageStream(id);
    const streamToBuffer = (await import('stream-to-buffer')).default;

    return new Promise<Buffer>((resolve, reject) => {
      streamToBuffer(stream, (err: Error | null, buffer: Buffer) => {
        if (err) {
          this.logger.error(
            `(${this.getImageBuffer.name}) Не удалось преобразовать Stream в Buffer для изображения с id=${id}: ${err.message}`,
            err.stack,
          );
          return reject(
            new InternalServerErrorException(
              `Не удалось преобразовать Stream в Buffer для изображения с id=${id}`,
            ),
          );
        }
        resolve(buffer);
      });
    });
  }

  async remove(imageIds: string[], manager?: EntityManager): Promise<void> {
    const imageRepository =
      manager?.getRepository(ImageEntity) ?? this.imageRepository;

    await imageRepository.delete({
      id: In(imageIds),
    });

    const s3Keys = imageIds.flatMap((id) => [
      ImageEndpoints.imageGetS3Key(id),
      ImageEndpoints.imageGetS3Key(id, true),
    ]);

    if (s3Keys.length > 0) {
      await this.s3.removeFiles(s3Keys); // Удаляем только если есть ключи
    }
  }
}
