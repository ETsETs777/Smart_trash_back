import { Field, InputType } from '@nestjs/graphql';

@InputType({
  description: 'Входные данные для авторизации пользователя',
})
export class LoginInput {
  @Field({
    description: 'Адрес электронной почты пользователя',
  })
  email: string;

  @Field({
    description: 'Пароль пользователя',
  })
  password: string;
}

