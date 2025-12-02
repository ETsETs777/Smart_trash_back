import { FileEntity } from './files/file.entity';
import { ImageEntity } from './files/image.entity';
import { CompanyEntity } from './smart-trash/company.entity';
import { CompanyAdminEntity } from './smart-trash/company-admin.entity';
import { EmployeeEntity } from './smart-trash/employee.entity';
import { CollectionAreaEntity } from './smart-trash/collection-area.entity';
import { CollectionAreaBinEntity } from './smart-trash/collection-area-bin.entity';
import { AchievementEntity } from './smart-trash/achievement.entity';
import { EmployeeAchievementEntity } from './smart-trash/employee-achievement.entity';
import { WastePhotoEntity } from './smart-trash/waste-photo.entity';

const Entities = [
  FileEntity,
  ImageEntity,
  CompanyEntity,
  CompanyAdminEntity,
  EmployeeEntity,
  CollectionAreaEntity,
  CollectionAreaBinEntity,
  AchievementEntity,
  EmployeeAchievementEntity,
  WastePhotoEntity,
];

export default Entities;
