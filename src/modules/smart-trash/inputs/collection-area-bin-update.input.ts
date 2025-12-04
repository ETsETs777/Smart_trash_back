import { Field, ID, InputType } from '@nestjs/graphql';
import { TrashBinType } from 'src/entities/smart-trash/trash-bin-type.enum';

@InputType({
  description: 'Входные данные для обновления мусорного контейнера',
})
export class CollectionAreaBinUpdateInput {
  @Field(() => ID, {
    description: 'Идентификатор контейнера',
  })
  id: string;

  @Field(() => TrashBinType, {
    nullable: true,
    description: 'Тип контейнера для мусора',
  })
  type?: TrashBinType | null;
}

