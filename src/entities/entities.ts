import { FileEntity } from './files/file.entity';
import { ImageEntity } from './files/image.entity';
import { CompanyEntity } from './smart-trash/company.entity';
import { UserEntity } from './smart-trash/user.entity';
import { CollectionAreaEntity } from './smart-trash/collection-area.entity';
import { CollectionAreaBinEntity } from './smart-trash/collection-area-bin.entity';
import { AchievementEntity } from './smart-trash/achievement.entity';
import { EmployeeAchievementEntity } from './smart-trash/employee-achievement.entity';
import { WastePhotoEntity } from './smart-trash/waste-photo.entity';
import { LoginAttemptEntity } from './security/login-attempt.entity';
import { DailyChallengeEntity } from './smart-trash/daily-challenge.entity';
import { DailyChallengeProgressEntity } from './smart-trash/daily-challenge-progress.entity';
import { SeasonalEventEntity } from './smart-trash/seasonal-event.entity';
import { TeamCompetitionEntity } from './smart-trash/team-competition.entity';
import { TeamCompetitionParticipantEntity } from './smart-trash/team-competition-participant.entity';

const Entities = [
  FileEntity,
  ImageEntity,
  CompanyEntity,
  UserEntity,
  CollectionAreaEntity,
  CollectionAreaBinEntity,
  AchievementEntity,
  EmployeeAchievementEntity,
  WastePhotoEntity,
  LoginAttemptEntity,
  DailyChallengeEntity,
  DailyChallengeProgressEntity,
  SeasonalEventEntity,
  TeamCompetitionEntity,
  TeamCompetitionParticipantEntity,
];

export default Entities;
