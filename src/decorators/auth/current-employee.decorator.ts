import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtPayload } from 'src/modules/auth/jwt-payload.interface';
import { AuthRole } from 'src/modules/auth/auth-role.enum';

export const CurrentEmployee = createParamDecorator(
  (data: unknown, context: ExecutionContext): JwtPayload | null => {
    const gqlContext = GqlExecutionContext.create(context);
    const request = gqlContext.getContext().req;
    const user = request?.user as JwtPayload | undefined;
    if (!user || user.role !== AuthRole.EMPLOYEE) {
      return null;
    }
    return user;
  },
);


