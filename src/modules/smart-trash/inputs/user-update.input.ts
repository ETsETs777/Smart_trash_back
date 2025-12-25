import { Field, ID, InputType } from '@nestjs/graphql';
import { Sanitize } from 'src/common/decorators/sanitize.decorator';

@InputType({
  description: 'Входные данные для обновления данных пользователя',
})
export class UserUpdateInput {
  @Field(() => String, {
    nullable: true,
    description: 'Фамилия, имя и отчество пользователя',
  })
  @Sanitize()
  fullName?: string | null;

  @Field(() => String, {
    nullable: true,
    description: 'Новый пароль пользователя',
  })
  password?: string | null;

  @Field(() => ID, {
    nullable: true,
    description: 'Идентификатор изображения логотипа/аватара пользователя',
  })
  logoId?: string | null;
}

