import { Field, ID, InputType } from '@nestjs/graphql';
import { Sanitize } from 'src/common/decorators/sanitize.decorator';

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
  @Sanitize()
  firstName: string;

  @Field({
    description: 'Фамилия сотрудника',
  })
  @Sanitize()
  lastName: string;

  @Field({
    description: 'Электронная почта сотрудника (обязательна для создания)',
  })
  email: string; // Email не санитизируем, так как он валидируется отдельно

  @Field(() => Boolean, {
    nullable: true,
    description:
      'Флаг, зарегистрирован ли сотрудник в системе (по умолчанию false, то есть анонимный сотрудник)',
  })
  isRegistered?: boolean | null;
}


