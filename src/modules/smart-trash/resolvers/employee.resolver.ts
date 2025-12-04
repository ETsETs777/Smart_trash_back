import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { UserEntity } from 'src/entities/smart-trash/user.entity';
import { EmployeeCreateInput } from '../inputs/employee-create.input';
import { EmployeeConfirmInput } from '../inputs/employee-confirm.input';
import { EmployeeService } from '../services/employee.service';
import { Roles } from 'src/modules/auth/roles.decorator';
import { AuthRole } from 'src/modules/auth/auth-role.enum';
import { CurrentUser } from 'src/decorators/auth/current-user.decorator';
import { JwtPayload } from 'src/modules/auth/jwt-payload.interface';

@Resolver(() => UserEntity)
export class EmployeeResolver {
  constructor(private readonly employeeService: EmployeeService) {}

  @Mutation(() => UserEntity, {
    description:
      'Создаёт нового сотрудника компании. Отправляет письмо подтверждения на email',
  })
  @Roles(AuthRole.ADMIN_COMPANY)
  createEmployee(
    @Args('input', {
      description: 'Данные сотрудника и идентификатор компании',
    })
    input: EmployeeCreateInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<UserEntity> {
    return this.employeeService.createEmployee(input, user);
  }

  @Mutation(() => UserEntity, {
    description:
      'Подтверждает, что сотрудник действительно относится к компании (не случайный прохожий)',
  })
  @Roles(AuthRole.ADMIN_COMPANY)
  confirmEmployee(
    @Args('input', {
      description: 'Данные для подтверждения сотрудника',
    })
    input: EmployeeConfirmInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<UserEntity> {
    return this.employeeService.confirmEmployee(input, user);
  }
}
