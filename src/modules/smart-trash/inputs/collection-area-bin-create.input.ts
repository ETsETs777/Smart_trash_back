import { Field, ID, InputType } from '@nestjs/graphql';
import { TrashBinType } from 'src/entities/smart-trash/trash-bin-type.enum';

@InputType({
  description: 'Входные данные для создания мусорного контейнера в области сбора',
})
export class CollectionAreaBinCreateInput {
  @Field(() => ID, {
    description: 'Идентификатор области сбора, к которой добавляется контейнер',
  })
  areaId: string;

  @Field(() => TrashBinType, {
    description: 'Тип контейнера для мусора',
  })
  type: TrashBinType;
}

