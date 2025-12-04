import { Field, ID, InputType } from '@nestjs/graphql';
import { TrashBinType } from 'src/entities/smart-trash/trash-bin-type.enum';

@InputType({
  description: 'Входные данные для добавления нескольких мусорных контейнеров в область сбора',
})
export class CollectionAreaBinsAddInput {
  @Field(() => ID, {
    description: 'Идентификатор области сбора, к которой добавляются контейнеры',
  })
  areaId: string;

  @Field(() => [TrashBinType], {
    description: 'Список типов контейнеров для добавления',
  })
  types: TrashBinType[];
}

