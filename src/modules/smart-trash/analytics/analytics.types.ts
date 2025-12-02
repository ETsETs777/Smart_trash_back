import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { TrashBinType } from 'src/entities/smart-trash/trash-bin-type.enum';
import { EmployeeEntity } from 'src/entities/smart-trash/employee.entity';
import { CollectionAreaEntity } from 'src/entities/smart-trash/collection-area.entity';

@ObjectType({
  description:
    'Агрегированная статистика использования контейнеров по типам для компании',
})
export class CompanyBinUsageStats {
  @Field(() => TrashBinType, {
    description: 'Тип контейнера для мусора',
  })
  binType: TrashBinType;

  @Field(() => Int, {
    description: 'Количество классификаций мусора в этот тип контейнера',
  })
  count: number;
}

@ObjectType({
  description:
    'Запись в таблице лидеров компании по количеству правильно утилизированного мусора',
})
export class CompanyLeaderboardEntry {
  @Field(() => EmployeeEntity, {
    description: 'Сотрудник компании',
  })
  employee: EmployeeEntity;

  @Field(() => Int, {
    description:
      'Количество фотографий мусора, успешно классифицированных для этого сотрудника',
  })
  totalClassifiedPhotos: number;
}

@ObjectType({
  description:
    'Статистика по конкретной области сбора мусора внутри компании',
})
export class CollectionAreaStats {
  @Field(() => CollectionAreaEntity, {
    description: 'Область сбора мусора',
  })
  area: CollectionAreaEntity;

  @Field(() => Int, {
    description: 'Общее количество фотографий мусора в этой области',
  })
  totalPhotos: number;
}

@ObjectType({
  description:
    'Общая аналитика по компании: использование контейнеров, таблица лидеров, области сбора и доска почёта',
})
export class CompanyAnalyticsSummary {
  @Field(() => ID, {
    description: 'Идентификатор компании, для которой рассчитана аналитика',
  })
  companyId: string;

  @Field(() => [CompanyBinUsageStats], {
    description: 'Статистика использования разных типов контейнеров',
  })
  binUsage: CompanyBinUsageStats[];

  @Field(() => [CompanyLeaderboardEntry], {
    description: 'Текущая таблица лидеров компании по количеству утилизаций',
  })
  leaderboard: CompanyLeaderboardEntry[];

  @Field(() => [CompanyLeaderboardEntry], {
    description:
      'Доска почёта компании – лучшие сотрудники за весь период по количеству утилизаций',
  })
  hallOfFame: CompanyLeaderboardEntry[];

  @Field(() => [CollectionAreaStats], {
    description: 'Статистика по областям сбора мусора',
  })
  areas: CollectionAreaStats[];
}


