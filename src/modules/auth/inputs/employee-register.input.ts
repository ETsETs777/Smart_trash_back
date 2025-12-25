import { Field, ID, InputType } from '@nestjs/graphql';
import { Sanitize } from 'src/common/decorators/sanitize.decorator';

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
  @Sanitize()
  firstName: string;

  @Field({
    description: 'Фамилия сотрудника',
  })
  @Sanitize()
  lastName: string;

  @Field({
    description: 'Адрес электронной почты сотрудника',
  })
  email: string; // Email не санитизируем, так как он валидируется отдельно

  @Field({
    description: 'Пароль сотрудника',
  })
  password: string; // Пароль не санитизируем
}

