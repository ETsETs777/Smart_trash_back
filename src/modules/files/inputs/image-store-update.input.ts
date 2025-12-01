import { Field, InputType } from '@nestjs/graphql';
import { GraphQLUUID } from 'graphql-scalars';

/**
 * input to update the image store in the database.
 * (specifically isVisible)
 */
@InputType()
export class ImageStoreUpdateInput {
  @Field(() => GraphQLUUID)
  id: string;

  /**
   * is the image visible to the public
   */
  @Field(() => Boolean, { description: 'is the image visible to the public' })
  isVisible: boolean;
}
