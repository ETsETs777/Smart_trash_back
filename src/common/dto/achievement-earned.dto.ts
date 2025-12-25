import { Field, ID, ObjectType } from '@nestjs/graphql'
import { EmployeeAchievementEntity } from '../../entities/smart-trash/employee-achievement.entity'
import { AchievementEntity } from '../../entities/smart-trash/achievement.entity'
import { UserEntity } from '../../entities/smart-trash/user.entity'

@ObjectType()
export class AchievementEarnedPayload {
  @Field(() => EmployeeAchievementEntity)
  employeeAchievement: EmployeeAchievementEntity

  @Field(() => AchievementEntity)
  achievement: AchievementEntity

  @Field(() => UserEntity)
  user: UserEntity

  @Field(() => ID)
  companyId: string
}

