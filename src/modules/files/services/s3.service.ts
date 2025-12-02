import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Readable } from 'node:stream';
import {
  BucketItem,
  Client,
  ItemBucketMetadata,
  UploadedObjectInfo,
} from 'minio';
import { ConfigService } from 'src/modules/config/config.service';
import { NodeEnv } from 'src/modules/config/node-env.enum';

/**
 * Service for interacting with S3 object storage.
 */
@Injectable()
export class S3Service implements OnModuleInit {
  private readonly logger = new Logger(S3Service.name);

  private readonly minio: Client;
  private bucketInitialized = false;

  constructor(private readonly configService: ConfigService) {
    const config = this.configService.config;
    if (!config.s3.endPoint) {
      throw new Error('Отсутствует переменная конфигурации S3_ENDPOINT');
    }
    if (!config.s3.port) {
      throw new Error('Отсутствует переменная конфигурации S3_PORT');
    }
    if (!config.s3.accessKey) {
      throw new Error('Отсутствует переменная конфигурации S3_ACCESS_KEY');
    }
    if (!config.s3.secretKey) {
      throw new Error('Отсутствует переменная конфигурации S3_SECRET_KEY');
    }
    this.minio = new Client({
      endPoint: config.s3.endPoint,
      port: config.s3.port,
      accessKey: config.s3.accessKey,
      secretKey: config.s3.secretKey,
      useSSL: config.nodeEnv !== NodeEnv.Test && config.nodeEnv !== NodeEnv.Dev,
    });
  }

  async onModuleInit(): Promise<void> {
    await this.initializeBucket();
  }

  private async initializeBucket(): Promise<void> {
    if (this.bucketInitialized) {
      return;
    }

    try {
      const bucketName = this.configService.config.s3.bucketName;
      let retries = 5;
      let exists = false;

      while (retries > 0 && !exists) {
        try {
          exists = await this.minio.bucketExists(bucketName);
          break;
        } catch (error) {
          retries--;
          this.logger.warn(
            `Попытка проверить существование bucket "${bucketName}" не удалась. Осталось попыток: ${retries}`,
          );
          if (retries > 0) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
        }
      }

      if (!exists) {
        await this.minio.makeBucket(bucketName);
        this.logger.log(`Bucket "${bucketName}" успешно создан`);
      } else {
        this.logger.log(`Bucket "${bucketName}" уже существует`);
      }

      this.bucketInitialized = true;
    } catch (error) {
      this.logger.error(
        `Не удалось инициализировать bucket: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Uploads a file to the bucket.
   * @param buffer - file buffer.
   * @param key - file path in the bucket.
   * @param metadata - file metadata.
   * @return UploadedObjectInfo - info about uploaded object.
   */
  async uploadFile(
    key: string,
    buffer: Buffer,
    metadata?: ItemBucketMetadata,
  ): Promise<UploadedObjectInfo> {
    try {
      await this.ensureBucketExists();
      const result = await this.minio.putObject(
        this.configService.config.s3.bucketName,
        key,
        buffer,
        metadata,
      );
      this.logger.log(`Файл успешно загружен: ${key}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Ошибка загрузки файла ${key}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private async ensureBucketExists(): Promise<void> {
    if (!this.bucketInitialized) {
      await this.initializeBucket();
    }
  }

  /**
   * Checks if a file exists in the bucket.
   * @param key - file path in the bucket.
   */
  async isFileExists(key: string): Promise<boolean> {
    try {
      await this.minio.statObject(this.configService.config.s3.bucketName, key);
      return true;
    } catch (error) {
      this.logger.error(error);
      return false;
    }
  }

  /**
   * Removes a file from the bucket.
   * @param key
   */
  async removeFile(key: string): Promise<void> {
    await this.minio.removeObject(this.configService.config.s3.bucketName, key);
  }

  /**
   * Removes files from the bucket.
   * @param key
   */
  async removeFiles(keys: string[]): Promise<void> {
    await this.minio.removeObjects(
      this.configService.config.s3.bucketName,
      keys,
    );
  }

  /**
   * Creates a readable stream to the object identified by key.
   * Usage:
   *  1. import type { Response } from Express
   *  2. @Res() res: Response
   *  3. stream.pipe(res)
   * @param key - file path in the bucket
   * @return Readable stream
   */
  async createStream(key: string): Promise<Readable> {
    try {
      const exists = await this.isFileExists(key);
      if (!exists) {
        throw new Error(`Файл с ключом "${key}" не найден в bucket`);
      }
      return await this.minio.getObject(this.configService.config.s3.bucketName, key);
    } catch (error) {
      this.logger.error(
        `Ошибка создания stream для ${key}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Returns a presigned URL to the object identified by key.
   * @param key - file path in the bucket
   * @return Presigned URL
   */
  async getPresignedUrl(key: string): Promise<string> {
    try {
      const exists = await this.isFileExists(key);
      if (!exists) {
        throw new Error(`Файл с ключом "${key}" не найден в bucket`);
      }
      return await this.minio.presignedGetObject(
        this.configService.config.s3.bucketName,
        key,
        this.configService.config.s3.presignedUrlExpiration,
      );
    } catch (error) {
      this.logger.error(
        `Ошибка получения presigned URL для ${key}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getFileStream(key: string): Promise<Readable> {
    const fileStream = await this.minio.getObject(
      this.configService.config.s3.bucketName,
      key,
    );
    return fileStream;
  }

  /**
   * Returns a list of objects in the bucket.
   * @param args - prefix and recursive flag.
   */
  async listObjects(
    args: { prefix?: string; recursive?: boolean } = {},
  ): Promise<BucketItem[]> {
    const stream = this.minio.listObjectsV2(
      this.configService.config.s3.bucketName,
      args.prefix ?? '',
      args.recursive ?? true,
    );
    const files: BucketItem[] = [];
    for await (const file of stream) {
      files.push(file);
    }
    return files;
  }
}
