import { Field, ID, InputType } from '@nestjs/graphql';
import { TrashBinType } from 'src/entities/smart-trash/trash-bin-type.enum';

@InputType({
  description:
    'Входные данные для создания области сбора мусора и указания доступных типов контейнеров',
})
export class CollectionAreaCreateInput {
  @Field(() => ID, {
    description: 'Идентификатор компании, для которой создаётся область сбора',
  })
  companyId: string;

  @Field({
    description: 'Название области сбора мусора',
  })
  name: string;

  @Field(() => String, {
    nullable: true,
    description: 'Описание или дополнительные детали области сбора',
  })
  description?: string | null;

  @Field(() => [TrashBinType], {
    description:
      'Список типов контейнеров для мусора, которые физически присутствуют в данной области',
  })
  presentBinTypes: TrashBinType[];
}


