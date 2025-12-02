import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AchievementEntity } from 'src/entities/smart-trash/achievement.entity';
import { CompanyEntity } from 'src/entities/smart-trash/company.entity';
import { CompanyAdminEntity } from 'src/entities/smart-trash/company-admin.entity';
import { EmployeeEntity } from 'src/entities/smart-trash/employee.entity';
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
    @InjectRepository(CompanyAdminEntity)
    private readonly adminRepository: Repository<CompanyAdminEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>,
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

    let admin: CompanyAdminEntity | null = null;
    if (input.createdByAdminId) {
      admin = await this.adminRepository.findOneBy({
        id: input.createdByAdminId,
      });
      if (!admin) {
        throw new NotFoundException('Администратор компании не найден');
      }
    }

    const achievement = this.achievementRepository.create({
      title: input.title,
      description: input.description,
      criterionType: input.criterionType,
      threshold: input.threshold,
      company,
      createdBy: admin ?? undefined,
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
    if (!wastePhoto.employee || !wastePhoto.company) {
      return [];
    }

    const employee = await this.employeeRepository.findOne({
      where: { id: wastePhoto.employee.id },
      relations: ['company'],
    });
    if (!employee) {
      throw new NotFoundException('Сотрудник не найден для выдачи ачивок');
    }

    const achievements = await this.achievementRepository.find({
      where: { company: { id: wastePhoto.company.id } },
    });

    const alreadyEarned = await this.employeeAchievementRepository.find({
      where: {
        employee: { id: employee.id },
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
      const reached = await this.isCriterionReached(achievement, employee);
      if (reached) {
        toGrant.push(achievement);
      }
    }

    const created: EmployeeAchievementEntity[] = [];

    for (const achievement of toGrant) {
      const ea = this.employeeAchievementRepository.create({
        employee,
        achievement,
      });
      created.push(await this.employeeAchievementRepository.save(ea));
    }

    return created;
  }

  private async isCriterionReached(
    achievement: AchievementEntity,
    employee: EmployeeEntity,
  ): Promise<boolean> {
    if (achievement.criterionType === AchievementCriterionType.TOTAL_PHOTOS) {
      const count = await this.wastePhotoRepository.count({
        where: {
          employee: { id: employee.id },
          company: { id: employee.company.id },
        },
      });
      return count >= achievement.threshold;
    }

    if (achievement.criterionType === AchievementCriterionType.CORRECT_BIN_MATCHES) {
      const count = await this.wastePhotoRepository
        .createQueryBuilder('wp')
        .where('wp.employeeId = :employeeId', { employeeId: employee.id })
        .andWhere('wp.companyId = :companyId', {
          companyId: employee.company.id,
        })
        .andWhere('wp.recommendedBinType IS NOT NULL')
        .getCount();
      return count >= achievement.threshold;
    }

    if (achievement.criterionType === AchievementCriterionType.STREAK_DAYS) {
      const photos = await this.wastePhotoRepository
        .createQueryBuilder('wp')
        .where('wp.employeeId = :employeeId', { employeeId: employee.id })
        .andWhere('wp.companyId = :companyId', {
          companyId: employee.company.id,
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


