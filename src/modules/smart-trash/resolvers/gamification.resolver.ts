import { Args, Query, Resolver, ID } from '@nestjs/graphql';
import { GamificationService } from '../services/gamification.service';
import { UserProgressDto } from 'src/common/dto/user-progress.dto';
import { DailyChallengeEntity } from 'src/entities/smart-trash/daily-challenge.entity';
import { DailyChallengeProgressEntity } from 'src/entities/smart-trash/daily-challenge-progress.entity';
import { TeamCompetitionEntity } from 'src/entities/smart-trash/team-competition.entity';
import { TeamCompetitionParticipantEntity } from 'src/entities/smart-trash/team-competition-participant.entity';
import { SeasonalEventEntity } from 'src/entities/smart-trash/seasonal-event.entity';
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
    @InjectRepository(TeamCompetitionEntity)
    private readonly teamCompetitionRepository: Repository<TeamCompetitionEntity>,
    @InjectRepository(TeamCompetitionParticipantEntity)
    private readonly teamParticipantRepository: Repository<TeamCompetitionParticipantEntity>,
    @InjectRepository(SeasonalEventEntity)
    private readonly seasonalEventRepository: Repository<SeasonalEventEntity>,
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

  @Query(() => [TeamCompetitionEntity], {
    description: 'Получить активные командные соревнования для компании',
  })
  @CacheQuery({
    ttl: 300, // Cache for 5 minutes
    keyGenerator: (args) => `query:team-competitions:company:${args.companyId}`,
  })
  @Roles(AuthRole.ADMIN_COMPANY, AuthRole.EMPLOYEE)
  async teamCompetitions(
    @Args('companyId', { description: 'Идентификатор компании' })
    companyId: string,
  ): Promise<TeamCompetitionEntity[]> {
    const now = new Date();

    const competitions = await this.teamCompetitionRepository.find({
      where: {
        company: { id: companyId },
        isActive: true,
      },
      relations: ['company', 'participants', 'participants.members'],
      order: { createdAt: 'DESC' },
    });

    // Фильтруем активные соревнования
    return competitions.filter((competition) => {
      return now >= competition.startDate && now <= competition.endDate;
    });
  }

  @Query(() => [TeamCompetitionParticipantEntity], {
    description: 'Получить участников командного соревнования с рейтингом',
  })
  @Roles(AuthRole.ADMIN_COMPANY, AuthRole.EMPLOYEE)
  async teamCompetitionParticipants(
    @Args('competitionId', { description: 'Идентификатор соревнования' })
    competitionId: string,
  ): Promise<TeamCompetitionParticipantEntity[]> {
    const participants = await this.teamParticipantRepository.find({
      where: {
        competition: { id: competitionId },
      },
      relations: ['competition', 'members'],
      order: { totalPoints: 'DESC' },
    });

    // Обновляем рейтинг
    participants.forEach((participant, index) => {
      participant.rank = index + 1;
    });

    return participants;
  }

  @Query(() => [SeasonalEventEntity], {
    description: 'Получить активные сезонные события для компании',
  })
  @CacheQuery({
    ttl: 300, // Cache for 5 minutes
    keyGenerator: (args) => `query:seasonal-events:company:${args.companyId || 'global'}`,
  })
  @Roles(AuthRole.ADMIN_COMPANY, AuthRole.EMPLOYEE)
  async seasonalEvents(
    @Args('companyId', {
      description: 'Идентификатор компании (опционально, для глобальных событий)',
      nullable: true,
    })
    companyId?: string,
  ): Promise<SeasonalEventEntity[]> {
    const now = new Date();

    const whereCondition: any = {
      isActive: true,
    };

    if (companyId) {
      whereCondition.company = { id: companyId };
    } else {
      whereCondition.company = null;
    }

    const events = await this.seasonalEventRepository.find({
      where: whereCondition,
      relations: ['company', 'specialAchievements'],
      order: { createdAt: 'DESC' },
    });

    // Фильтруем активные события
    return events.filter((event) => {
      return now >= event.startDate && now <= event.endDate;
    });
  }
}

