import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { UserLoader } from '../loaders/user.loader';
import { CompanyLoader } from '../loaders/company.loader';
import { ImageLoader } from '../loaders/image.loader';

export interface Loaders {
  userLoader: UserLoader;
  companyLoader: CompanyLoader;
  imageLoader: ImageLoader;
}

export const LoadersContext = createParamDecorator(
  (data: unknown, context: ExecutionContext): Loaders => {
    const gqlContext = GqlExecutionContext.create(context);
    const ctx = gqlContext.getContext();
    return ctx.loaders;
  },
);

