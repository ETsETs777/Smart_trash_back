import { Args, Query, Resolver, ID } from '@nestjs/graphql';
import { GamificationService } from '../services/gamification.service';
import { UserProgressDto } from 'src/common/dto/user-progress.dto';
import { DailyChallengeEntity } from 'src/entities/smart-trash/daily-challenge.entity';
import { DailyChallengeProgressEntity } from 'src/entities/smart-trash/daily-challenge-progress.entity';
import { CurrentUser } from 'src/decorators/auth/current-user.decorator';
import { JwtPayload } from 'src/modules/auth/jwt-payload.interface';
import { Roles } from 'src/modules/auth/roles.decorator';
import { AuthRole } from 'src/modules/auth/auth-role.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CacheQuery } from 'src/common/decorators/cache-query.decorator';

@Resolver()
export class GamificationResolver {
  constructor(
    private readonly gamificationService: GamificationService,
    @InjectRepository(DailyChallengeEntity)
    private readonly challengeRepository: Repository<DailyChallengeEntity>,
    @InjectRepository(DailyChallengeProgressEntity)
    private readonly challengeProgressRepository: Repository<DailyChallengeProgressEntity>,
  ) {}

  @Query(() => UserProgressDto, {
    description: 'Получить прогресс текущего пользователя в геймификации',
  })
  @Roles(AuthRole.ADMIN_COMPANY, AuthRole.EMPLOYEE)
  async myProgress(@CurrentUser() user: JwtPayload): Promise<UserProgressDto> {
    return this.gamificationService.getUserProgress(user.sub);
  }

  @Query(() => UserProgressDto, {
    description: 'Получить прогресс пользователя по ID (для админов)',
  })
  @Roles(AuthRole.ADMIN_COMPANY)
  async userProgress(
    @Args('userId', { description: 'Идентификатор пользователя' })
    userId: string,
  ): Promise<UserProgressDto> {
    return this.gamificationService.getUserProgress(userId);
  }

  @Query(() => [DailyChallengeEntity], {
    description: 'Получить активные ежедневные задания для компании',
  })
  @CacheQuery({
    ttl: 300, // Cache for 5 minutes
    keyGenerator: (args) => `query:daily-challenges:company:${args.companyId}`,
  })
  @Roles(AuthRole.ADMIN_COMPANY, AuthRole.EMPLOYEE)
  async dailyChallenges(
    @Args('companyId', { description: 'Идентификатор компании' })
    companyId: string,
  ): Promise<DailyChallengeEntity[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const challenges = await this.challengeRepository.find({
      where: {
        company: { id: companyId },
        isActive: true,
      },
      relations: ['company'],
      order: { createdAt: 'DESC' },
    });

    // Фильтруем задания, активные сегодня
    return challenges.filter((challenge) => {
      const startDate = new Date(challenge.startDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(challenge.endDate);
      endDate.setHours(0, 0, 0, 0);
      return today >= startDate && today <= endDate;
    });
  }

  @Query(() => [DailyChallengeProgressEntity], {
    description: 'Получить прогресс текущего пользователя по ежедневным заданиям',
  })
  @Roles(AuthRole.ADMIN_COMPANY, AuthRole.EMPLOYEE)
  async myDailyChallengeProgress(
    @CurrentUser() user: JwtPayload,
    @Args('companyId', { description: 'Идентификатор компании' })
    companyId: string,
  ): Promise<DailyChallengeProgressEntity[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Получаем активные задания
    const challenges = await this.challengeRepository.find({
      where: {
        company: { id: companyId },
        isActive: true,
      },
    });

    const todayChallenges = challenges.filter((challenge) => {
      const startDate = new Date(challenge.startDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(challenge.endDate);
      endDate.setHours(0, 0, 0, 0);
      return today >= startDate && today <= endDate;
    });

    // Обновляем прогресс по всем заданиям
    await this.gamificationService.updateDailyChallengeProgress(
      user.sub,
      companyId,
    );

    // Получаем прогресс по каждому заданию
    const progressList = await Promise.all(
      todayChallenges.map(async (challenge) => {
        let progress = await this.challengeProgressRepository.findOne({
          where: {
            user: { id: user.sub },
            challenge: { id: challenge.id },
          },
          relations: ['user', 'challenge'],
        });

        if (!progress) {
          // Создаем новый прогресс, если его нет
          progress = this.challengeProgressRepository.create({
            user: { id: user.sub } as any,
            challenge: challenge,
            currentProgress: 0,
            isCompleted: false,
          });
          await this.challengeProgressRepository.save(progress);
          
          // Загружаем с relations
          progress = await this.challengeProgressRepository.findOne({
            where: {
              user: { id: user.sub },
              challenge: { id: challenge.id },
            },
            relations: ['user', 'challenge'],
          });
        }

        return progress;
      }),
    );

    return progressList.filter((p) => p !== null) as DailyChallengeProgressEntity[];
  }
}

