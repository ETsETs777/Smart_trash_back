import { ArgsType, Field } from '@nestjs/graphql';

@ArgsType()
export class MeArgs {
  @Field(() => Boolean, { nullable: true, description: 'Загрузить связанные компании' })
  withCompanies?: boolean;
}

