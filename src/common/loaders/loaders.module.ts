import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/entities/smart-trash/user.entity';
import { CompanyEntity } from 'src/entities/smart-trash/company.entity';
import { ImageEntity } from 'src/entities/files/image.entity';
import { UserLoader } from './user.loader';
import { CompanyLoader } from './company.loader';
import { ImageLoader } from './image.loader';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, CompanyEntity, ImageEntity]),
  ],
  providers: [UserLoader, CompanyLoader, ImageLoader],
  exports: [UserLoader, CompanyLoader, ImageLoader],
})
export class LoadersModule {}

