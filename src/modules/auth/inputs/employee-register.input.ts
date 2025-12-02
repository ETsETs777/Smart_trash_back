import { Field, ID, InputType } from '@nestjs/graphql';

@InputType({
  description: 'Входные данные для регистрации сотрудника компании',
})
export class EmployeeRegisterInput {
  @Field(() => ID, {
    description: 'Идентификатор компании, в которой работает сотрудник',
  })
  companyId: string;

  @Field({
    description: 'Имя сотрудника',
  })
  firstName: string;

  @Field({
    description: 'Фамилия сотрудника',
  })
  lastName: string;

  @Field({
    description: 'Адрес электронной почты сотрудника',
  })
  email: string;

  @Field({
    description: 'Пароль сотрудника',
  })
  password: string;
}

