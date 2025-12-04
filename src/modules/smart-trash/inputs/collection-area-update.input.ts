import { Field, ID, InputType } from '@nestjs/graphql';

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
  name?: string | null;

  @Field(() => String, {
    nullable: true,
    description: 'Описание или дополнительные детали области сбора',
  })
  description?: string | null;
}

