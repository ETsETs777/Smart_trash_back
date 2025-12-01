import { Injectable, Logger } from '@nestjs/common';
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
export class S3Service {
  private readonly logger = new Logger(S3Service.name);

  private readonly minio: Client;

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
    return this.minio.putObject(
      this.configService.config.s3.bucketName,
      key,
      buffer,
      metadata,
    );
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
    return this.minio.getObject(this.configService.config.s3.bucketName, key);
  }

  /**
   * Returns a presigned URL to the object identified by key.
   * @param key - file path in the bucket
   * @return Presigned URL
   */
  async getPresignedUrl(key: string): Promise<string> {
    return this.minio.presignedGetObject(
      this.configService.config.s3.bucketName,
      key,
      this.configService.config.s3.presignedUrlExpiration,
    );
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
