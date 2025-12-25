import { Field, ID, InputType } from '@nestjs/graphql';
import { Sanitize } from 'src/common/decorators/sanitize.decorator';

@InputType({
  description: 'Входные данные для обновления данных сотрудника администратором компании',
})
export class UserUpdateEmployeeInput {
  @Field(() => ID, {
    description: 'Идентификатор сотрудника, данные которого нужно обновить',
  })
  employeeId: string;

  @Field(() => ID, {
    description: 'Идентификатор компании, к которой относится сотрудник',
  })
  companyId: string;

  @Field(() => String, {
    nullable: true,
    description: 'Фамилия, имя и отчество сотрудника',
  })
  @Sanitize()
  fullName?: string | null;

  @Field(() => String, {
    nullable: true,
    description: 'Новый пароль сотрудника',
  })
  password?: string | null;

  @Field(() => ID, {
    nullable: true,
    description: 'Идентификатор нового логотипа/аватара сотрудника (null для удаления)',
  })
  logoId?: string | null;
}

