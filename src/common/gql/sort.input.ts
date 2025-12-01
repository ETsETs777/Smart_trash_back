import { Field, InputType } from '@nestjs/graphql';
import { SortOrderScalar } from './sort-order.scalar';

/**
 * Input GraphQL type for sorting (orderBy)
 */
@InputType()
export class SortInput {
  /**
   * Sorting (orderBy)
   */
  @Field(() => SortOrderScalar, { nullable: true })
  sort?: string;
}
