import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Logger,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';

import { FileService } from '../services/file.service';
import { S3Service } from '../services/s3.service';

import { FileEntity } from 'src/entities/files/file.entity';

import { IFileOrImageUploadBody } from '../interfaces/file-or-image-upload-body.interface';
import { FileEndpoints } from '../endpoints/file.endpoints';
import ContentDisposition from 'content-disposition';
import { Public } from 'src/decorators/auth/public.decorator';

@Controller(FileEndpoints.rootEndpoint)
export class FileController {
  private readonly logger = new Logger(FileController.name);

  constructor(
    private readonly fileService: FileService,
    private readonly s3: S3Service,
  ) {}

  /**
   * Upload a file.
   * @param file - Multer file object.
   * @param body - Request body.
   */
  @Post(FileEndpoints.childFileUpload)
  @UseInterceptors(FileInterceptor('file'))
  async fileUpload(
    @UploadedFile('file') file: Express.Multer.File,
    @Body() body: IFileOrImageUploadBody,
  ): Promise<FileEntity> {
    this.logger.log(
      `metod: ${this.fileUpload.name}: with body ${JSON.stringify(body)}`,
    );
    const fileName = body.filename || file.originalname;
    return this.fileService.createFileStore(
      fileName,
      file.buffer,
      body.description,
    );
  }

  /**
   * Download a file.
   * @param fileName - ID "<uuid>".
   * @param res - Express response object.
   */
  @Public()
  @Get(FileEndpoints.childGetFileStream)
  async getFileStream(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    this.logger.log(`metod: ${this.getFileStream.name}: with id ${id}`);

    const file = await this.fileService.findOneByIdOrFail(id);
    if (!file) {
      throw new NotFoundException(`Файл с id: ${id} не найден`);
    }
    const url = FileEndpoints.getS3ObjectKey(file);

    const fileStream = await this.s3.getFileStream(url).catch((error) => {
      if (error.code === 'NoSuchKey') {
        throw new NotFoundException(
          `Файл с id:${file.id} не найден в хранилище S3(minio).`,
        );
      } else {
        this.logger.error(
          `(${this.getFileStream.name}) при попытке получить файл из хранилища S3(minio) произошла ошибка: `,
          error,
        );
        throw new BadRequestException(
          'При попытке получить файл из хранилища S3(minio) произошла ошибка.',
        );
      }
    });

    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': ContentDisposition(file.name),
    });

    return new StreamableFile(fileStream);
  }
}
