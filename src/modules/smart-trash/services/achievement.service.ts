import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AchievementEntity } from 'src/entities/smart-trash/achievement.entity';
import { CompanyEntity } from 'src/entities/smart-trash/company.entity';
import { UserEntity } from 'src/entities/smart-trash/user.entity';
import { EmployeeAchievementEntity } from 'src/entities/smart-trash/employee-achievement.entity';
import { WastePhotoEntity } from 'src/entities/smart-trash/waste-photo.entity';
import { AchievementCriterionType } from 'src/entities/smart-trash/achievement-criterion.enum';
import { AchievementCreateInput } from '../inputs/achievement-create.input';

@Injectable()
export class AchievementService {
  constructor(
    @InjectRepository(AchievementEntity)
    private readonly achievementRepository: Repository<AchievementEntity>,
    @InjectRepository(EmployeeAchievementEntity)
    private readonly employeeAchievementRepository: Repository<EmployeeAchievementEntity>,
    @InjectRepository(CompanyEntity)
    private readonly companyRepository: Repository<CompanyEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(WastePhotoEntity)
    private readonly wastePhotoRepository: Repository<WastePhotoEntity>,
  ) {}

  async createAchievement(
    input: AchievementCreateInput,
  ): Promise<AchievementEntity> {
    const company = await this.companyRepository.findOneBy({
      id: input.companyId,
    });
    if (!company) {
      throw new NotFoundException('Компания не найдена');
    }

    let createdBy: UserEntity | null = null;
    if (input.createdByAdminId) {
      createdBy = await this.userRepository.findOneBy({
        id: input.createdByAdminId,
      });
      if (!createdBy) {
        throw new NotFoundException('Администратор компании не найден');
      }
    }

    const achievement = this.achievementRepository.create({
      title: input.title,
      description: input.description,
      criterionType: input.criterionType,
      threshold: input.threshold,
      company,
      createdBy: createdBy ?? undefined,
    });
    return this.achievementRepository.save(achievement);
  }

  async listCompanyAchievements(companyId: string): Promise<AchievementEntity[]> {
    return this.achievementRepository.find({
      where: { company: { id: companyId } },
    });
  }

  async checkAndGrantForEmployeeByPhoto(
    wastePhoto: WastePhotoEntity,
  ): Promise<EmployeeAchievementEntity[]> {
    if (!wastePhoto.user || !wastePhoto.company) {
      return [];
    }

    const user = await this.userRepository.findOne({
      where: { id: wastePhoto.user.id },
      relations: ['employeeCompanies'],
    });
    if (!user) {
      throw new NotFoundException('Пользователь не найден для выдачи ачивок');
    }

    const isEmployeeInCompany = user.employeeCompanies?.some((c) => c.id === wastePhoto.company.id);
    if (!isEmployeeInCompany) {
      return [];
    }

    const achievements = await this.achievementRepository.find({
      where: { company: { id: wastePhoto.company.id } },
    });

    const alreadyEarned = await this.employeeAchievementRepository.find({
      where: {
        user: { id: user.id },
      },
      relations: ['achievement'],
    });
    const alreadyEarnedIds = new Set(
      alreadyEarned.map((ea) => ea.achievement.id),
    );

    const toGrant: AchievementEntity[] = [];

    for (const achievement of achievements) {
      if (alreadyEarnedIds.has(achievement.id)) {
        continue;
      }
      const reached = await this.isCriterionReached(achievement, user);
      if (reached) {
        toGrant.push(achievement);
      }
    }

    const created: EmployeeAchievementEntity[] = [];

    for (const achievement of toGrant) {
      const ea = this.employeeAchievementRepository.create({
        user,
        achievement,
      });
      created.push(await this.employeeAchievementRepository.save(ea));
    }

    return created;
  }

  private async isCriterionReached(
    achievement: AchievementEntity,
    user: UserEntity,
  ): Promise<boolean> {
    const companyId = achievement.company.id;

    if (achievement.criterionType === AchievementCriterionType.TOTAL_PHOTOS) {
      const count = await this.wastePhotoRepository.count({
        where: {
          user: { id: user.id },
          company: { id: companyId },
        },
      });
      return count >= achievement.threshold;
    }

    if (achievement.criterionType === AchievementCriterionType.CORRECT_BIN_MATCHES) {
      const count = await this.wastePhotoRepository
        .createQueryBuilder('wp')
        .where('wp.userId = :userId', { userId: user.id })
        .andWhere('wp.companyId = :companyId', {
          companyId: companyId,
        })
        .andWhere('wp.recommendedBinType IS NOT NULL')
        .getCount();
      return count >= achievement.threshold;
    }

    if (achievement.criterionType === AchievementCriterionType.STREAK_DAYS) {
      const photos = await this.wastePhotoRepository
        .createQueryBuilder('wp')
        .where('wp.userId = :userId', { userId: user.id })
        .andWhere('wp.companyId = :companyId', {
          companyId: companyId,
        })
        .andWhere('wp.recommendedBinType IS NOT NULL')
        .orderBy('wp.createdAt', 'ASC')
        .getMany();

      if (photos.length === 0) {
        return false;
      }

      let bestStreak = 1;
      let currentStreak = 1;

      for (let i = 1; i < photos.length; i += 1) {
        const prev = photos[i - 1].createdAt;
        const current = photos[i].createdAt;
        const diffMs = current.getTime() - prev.getTime();
        const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
        if (diffDays === 1) {
          currentStreak += 1;
        } else if (diffDays > 1) {
          if (currentStreak > bestStreak) {
            bestStreak = currentStreak;
          }
          currentStreak = 1;
        }
      }

      if (currentStreak > bestStreak) {
        bestStreak = currentStreak;
      }

      return bestStreak >= achievement.threshold;
    }

    return false;
  }
}


