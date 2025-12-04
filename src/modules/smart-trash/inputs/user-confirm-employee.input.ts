import { Field, ID, InputType } from '@nestjs/graphql';

@InputType({
  description: 'Входные данные для подтверждения участия сотрудника в компании',
})
export class UserConfirmEmployeeInput {
  @Field(() => ID, {
    description: 'Идентификатор сотрудника',
  })
  employeeId: string;

  @Field(() => ID, {
    description: 'Идентификатор компании',
  })
  companyId: string;

  @Field({
    description: 'Флаг подтверждения участия сотрудника в компании',
  })
  isConfirmed: boolean;
}

