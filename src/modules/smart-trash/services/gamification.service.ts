import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from 'src/entities/smart-trash/user.entity';
import { WastePhotoEntity } from 'src/entities/smart-trash/waste-photo.entity';
import { DailyChallengeProgressEntity } from 'src/entities/smart-trash/daily-challenge-progress.entity';
import { DailyChallengeEntity } from 'src/entities/smart-trash/daily-challenge.entity';
import { AchievementEntity } from 'src/entities/smart-trash/achievement.entity';
import { SeasonalEventEntity } from 'src/entities/smart-trash/seasonal-event.entity';
import { AchievementCriterionType } from 'src/entities/smart-trash/achievement-criterion.enum';

/**
 * Сервис для управления геймификацией
 * - Начисление очков и опыта
 * - Управление уровнями
 * - Обновление streak
 * - Обработка ежедневных заданий
 * - Применение сезонных событий
 */
@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);

  // Формула для расчета опыта до следующего уровня: baseExp * (level ^ 1.5)
  private readonly BASE_EXP_PER_LEVEL = 100;
  
  // Бонусы за streak
  private readonly STREAK_BONUS_MULTIPLIERS = {
    3: 1.1,   // 10% бонус за 3 дня подряд
    7: 1.2,   // 20% бонус за неделю
    14: 1.3,  // 30% бонус за 2 недели
    30: 1.5,  // 50% бонус за месяц
  };

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(WastePhotoEntity)
    private readonly wastePhotoRepository: Repository<WastePhotoEntity>,
    @InjectRepository(DailyChallengeProgressEntity)
    private readonly challengeProgressRepository: Repository<DailyChallengeProgressEntity>,
    @InjectRepository(DailyChallengeEntity)
    private readonly challengeRepository: Repository<DailyChallengeEntity>,
    @InjectRepository(SeasonalEventEntity)
    private readonly seasonalEventRepository: Repository<SeasonalEventEntity>,
  ) {}

  /**
   * Вычисляет опыт, необходимый для достижения уровня
   */
  calculateExperienceForLevel(level: number): number {
    return Math.floor(this.BASE_EXP_PER_LEVEL * Math.pow(level, 1.5));
  }

  /**
   * Вычисляет уровень на основе опыта
   */
  calculateLevelFromExperience(experience: number): number {
    if (experience <= 0) {
      return 1;
    }

    let level = 1;
    let totalExp = 0;

    while (totalExp < experience) {
      const expForNextLevel = this.calculateExperienceForLevel(level + 1);
      if (totalExp + expForNextLevel > experience) {
        break;
      }
      totalExp += expForNextLevel;
      level++;
    }

    return level;
  }

  /**
   * Вычисляет опыт до следующего уровня
   */
  calculateExperienceToNextLevel(currentLevel: number, currentExperience: number): number {
    const expForNextLevel = this.calculateExperienceForLevel(currentLevel + 1);
    let totalExpForCurrentLevel = 0;
    
    for (let l = 1; l <= currentLevel; l++) {
      totalExpForCurrentLevel += this.calculateExperienceForLevel(l);
    }
    
    const expInCurrentLevel = currentExperience - totalExpForCurrentLevel;
    return Math.max(0, expForNextLevel - expInCurrentLevel);
  }

  /**
   * Вычисляет процент прогресса к следующему уровню
   */
  calculateLevelProgress(currentLevel: number, currentExperience: number): number {
    const expForNextLevel = this.calculateExperienceForLevel(currentLevel + 1);
    let totalExpForCurrentLevel = 0;
    
    for (let l = 1; l <= currentLevel; l++) {
      totalExpForCurrentLevel += this.calculateExperienceForLevel(l);
    }
    
    const expInCurrentLevel = currentExperience - totalExpForCurrentLevel;
    if (expForNextLevel === 0) {
      return 100;
    }
    
    return Math.min(100, Math.floor((expInCurrentLevel / expForNextLevel) * 100));
  }

  /**
   * Начисляет очки и опыт пользователю
   */
  async awardPointsAndExperience(
    userId: string,
    points: number,
    experience: number,
    companyId?: string,
  ): Promise<{ pointsAwarded: number; experienceAwarded: number; levelUp: boolean; newLevel?: number }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      this.logger.warn(`User ${userId} not found for awarding points`);
      return { pointsAwarded: 0, experienceAwarded: 0, levelUp: false };
    }

    // Получаем бонус за streak
    const streakMultiplier = this.getStreakBonusMultiplier(user.currentStreak);
    
    // Проверяем активные сезонные события
    const multipliers = await this.getActiveMultipliers(companyId);
    
    // Применяем все множители
    const finalMultiplier = multipliers.pointsMultiplier * streakMultiplier;
    const finalPoints = Math.floor(points * finalMultiplier);
    const finalExperience = Math.floor(experience * multipliers.experienceMultiplier * streakMultiplier);

    const oldLevel = user.level;
    
    // Обновляем очки и опыт
    user.totalPoints += finalPoints;
    user.experience += finalExperience;

    // Проверяем повышение уровня
    const newLevel = this.calculateLevelFromExperience(user.experience);
    const levelUp = newLevel > user.level;
    
    if (levelUp) {
      this.logger.log(`User ${user.email} leveled up from ${user.level} to ${newLevel}`);
      user.level = newLevel;
    }

    await this.userRepository.save(user);

    return {
      pointsAwarded: finalPoints,
      experienceAwarded: finalExperience,
      levelUp,
      newLevel: levelUp ? newLevel : undefined,
    };
  }

  /**
   * Получает множитель бонуса за streak
   */
  private getStreakBonusMultiplier(streak: number): number {
    // Находим максимальный подходящий бонус
    const streakDays = Object.keys(this.STREAK_BONUS_MULTIPLIERS)
      .map(Number)
      .filter((days) => streak >= days)
      .sort((a, b) => b - a);
    
    if (streakDays.length === 0) {
      return 1;
    }
    
    return this.STREAK_BONUS_MULTIPLIERS[streakDays[0] as keyof typeof this.STREAK_BONUS_MULTIPLIERS];
  }

  /**
   * Обновляет streak пользователя при активности
   */
  async updateStreak(userId: string, companyId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastActivity = user.lastActivityDate
      ? new Date(user.lastActivityDate)
      : null;
    const lastActivityDate = lastActivity ? new Date(lastActivity) : null;
    if (lastActivityDate) {
      lastActivityDate.setHours(0, 0, 0, 0);
    }

    if (!lastActivityDate) {
      // Первая активность
      user.currentStreak = 1;
      user.lastActivityDate = today;
    } else {
      const diffDays = Math.floor(
        (today.getTime() - lastActivityDate.getTime()) / (24 * 60 * 60 * 1000),
      );

      if (diffDays === 0) {
        // Активность в тот же день - не обновляем streak
        return;
      } else if (diffDays === 1) {
        // Продолжаем streak
        user.currentStreak += 1;
      } else {
        // Streak прерван
        if (user.currentStreak > user.bestStreak) {
          user.bestStreak = user.currentStreak;
        }
        user.currentStreak = 1;
      }
    }

    user.lastActivityDate = today;
    await this.userRepository.save(user);

    // Обновляем прогресс по ежедневным заданиям
    await this.updateDailyChallengeProgress(userId, companyId);
  }

  /**
   * Обновляет прогресс по ежедневным заданиям
   */
  async updateDailyChallengeProgress(
    userId: string,
    companyId: string,
  ): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeChallenges = await this.challengeRepository.find({
      where: {
        company: { id: companyId },
        isActive: true,
      },
      relations: ['company'],
    });

    // Фильтруем задания, активные сегодня
    const todayChallenges = activeChallenges.filter((challenge) => {
      const startDate = new Date(challenge.startDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(challenge.endDate);
      endDate.setHours(0, 0, 0, 0);
      return today >= startDate && today <= endDate;
    });

    for (const challenge of todayChallenges) {
      let progress = await this.challengeProgressRepository.findOne({
        where: {
          user: { id: userId },
          challenge: { id: challenge.id },
        },
        relations: ['user', 'challenge'],
      });

      if (!progress) {
        progress = this.challengeProgressRepository.create({
          user: { id: userId } as UserEntity,
          challenge: challenge,
          currentProgress: 0,
          isCompleted: false,
        });
      }

      if (progress.isCompleted) {
        continue; // Задание уже выполнено
      }

      // Вычисляем текущий прогресс на основе критерия
      const currentValue = await this.getCriterionValue(
        userId,
        companyId,
        challenge.criterionType as AchievementCriterionType,
      );

      progress.currentProgress = currentValue;

      if (currentValue >= challenge.target) {
        progress.isCompleted = true;
        progress.completedAt = new Date();

        // Начисляем награды
        await this.awardPointsAndExperience(
          userId,
          challenge.rewardPoints,
          challenge.rewardExperience,
          companyId,
        );
      }

      await this.challengeProgressRepository.save(progress);
    }
  }

  /**
   * Получает значение критерия для пользователя
   */
  async getCriterionValue(
    userId: string,
    companyId: string,
    criterionType: AchievementCriterionType | string,
  ): Promise<number> {
    if (criterionType === AchievementCriterionType.TOTAL_PHOTOS) {
      const count = await this.wastePhotoRepository.count({
        where: {
          user: { id: userId },
          company: { id: companyId },
          status: 'CLASSIFIED' as any,
        },
      });
      return count;
    }

    if (criterionType === AchievementCriterionType.CORRECT_BIN_MATCHES) {
      const count = await this.wastePhotoRepository
        .createQueryBuilder('wp')
        .where('wp.userId = :userId', { userId })
        .andWhere('wp.companyId = :companyId', { companyId })
        .andWhere('wp.recommendedBinType IS NOT NULL')
        .andWhere('wp.status = :status', { status: 'CLASSIFIED' })
        .getCount();
      return count;
    }

    if (criterionType === AchievementCriterionType.STREAK_DAYS) {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });
      if (!user) {
        return 0;
      }
      return user.currentStreak;
    }

    // По умолчанию возвращаем 0 для неизвестных типов
    return 0;
  }

  /**
   * Получает активные множители из сезонных событий
   */
  private async getActiveMultipliers(companyId?: string): Promise<{
    pointsMultiplier: number;
    experienceMultiplier: number;
  }> {
    const now = new Date();

    const events = await this.seasonalEventRepository.find({
      where: {
        isActive: true,
        ...(companyId ? { company: { id: companyId } } : { company: null }),
      },
    });

    // Фильтруем активные события
    const activeEvents = events.filter((event) => {
      return now >= event.startDate && now <= event.endDate;
    });

    if (activeEvents.length === 0) {
      return { pointsMultiplier: 1, experienceMultiplier: 1 };
    }

    // Используем максимальные множители из всех активных событий
    const pointsMultiplier = Math.max(
      ...activeEvents.map((e) => e.pointsMultiplier),
      1,
    );
    const experienceMultiplier = Math.max(
      ...activeEvents.map((e) => e.experienceMultiplier),
      1,
    );

    return { pointsMultiplier, experienceMultiplier };
  }

  /**
   * Вычисляет прогресс выполнения ачивки в процентах
   */
  async calculateAchievementProgress(
    achievement: AchievementEntity,
    userId: string,
    companyId: string,
  ): Promise<number> {
    const currentValue = await this.getCriterionValue(
      userId,
      companyId,
      achievement.criterionType as AchievementCriterionType,
    );

    if (achievement.threshold === 0) {
      return 100;
    }

    const progress = Math.min((currentValue / achievement.threshold) * 100, 100);
    return Math.floor(progress);
  }

  /**
   * Получает информацию о прогрессе пользователя
   */
  async getUserProgress(userId: string): Promise<{
    level: number;
    experience: number;
    totalPoints: number;
    currentStreak: number;
    bestStreak: number;
    experienceToNextLevel: number;
    levelProgress: number;
  }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    return {
      level: user.level,
      experience: user.experience,
      totalPoints: user.totalPoints,
      currentStreak: user.currentStreak,
      bestStreak: user.bestStreak,
      experienceToNextLevel: this.calculateExperienceToNextLevel(user.level, user.experience),
      levelProgress: this.calculateLevelProgress(user.level, user.experience),
    };
  }
}

