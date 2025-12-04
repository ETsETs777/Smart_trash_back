import { Field, ID, InputType } from '@nestjs/graphql';

@InputType({
  description: 'Входные данные для добавления сотрудника в компанию',
})
export class UserAddToCompanyInput {
  @Field(() => ID, {
    description: 'Идентификатор сотрудника',
  })
  employeeId: string;

  @Field(() => ID, {
    description: 'Идентификатор компании',
  })
  companyId: string;
}

