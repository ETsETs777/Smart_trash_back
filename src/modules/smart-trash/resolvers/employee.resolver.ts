import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { EmployeeEntity } from 'src/entities/smart-trash/employee.entity';
import { EmployeeCreateInput } from '../inputs/employee-create.input';
import { EmployeeConfirmInput } from '../inputs/employee-confirm.input';
import { EmployeeService } from '../services/employee.service';
import { Roles } from 'src/modules/auth/roles.decorator';
import { AuthRole } from 'src/modules/auth/auth-role.enum';
import { CurrentAdmin } from 'src/decorators/auth/current-admin.decorator';
import { JwtPayload } from 'src/modules/auth/jwt-payload.interface';

@Resolver(() => EmployeeEntity)
export class EmployeeResolver {
  constructor(private readonly employeeService: EmployeeService) {}

  @Mutation(() => EmployeeEntity, {
    description: 'Создаёт нового сотрудника компании',
  })
  @Roles(AuthRole.COMPANY_ADMIN)
  createEmployee(
    @Args('input', {
      description: 'Данные сотрудника и идентификатор компании',
    })
    input: EmployeeCreateInput,
    @CurrentAdmin() _admin: JwtPayload | null,
  ): Promise<EmployeeEntity> {
    return this.employeeService.createEmployee(input);
  }

  @Mutation(() => EmployeeEntity, {
    description:
      'Подтверждает, что сотрудник действительно относится к компании (не случайный прохожий)',
  })
  @Roles(AuthRole.COMPANY_ADMIN)
  confirmEmployee(
    @Args('input', {
      description: 'Данные для подтверждения сотрудника',
    })
    input: EmployeeConfirmInput,
    @CurrentAdmin() _admin: JwtPayload | null,
  ): Promise<EmployeeEntity> {
    return this.employeeService.confirmEmployee(input);
  }
}


