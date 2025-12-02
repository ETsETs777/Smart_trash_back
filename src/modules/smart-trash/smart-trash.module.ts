import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { FileModule } from 'src/modules/files/file.module';
import { GigachatModule } from 'src/modules/gigachat/gigachat.module';
import { CompanyEntity } from 'src/entities/smart-trash/company.entity';
import { CompanyAdminEntity } from 'src/entities/smart-trash/company-admin.entity';
import { EmployeeEntity } from 'src/entities/smart-trash/employee.entity';
import { CollectionAreaEntity } from 'src/entities/smart-trash/collection-area.entity';
import { CollectionAreaBinEntity } from 'src/entities/smart-trash/collection-area-bin.entity';
import { AchievementEntity } from 'src/entities/smart-trash/achievement.entity';
import { EmployeeAchievementEntity } from 'src/entities/smart-trash/employee-achievement.entity';
import { WastePhotoEntity } from 'src/entities/smart-trash/waste-photo.entity';
import { ImageEntity } from 'src/entities/files/image.entity';
import { CompanyAdminService } from './services/company-admin.service';
import { EmployeeService } from './services/employee.service';
import { CollectionAreaService } from './services/collection-area.service';
import { WastePhotoService } from './services/waste-photo.service';
import { WasteClassificationService } from './services/waste-classification.service';
import { AnalyticsService } from './analytics/analytics.service';
import { AchievementService } from './services/achievement.service';
import { WasteClassificationProcessor } from './queues/waste-classification.processor';
import { CompanyAdminResolver } from './resolvers/company-admin.resolver';
import { EmployeeResolver } from './resolvers/employee.resolver';
import { CollectionAreaResolver } from './resolvers/collection-area.resolver';
import { WastePhotoResolver } from './resolvers/waste-photo.resolver';
import { AnalyticsResolver } from './resolvers/analytics.resolver';
import { AchievementResolver } from './resolvers/achievement.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CompanyEntity,
      CompanyAdminEntity,
      EmployeeEntity,
      CollectionAreaEntity,
      CollectionAreaBinEntity,
      AchievementEntity,
      EmployeeAchievementEntity,
      WastePhotoEntity,
      ImageEntity,
    ]),
    BullModule.registerQueue({
      name: 'waste-classification',
    }),
    FileModule,
    GigachatModule,
  ],
  providers: [
    CompanyAdminService,
    EmployeeService,
    CollectionAreaService,
    WastePhotoService,
    WasteClassificationService,
    AchievementService,
    AnalyticsService,
    WasteClassificationProcessor,
    CompanyAdminResolver,
    EmployeeResolver,
    CollectionAreaResolver,
    WastePhotoResolver,
    AnalyticsResolver,
    AchievementResolver,
  ],
})
export class SmartTrashModule {}


