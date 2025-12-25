import { Field, ID, InputType } from '@nestjs/graphql';
import { Sanitize, SanitizeRichText } from 'src/common/decorators/sanitize.decorator';

@InputType({
  description: 'Входные данные для обновления области сбора мусора',
})
export class CollectionAreaUpdateInput {
  @Field(() => ID, {
    description: 'Идентификатор области сбора',
  })
  id: string;

  @Field(() => String, {
    nullable: true,
    description: 'Название области сбора мусора',
  })
  @Sanitize()
  name?: string | null;

  @Field(() => String, {
    nullable: true,
    description: 'Описание или дополнительные детали области сбора',
  })
  @SanitizeRichText()
  description?: string | null;
}

