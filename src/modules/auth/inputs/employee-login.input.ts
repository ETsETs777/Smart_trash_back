import { Field, InputType } from '@nestjs/graphql';

@InputType({
  description: 'Входные данные для авторизации сотрудника компании',
})
export class EmployeeLoginInput {
  @Field({
    description: 'Адрес электронной почты сотрудника',
  })
  email: string;

  @Field({
    description: 'Пароль сотрудника',
  })
  password: string;
}

