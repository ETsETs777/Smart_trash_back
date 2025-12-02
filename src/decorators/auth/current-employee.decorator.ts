import {
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtPayload } from 'src/modules/auth/jwt-payload.interface';
import { AuthRole } from 'src/modules/auth/auth-role.enum';

export const CurrentEmployee = createParamDecorator(
  (data: unknown, context: ExecutionContext): JwtPayload => {
    const gqlContext = GqlExecutionContext.create(context);
    const request = gqlContext.getContext().req;
    const user = request?.user as JwtPayload | undefined;

    if (!user) {
      throw new UnauthorizedException(
        'Для доступа к этому ресурсу требуется авторизация сотрудника',
      );
    }

    if (user.role !== AuthRole.EMPLOYEE) {
      throw new ForbiddenException(
        'Доступ к этому ресурсу разрешен только зарегистрированным сотрудникам',
      );
    }

    return user;
  },
);


