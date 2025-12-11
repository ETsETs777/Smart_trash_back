// eslint-disable-next-line import/no-unresolved
import { Args, Mutation, Query, Resolver, ID, Int } from '@nestjs/graphql';
import { AchievementEntity } from 'src/entities/smart-trash/achievement.entity';
import { AchievementService } from '../services/achievement.service';
import { AchievementCreateInput } from '../inputs/achievement-create.input';
import { Roles } from 'src/modules/auth/roles.decorator';
import { AuthRole } from 'src/modules/auth/auth-role.enum';
import { CurrentUser } from 'src/decorators/auth/current-user.decorator';
import { JwtPayload } from 'src/modules/auth/jwt-payload.interface';

@Resolver(() => AchievementEntity)
export class AchievementResolver {
  constructor(private readonly achievementService: AchievementService) {}

  @Mutation(() => AchievementEntity, {
    description: 'Создаёт новую ачивку в рамках выбранной компании',
  })
  @Roles(AuthRole.ADMIN_COMPANY)
  createAchievement(
    @Args('input', {
      description: 'Данные для создания ачивки',
    })
    input: AchievementCreateInput,
    @CurrentUser() _user: JwtPayload,
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

  @Mutation(() => AchievementEntity, {
    description: 'Обновляет ачивку',
  })
  @Roles(AuthRole.ADMIN_COMPANY)
  updateAchievement(
    @Args('id', { type: () => ID }) id: string,
    @Args('title', { nullable: true }) title?: string,
    @Args('description', { nullable: true }) description?: string,
    @Args('threshold', { type: () => Int, nullable: true }) threshold?: number,
    @CurrentUser() _user?: JwtPayload,
  ): Promise<AchievementEntity> {
    return this.achievementService.updateAchievement(id, {
      title,
      description,
      threshold,
    });
  }

  @Mutation(() => Boolean, {
    description: 'Удаляет ачивку',
  })
  @Roles(AuthRole.ADMIN_COMPANY)
  deleteAchievement(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() _user: JwtPayload,
  ): Promise<boolean> {
    return this.achievementService.deleteAchievement(id);
  }
}


