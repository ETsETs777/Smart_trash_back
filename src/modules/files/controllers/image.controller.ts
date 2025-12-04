import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Logger,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseUUIDPipe,
  PipeTransform,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';

import { ImageService } from '../services/image.service';

import { ImageEntity } from 'src/entities/files/image.entity';

import { IFileOrImageUploadBody } from '../interfaces/file-or-image-upload-body.interface';
import { ImageEndpoints } from '../endpoints/image.endpoints';
import { ImageMIMETypeValidator } from '../pipes/ImageMIMETypeValidator.pipe';
import { Public } from 'src/decorators/auth/public.decorator';

@Controller(ImageEndpoints.rootEndpoint)
export class ImageController {
  private readonly logger = new Logger(ImageController.name);

  private static readonly MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MiB

  private static readonly ALLOWED_IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'gif'];

  private static readonly IMAGE_PIPES: PipeTransform[] = [
    new ParseFilePipe({
      validators: [
        new MaxFileSizeValidator({
          maxSize: ImageController.MAX_IMAGE_SIZE,
          message: 'Размер изображения не должен превышать 10MiB',
        }),
      ],
      errorHttpStatusCode: HttpStatus.PAYLOAD_TOO_LARGE,
    }),
    new ImageMIMETypeValidator(ImageController.ALLOWED_IMAGE_FORMATS),
  ];

  constructor(private readonly imageService: ImageService) {}

  /**
   * View an image.
   * @param id - ID "<uuid>".
   * @param res - Express response object.
   */
  @Public()
  @Get(ImageEndpoints.childImageView)
  async imageView(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.log(`[${this.imageView.name}]: ${id}`);
    await this.imageService.imageGet(id, res);
  }

  /**
   * Download an image.
   * @param id - ID "<uuid>".
   * @param res - Express response object.
   */
  @Public()
  @Get(ImageEndpoints.childImageDownload)
  async imageDownload(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.log(`[${this.imageDownload.name}]: ${id}`);
    await this.imageService.imageGet(id, res, { doDownload: true });
  }

  /**
   * View an avatar.
   * @param id - ID "<uuid>".
   * @param res - Express response object.
   */
  @Public()
  @Get(ImageEndpoints.childAvatarGet)
  async avatarGet(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.log(`[${this.avatarGet.name}]: ${id}`);
    await this.imageService.imageGet(id, res, { wantAvatar: true });
  }

  /**
   * Upload an image, avatar creates automatically.
   * @param file - Multer file object.
   * @param body - Request body.
   * @return ImageStoreEntity.
   */
  @Post(ImageEndpoints.childImageUpload)
  @Public()
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile('file', ...ImageController.IMAGE_PIPES)
    file: Express.Multer.File,
    @Body() body: IFileOrImageUploadBody,
  ): Promise<ImageEntity> {
    this.logger.log(`uploadImage: ${file.originalname}`);
    return this.imageService.add({ file, body });
  }

  /**
   * Update an image.
   * @param file - Multer file object.
   * @param body - Request body.
   * @param id - ID "<uuid>".
   * @param angle - Image rotation angle in degrees. "90", "135", "270".
   * @return ImageStoreEntity.
   */
  @Post(ImageEndpoints.childImageUpdate)
  @UseInterceptors(FileInterceptor('file'))
  async updateImage(
    @UploadedFile('file', ...ImageController.IMAGE_PIPES)
    file: Express.Multer.File,
    @Body() body: IFileOrImageUploadBody,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('angle') angle?: string,
  ): Promise<ImageEntity> {
    this.logger.log(`updateImage: ${id}`);
    return this.imageService.update({
      file,
      body,
      imageId: id,
      angle,
    });
  }
}
