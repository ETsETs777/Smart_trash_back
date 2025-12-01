import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
export abstract class PaginatedResponse {
  @Field(() => Int, {
    description: 'Records count with filter without pagination',
  })
  queryCount: number;

  @Field(() => Int, {
    description: 'Records count without filter and pagination',
  })
  totalCount: number;
}
