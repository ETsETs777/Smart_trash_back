import { Field, InputType, Int } from '@nestjs/graphql';

/**
 * Input GraphQL type for pagination
 */
@InputType()
export class PaginationInput {
  /**
   * Skip the number of entries.
   */
  @Field(() => Int, { nullable: true })
  skip?: number;

  /**
   * Return the number of entries.
   */
  @Field(() => Int, { nullable: true })
  take?: number;
}
