import { Field, ID, InputType } from '@nestjs/graphql';

@InputType({
  description:
    'Входные данные для создания записи о фотографии мусора и отправки её в очередь на классификацию',
})
export class WastePhotoCreateInput {
  @Field(() => ID, {
    description: 'Идентификатор компании, от имени которой создаётся фотография',
  })
  companyId: string;

  @Field(() => ID, {
    description: 'Идентификатор изображения, загруженного через модуль файлов',
  })
  imageId: string;

  @Field(() => ID, {
    nullable: true,
    description:
      'Идентификатор пользователя (сотрудника), сделавшего фотографию',
  })
  userId?: string | null;

  @Field(() => ID, {
    nullable: true,
    description:
      'Идентификатор области сбора, в которой находится урна, к которой относится фотография',
  })
  collectionAreaId?: string | null;
}


