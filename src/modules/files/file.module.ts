import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ImageService } from './services/image.service';
import { FileService } from './services/file.service';
import { S3Service } from './services/s3.service';

import { ImageController } from './controllers/image.controller';
import { FileController } from './controllers/file.controller';

import { ImageResolver } from './resolvers/image.resolver';

import { FileEntity } from 'src/entities/files/file.entity';
import { ImageEntity } from 'src/entities/files/image.entity';

@Module({
  controllers: [ImageController, FileController],
  imports: [TypeOrmModule.forFeature([FileEntity, ImageEntity])],
  providers: [S3Service, ImageService, FileService, ImageResolver],
  exports: [FileService, ImageService, S3Service],
})
export class FileModule {}
