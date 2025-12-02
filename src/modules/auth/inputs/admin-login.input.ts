import { Field, InputType } from '@nestjs/graphql';

@InputType({
  description: 'Входные данные для авторизации администратора компании',
})
export class AdminLoginInput {
  @Field({
    description: 'Адрес электронной почты администратора компании',
  })
  email: string;

  @Field({
    description: 'Пароль администратора компании',
  })
  password: string;
}

