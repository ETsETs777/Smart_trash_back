import {
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtPayload } from 'src/modules/auth/jwt-payload.interface';
import { AuthRole } from 'src/modules/auth/auth-role.enum';

export const CurrentNonAuthEmployee = createParamDecorator(
  (data: unknown, context: ExecutionContext): JwtPayload => {
    const gqlContext = GqlExecutionContext.create(context);
    const request = gqlContext.getContext().req;
    const user = request?.user as JwtPayload | undefined;

    if (!user) {
      throw new UnauthorizedException(
        'Для доступа к этому ресурсу требуется авторизация',
      );
    }

    if (user.role !== AuthRole.NON_AUTH_EMPLOYEE) {
      throw new ForbiddenException(
        'Доступ к этому ресурсу разрешен только неавторизованным сотрудникам',
      );
    }

    return user;
  },
);


