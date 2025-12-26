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
];

export default Entities;
