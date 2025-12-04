import { Field, ID, InputType } from '@nestjs/graphql';

@InputType({
  description: 'Входные данные для регистрации сотрудника компании',
})
export class EmployeeRegisterInput {
  @Field({
    description: 'Фамилия, имя и отчество сотрудника',
  })
  fullName: string;

  @Field({
    description: 'Адрес электронной почты сотрудника',
  })
  email: string;

  @Field({
    description: 'Пароль сотрудника',
  })
  password: string;

  @Field(() => ID, {
    description: 'Идентификатор компании, в которой работает сотрудник',
  })
  companyId: string;
}

