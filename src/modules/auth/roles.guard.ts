import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ROLES_KEY } from './roles.decorator';
import { AuthRole } from './auth-role.enum';
import { JwtPayload } from './jwt-payload.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles =
      this.reflector.getAllAndOverride<AuthRole[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const gqlContext = GqlExecutionContext.create(context);
    const request = gqlContext.getContext().req;
    const user = request?.user as JwtPayload | undefined;

    if (!user || !user.role) {
      return false;
    }

    return requiredRoles.includes(user.role);
  }
}


