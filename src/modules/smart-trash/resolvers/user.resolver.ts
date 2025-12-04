import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UserEntity } from 'src/entities/smart-trash/user.entity';
import { UserService } from '../services/user.service';
import { UserUpdateInput } from '../inputs/user-update.input';
import { UserConfirmEmployeeInput } from '../inputs/user-confirm-employee.input';
import { UserAddToCompanyInput } from '../inputs/user-add-to-company.input';
import { UserRemoveFromCompanyInput } from '../inputs/user-remove-from-company.input';
import { UserUpdateEmployeeInput } from '../inputs/user-update-employee.input';
import { Roles } from 'src/modules/auth/roles.decorator';
import { AuthRole } from 'src/modules/auth/auth-role.enum';
import { CurrentUser } from 'src/decorators/auth/current-user.decorator';
import { JwtPayload } from 'src/modules/auth/jwt-payload.interface';

@Resolver(() => UserEntity)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Mutation(() => UserEntity, {
    description: 'Обновляет данные текущего пользователя (сотрудника)',
  })
  @Roles(AuthRole.EMPLOYEE)
  updateSelf(
    @Args('input', {
      description: 'Данные для обновления пользователя',
    })
    input: UserUpdateInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<UserEntity> {
    return this.userService.updateSelf(input, user);
  }

  @Query(() => [UserEntity], {
    description: 'Возвращает список сотрудников компании. Доступно только администратору компании',
  })
  @Roles(AuthRole.ADMIN_COMPANY)
  companyEmployees(
    @Args('companyId', {
      type: () => ID,
      description: 'Идентификатор компании',
    })
    companyId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<UserEntity[]> {
    return this.userService.getCompanyEmployees(companyId, user);
  }

  @Mutation(() => UserEntity, {
    description: 'Подтверждает или отклоняет участие сотрудника в компании. Доступно только администратору компании',
  })
  @Roles(AuthRole.ADMIN_COMPANY)
  confirmEmployee(
    @Args('input', {
      description: 'Данные для подтверждения участия сотрудника',
    })
    input: UserConfirmEmployeeInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<UserEntity> {
    return this.userService.confirmEmployee(input, user);
  }

  @Mutation(() => UserEntity, {
    description: 'Добавляет сотрудника в компанию. Доступно только администратору компании',
  })
  @Roles(AuthRole.ADMIN_COMPANY)
  addEmployeeToCompany(
    @Args('input', {
      description: 'Данные для добавления сотрудника в компанию',
    })
    input: UserAddToCompanyInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<UserEntity> {
    return this.userService.addEmployeeToCompany(input, user);
  }

  @Mutation(() => Boolean, {
    description: 'Удаляет сотрудника из компании. Доступно только администратору компании',
  })
  @Roles(AuthRole.ADMIN_COMPANY)
  removeEmployeeFromCompany(
    @Args('input', {
      description: 'Данные для удаления сотрудника из компании',
    })
    input: UserRemoveFromCompanyInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<boolean> {
    return this.userService.removeEmployeeFromCompany(input, user);
  }

  @Mutation(() => UserEntity, {
    description: 'Обновляет данные сотрудника. Доступно только администратору компании',
  })
  @Roles(AuthRole.ADMIN_COMPANY)
  updateEmployee(
    @Args('input', {
      description: 'Данные для обновления сотрудника',
    })
    input: UserUpdateEmployeeInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<UserEntity> {
    return this.userService.updateEmployee(input, user);
  }
}
