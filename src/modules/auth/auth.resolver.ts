import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { CompanyAdminEntity } from 'src/entities/smart-trash/company-admin.entity';
import { EmployeeEntity } from 'src/entities/smart-trash/employee.entity';
import { Public } from 'src/decorators/auth/public.decorator';
import { AdminLoginInput } from './inputs/admin-login.input';
import { EmployeeLoginInput } from './inputs/employee-login.input';
import { EmployeeRegisterInput } from './inputs/employee-register.input';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Mutation(() => CompanyAdminEntity, {
    description:
      'Авторизация администратора компании. Возвращает администратора с установленным JWT токеном.',
  })
  loginAdmin(
    @Args('input', {
      description: 'Данные для авторизации администратора компании',
    })
    input: AdminLoginInput,
  ): Promise<CompanyAdminEntity> {
    return this.authService.loginAdmin(input);
  }

  @Public()
  @Mutation(() => EmployeeEntity, {
    description:
      'Авторизация сотрудника компании. Возвращает сотрудника с установленным JWT токеном.',
  })
  loginEmployee(
    @Args('input', {
      description: 'Данные для авторизации сотрудника компании',
    })
    input: EmployeeLoginInput,
  ): Promise<EmployeeEntity> {
    return this.authService.loginEmployee(input);
  }

  @Public()
  @Mutation(() => EmployeeEntity, {
    description:
      'Регистрация нового сотрудника компании. Возвращает зарегистрированного сотрудника с установленным JWT токеном.',
  })
  registerEmployee(
    @Args('input', {
      description: 'Данные для регистрации сотрудника компании',
    })
    input: EmployeeRegisterInput,
  ): Promise<EmployeeEntity> {
    return this.authService.registerEmployee(input);
  }
}

