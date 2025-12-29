import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class UserInfo {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;

  @Field()
  fullName: string;
}

@ObjectType()
export class LevelUpPayload {
  @Field(() => UserInfo)
  user: UserInfo;

  @Field(() => Int)
  oldLevel: number;

  @Field(() => Int)
  newLevel: number;

  @Field(() => ID, { nullable: true })
  companyId?: string | null;
}

