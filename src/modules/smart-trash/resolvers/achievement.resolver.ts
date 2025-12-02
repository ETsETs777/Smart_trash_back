import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AchievementEntity } from 'src/entities/smart-trash/achievement.entity';
import { AchievementService } from '../services/achievement.service';
import { AchievementCreateInput } from '../inputs/achievement-create.input';
import { Roles } from 'src/modules/auth/roles.decorator';
import { AuthRole } from 'src/modules/auth/auth-role.enum';
import { CurrentAdmin } from 'src/decorators/auth/current-admin.decorator';
import { JwtPayload } from 'src/modules/auth/jwt-payload.interface';

@Resolver(() => AchievementEntity)
export class AchievementResolver {
  constructor(private readonly achievementService: AchievementService) {}

  @Mutation(() => AchievementEntity, {
    description: 'Создаёт новую ачивку в рамках выбранной компании',
  })
  @Roles(AuthRole.COMPANY_ADMIN)
  createAchievement(
    @Args('input', {
      description: 'Данные для создания ачивки',
    })
    input: AchievementCreateInput,
    @CurrentAdmin() _admin: JwtPayload | null,
  ): Promise<AchievementEntity> {
    return this.achievementService.createAchievement(input);
  }

  @Query(() => [AchievementEntity], {
    description: 'Возвращает список ачивок, настроенных для компании',
  })
  companyAchievements(
    @Args('companyId', {
      description: 'Идентификатор компании',
    })
    companyId: string,
  ): Promise<AchievementEntity[]> {
    return this.achievementService.listCompanyAchievements(companyId);
  }
}


