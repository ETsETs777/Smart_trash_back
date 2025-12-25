// eslint-disable-next-line import/no-unresolved
import { Args, Mutation, Query, Resolver, ID, Int, Subscription } from '@nestjs/graphql';
import { AchievementEntity } from 'src/entities/smart-trash/achievement.entity';
import { AchievementService } from '../services/achievement.service';
import { AchievementCreateInput } from '../inputs/achievement-create.input';
import { Roles } from 'src/modules/auth/roles.decorator';
import { AuthRole } from 'src/modules/auth/auth-role.enum';
import { CurrentUser } from 'src/decorators/auth/current-user.decorator';
import { JwtPayload } from 'src/modules/auth/jwt-payload.interface';
import { PubSubService } from 'src/common/pubsub/pubsub.service';
import { EmployeeAchievementEntity } from 'src/entities/smart-trash/employee-achievement.entity';
import { Public } from 'src/decorators/auth/public.decorator';
import { AchievementEarnedPayload } from 'src/common/dto/achievement-earned.dto';
import { CacheQuery } from 'src/common/decorators/cache-query.decorator';

@Resolver(() => AchievementEntity)
export class AchievementResolver {
  constructor(
    private readonly achievementService: AchievementService,
    private readonly pubSub: PubSubService,
  ) {}

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
  @CacheQuery({ 
    ttl: 300, // Cache for 5 minutes
    keyGenerator: (args) => `query:achievements:company:${args.companyId}`,
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

  @Public()
  @Subscription(() => AchievementEarnedPayload, {
    description: 'Подписка на получение новых достижений',
    filter: (payload, variables) => {
      if (variables.userId) {
        return payload.achievementEarned.user.id === variables.userId;
      }
      if (variables.companyId) {
        return payload.achievementEarned.companyId === variables.companyId;
      }
      return true;
    },
  })
  achievementEarned(
    @Args('userId', { type: () => ID, nullable: true }) userId?: string,
    @Args('companyId', { type: () => ID, nullable: true }) companyId?: string,
  ) {
    return this.pubSub.asyncIterator('achievementEarned');
  }
}


