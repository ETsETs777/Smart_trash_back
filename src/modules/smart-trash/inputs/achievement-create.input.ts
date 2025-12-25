import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { AchievementCriterionType } from 'src/entities/smart-trash/achievement-criterion.enum';
import { Sanitize, SanitizeRichText } from 'src/common/decorators/sanitize.decorator';

@InputType({
  description: 'Входные данные для создания ачивки в компании',
})
export class AchievementCreateInput {
  @Field(() => ID, {
    description: 'Идентификатор компании, для которой создаётся ачивка',
  })
  companyId: string;

  @Field(() => ID, {
    nullable: true,
    description:
      'Идентификатор администратора компании, создающего ачивку (опционально)',
  })
  createdByAdminId?: string | null;

  @Field({
    description: 'Название ачивки',
  })
  @Sanitize()
  title: string;

  @Field({
    description: 'Описание условия получения ачивки',
  })
  @SanitizeRichText()
  description: string;

  @Field(() => AchievementCriterionType, {
    description: 'Тип критерия, по которому будет выдана ачивка',
  })
  criterionType: AchievementCriterionType;

  @Field(() => Int, {
    description:
      'Пороговое значение критерия, при достижении которого сотрудник получает ачивку',
  })
  threshold: number;
}


