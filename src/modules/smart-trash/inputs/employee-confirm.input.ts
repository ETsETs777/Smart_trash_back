import { Field, ID, InputType } from '@nestjs/graphql';

@InputType({
  description:
    'Входные данные для подтверждения, что сотрудник действительно относится к компании',
})
export class EmployeeConfirmInput {
  @Field(() => ID, {
    description: 'Идентификатор сотрудника, которого необходимо подтвердить',
  })
  employeeId: string;

  @Field({
    description:
      'Флаг подтверждения сотрудника администратором компании (true – сотрудник подтверждён)',
  })
  isConfirmed: boolean;
}


