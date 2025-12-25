import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { UserEntity } from 'src/entities/smart-trash/user.entity';
import { Public } from 'src/decorators/auth/public.decorator';
import { LoginInput } from './inputs/login.input';
import { AdminRegisterInput } from './inputs/admin-register.input';
import { EmployeeRegisterInput } from './inputs/employee-register-new.input';
import { ConfirmEmailInput } from './inputs/confirm-email.input';
import { RefreshTokenInput } from './inputs/refresh-token.input';
import { TokenResponse } from './entities/token-response.entity';
import { CurrentUser } from 'src/decorators/auth/current-user.decorator';
import { JwtPayload } from './jwt-payload.interface';
import { Roles } from './roles.decorator';
import { AuthRole } from './auth-role.enum';

@Resolver(() => UserEntity)
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { ttl: 3600000, limit: 3 } })
  @Mutation(() => UserEntity, {
    description:
      'Регистрация администратора компании. Создаёт компанию и пользователя с ролью ADMIN_COMPANY. Требует подтверждения email.',
  })
  registerAdmin(
    @Args('input', {
      description: 'Данные для регистрации администратора компании',
    })
    input: AdminRegisterInput,
  ): Promise<UserEntity> {
    return this.authService.registerAdmin(input);
  }

  @Public()
  @Throttle({ default: { ttl: 3600000, limit: 10 } })
  @Mutation(() => UserEntity, {
    description:
      'Регистрация сотрудника компании. Создаёт пользователя с ролью EMPLOYEE. Требует подтверждения email.',
  })
  registerEmployee(
    @Args('input', {
      description: 'Данные для регистрации сотрудника компании',
    })
    input: EmployeeRegisterInput,
  ): Promise<UserEntity> {
    return this.authService.registerEmployee(input);
  }

  @Public()
  @Throttle({ default: { ttl: 900000, limit: 5 } })
  @Mutation(() => UserEntity, {
    description:
      'Авторизация пользователя (администратора или сотрудника). Возвращает пользователя с установленным JWT токеном.',
  })
  login(
    @Args('input', {
      description: 'Данные для авторизации пользователя',
    })
    input: LoginInput,
  ): Promise<UserEntity> {
    return this.authService.login(input);
  }

  @Public()
  @Mutation(() => UserEntity, {
    description:
      'Подтверждение адреса электронной почты по токену, отправленному на email',
  })
  confirmEmail(
    @Args('input', {
      description: 'Токен подтверждения электронной почты',
    })
    input: ConfirmEmailInput,
  ): Promise<UserEntity> {
    return this.authService.confirmEmail(input);
  }

  @Public()
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Mutation(() => TokenResponse, {
    description: 'Обновление access токена с помощью refresh токена',
  })
  refreshToken(
    @Args('input', {
      description: 'Refresh токен для получения нового access токена',
    })
    input: RefreshTokenInput,
  ): Promise<TokenResponse> {
    return this.authService.refreshToken(input);
  }

  @Roles(AuthRole.ADMIN_COMPANY, AuthRole.EMPLOYEE)
  @Query(() => UserEntity, {
    description: 'Текущий пользователь (email, роль, компания, логотип)',
  })
  me(@CurrentUser() user: JwtPayload): Promise<UserEntity> {
    return this.authService.me(user);
  }
}
