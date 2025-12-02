import { Field, ID, InputType } from '@nestjs/graphql';

@InputType({
  description: 'Входные данные для создания сотрудника компании',
})
export class EmployeeCreateInput {
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

  @Field(() => String, {
    nullable: true,
    description: 'Электронная почта сотрудника при регистрации',
  })
  email?: string | null;

  @Field(() => Boolean, {
    nullable: true,
    description:
      'Флаг, зарегистрирован ли сотрудник в системе (по умолчанию false, то есть анонимный сотрудник)',
  })
  isRegistered?: boolean | null;
}


