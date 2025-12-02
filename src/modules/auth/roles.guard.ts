import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ROLES_KEY } from './roles.decorator';
import { IS_PUBLIC_KEY } from 'src/decorators/auth/public.decorator';
import { AuthRole } from './auth-role.enum';
import { JwtPayload } from './jwt-payload.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Проверяем, является ли эндпоинт публичным
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    // Проверяем, требуются ли роли
    const requiredRoles =
      this.reflector.getAllAndOverride<AuthRole[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      // Если роли не указаны, разрешаем доступ любому авторизованному пользователю
      return true;
    }

    const gqlContext = GqlExecutionContext.create(context);
    const request = gqlContext.getContext().req;
    const user = request?.user as JwtPayload | undefined;

    if (!user || !user.role) {
      throw new UnauthorizedException(
        'Для доступа к этому ресурсу требуется авторизация',
      );
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        'У вас нет прав для доступа к этому ресурсу',
      );
    }

    return true;
  }
}


