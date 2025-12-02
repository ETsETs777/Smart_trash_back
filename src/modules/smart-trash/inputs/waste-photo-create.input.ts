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
      'Идентификатор сотрудника, сделавшего фотографию (если сотрудник уже существует в системе)',
  })
  employeeId?: string | null;

  @Field(() => String, {
    nullable: true,
    description:
      'Имя сотрудника, сделавшего фотографию (используется, если сотрудник ещё не зарегистрирован и не имеет идентификатора)',
  })
  employeeFirstName?: string | null;

  @Field(() => String, {
    nullable: true,
    description:
      'Фамилия сотрудника, сделавшего фотографию (используется, если сотрудник ещё не зарегистрирован и не имеет идентификатора)',
  })
  employeeLastName?: string | null;

  @Field(() => ID, {
    nullable: true,
    description:
      'Идентификатор области сбора, в которой находится урна, к которой относится фотография',
  })
  collectionAreaId?: string | null;
}


