import { Field, ID, ObjectType } from '@nestjs/graphql'

@ObjectType()
export class LeaderboardUpdatedPayload {
  @Field(() => ID)
  companyId: string

  @Field(() => ID, { nullable: true })
  userId?: string | null
}

