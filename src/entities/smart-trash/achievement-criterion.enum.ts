import { registerEnumType } from '@nestjs/graphql';

export enum AchievementCriterionType {
  TOTAL_PHOTOS = 'TOTAL_PHOTOS',
  CORRECT_BIN_MATCHES = 'CORRECT_BIN_MATCHES',
  STREAK_DAYS = 'STREAK_DAYS',
}

registerEnumType(AchievementCriterionType, {
  name: 'AchievementCriterionType',
  description: 'Тип критерия, по которому выдаётся ачивка сотруднику',
});


