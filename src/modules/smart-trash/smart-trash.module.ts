import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { FileModule } from 'src/modules/files/file.module';
import { GigachatModule } from 'src/modules/gigachat/gigachat.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { CompanyEntity } from 'src/entities/smart-trash/company.entity';
import { UserEntity } from 'src/entities/smart-trash/user.entity';
import { CollectionAreaEntity } from 'src/entities/smart-trash/collection-area.entity';
import { CollectionAreaBinEntity } from 'src/entities/smart-trash/collection-area-bin.entity';
import { AchievementEntity } from 'src/entities/smart-trash/achievement.entity';
import { EmployeeAchievementEntity } from 'src/entities/smart-trash/employee-achievement.entity';
import { WastePhotoEntity } from 'src/entities/smart-trash/waste-photo.entity';
import { DailyChallengeEntity } from 'src/entities/smart-trash/daily-challenge.entity';
import { DailyChallengeProgressEntity } from 'src/entities/smart-trash/daily-challenge-progress.entity';
import { SeasonalEventEntity } from 'src/entities/smart-trash/seasonal-event.entity';
import { TeamCompetitionEntity } from 'src/entities/smart-trash/team-competition.entity';
import { TeamCompetitionParticipantEntity } from 'src/entities/smart-trash/team-competition-participant.entity';
import { ImageEntity } from 'src/entities/files/image.entity';
import { CollectionAreaService } from './services/collection-area.service';
import { CollectionAreaBinService } from './services/collection-area-bin.service';
import { WastePhotoService } from './services/waste-photo.service';
import { WasteClassificationService } from './services/waste-classification.service';
import { AnalyticsService } from './analytics/analytics.service';
import { AchievementService } from './services/achievement.service';
import { GamificationService } from './services/gamification.service';
import { WasteClassificationProcessor } from './queues/waste-classification.processor';
import { EmployeeResolver } from './resolvers/employee.resolver';
import { CollectionAreaResolver } from './resolvers/collection-area.resolver';
import { CollectionAreaBinResolver } from './resolvers/collection-area-bin.resolver';
import { WastePhotoResolver } from './resolvers/waste-photo.resolver';
import { AnalyticsResolver } from './resolvers/analytics.resolver';
import { AchievementResolver } from './resolvers/achievement.resolver';
import { BarcodeResolver } from './resolvers/barcode.resolver';
import { CompanyService } from './services/company.service';
import { CompanyResolver } from './resolvers/company.resolver';
import { UserService } from './services/user.service';
import { UserResolver } from './resolvers/user.resolver';
import { EmployeeService } from './services/employee.service';
import { PubSubService } from 'src/common/pubsub/pubsub.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CompanyEntity,
      UserEntity,
      CollectionAreaEntity,
      CollectionAreaBinEntity,
      AchievementEntity,
      EmployeeAchievementEntity,
      WastePhotoEntity,
      DailyChallengeEntity,
      DailyChallengeProgressEntity,
      SeasonalEventEntity,
      TeamCompetitionEntity,
      TeamCompetitionParticipantEntity,
      ImageEntity,
    ]),
    BullModule.registerQueue({
      name: 'waste-classification',
    }),
    FileModule,
    GigachatModule,
    AuthModule,
  ],
  providers: [
    CompanyService,
    UserService,
    EmployeeService,
    CollectionAreaService,
    CollectionAreaBinService,
    WastePhotoService,
    WasteClassificationService,
    AchievementService,
    GamificationService,
    AnalyticsService,
    WasteClassificationProcessor,
    CollectionAreaResolver,
    CollectionAreaBinResolver,
    WastePhotoResolver,
    AnalyticsResolver,
    AchievementResolver,
    CompanyResolver,
    UserResolver,
    EmployeeResolver,
    BarcodeResolver,
    PubSubService,
  ],
  exports: [PubSubService],
})
export class SmartTrashModule {}


