import { Field, ID, InputType } from '@nestjs/graphql';

@InputType({
  description: 'Входные данные для удаления сотрудника из компании',
})
export class UserRemoveFromCompanyInput {
  @Field(() => ID, {
    description: 'Идентификатор сотрудника',
  })
  employeeId: string;

  @Field(() => ID, {
    description: 'Идентификатор компании',
  })
  companyId: string;
}

