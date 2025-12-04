import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { WastePhotoEntity } from 'src/entities/smart-trash/waste-photo.entity';
import { UserEntity } from 'src/entities/smart-trash/user.entity';
import { CollectionAreaEntity } from 'src/entities/smart-trash/collection-area.entity';
import { TrashBinType } from 'src/entities/smart-trash/trash-bin-type.enum';
import {
  CompanyAnalyticsSummary,
  CompanyBinUsageStats,
  CompanyLeaderboardEntry,
  CollectionAreaStats,
} from './analytics.types';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(WastePhotoEntity)
    private readonly wastePhotoRepository: Repository<WastePhotoEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(CollectionAreaEntity)
    private readonly areaRepository: Repository<CollectionAreaEntity>,
  ) {}

  async getCompanyAnalytics(companyId: string): Promise<CompanyAnalyticsSummary> {
    const [binUsage, leaderboard, hallOfFame, areas] = await Promise.all([
      this.getCompanyBinUsage(companyId),
      this.getCompanyLeaderboard(companyId, 10),
      this.getCompanyLeaderboard(companyId, 3),
      this.getCompanyAreaStats(companyId),
    ]);

    return {
      companyId,
      binUsage,
      leaderboard,
      hallOfFame,
      areas,
    };
  }

  async getCompanyBinUsage(companyId: string): Promise<CompanyBinUsageStats[]> {
    const rows = await this.wastePhotoRepository
      .createQueryBuilder('wp')
      .select('wp.recommendedBinType', 'binType')
      .addSelect('COUNT(*)', 'count')
      .where('wp.companyId = :companyId', { companyId })
      .andWhere('wp.recommendedBinType IS NOT NULL')
      .groupBy('wp.recommendedBinType')
      .orderBy('count', 'DESC')
      .getRawMany<{ binType: TrashBinType; count: string }>();

    return rows.map((row) => ({
      binType: row.binType,
      count: Number(row.count),
    }));
  }

  async getCompanyLeaderboard(
    companyId: string,
    limit: number,
  ): Promise<CompanyLeaderboardEntry[]> {
    const rows = await this.wastePhotoRepository
      .createQueryBuilder('wp')
      .select('wp.userId', 'userId')
      .addSelect('COUNT(*)', 'count')
      .where('wp.companyId = :companyId', { companyId })
      .andWhere('wp.userId IS NOT NULL')
      .andWhere('wp.recommendedBinType IS NOT NULL')
      .groupBy('wp.userId')
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany<{ userId: string; count: string }>();

    const userIds = rows.map((row) => row.userId);
    if (userIds.length === 0) {
      return [];
    }

    const users = await this.userRepository.find({
      where: { id: In(userIds) },
      relations: ['logo'],
    });
    const usersById = new Map(users.map((u) => [u.id, u]));

    return rows
      .map<CompanyLeaderboardEntry | null>((row) => {
        const user = usersById.get(row.userId);
        if (!user) {
          return null;
        }
        return {
          employee: user,
          totalClassifiedPhotos: Number(row.count),
        };
      })
      .filter((entry): entry is CompanyLeaderboardEntry => entry !== null);
  }

  async getCompanyAreaStats(companyId: string): Promise<CollectionAreaStats[]> {
    const rows = await this.wastePhotoRepository
      .createQueryBuilder('wp')
      .select('wp.collectionAreaId', 'areaId')
      .addSelect('COUNT(*)', 'count')
      .where('wp.companyId = :companyId', { companyId })
      .andWhere('wp.collectionAreaId IS NOT NULL')
      .groupBy('wp.collectionAreaId')
      .orderBy('count', 'DESC')
      .getRawMany<{ areaId: string; count: string }>();

    const areaIds = rows.map((row) => row.areaId);
    if (areaIds.length === 0) {
      return [];
    }

    const areas = await this.areaRepository.findBy({
      id: In(areaIds),
    });
    const areasById = new Map(areas.map((a) => [a.id, a]));

    return rows
      .map<CollectionAreaStats | null>((row) => {
        const area = areasById.get(row.areaId);
        if (!area) {
          return null;
        }
        return {
          area,
          totalPhotos: Number(row.count),
        };
      })
      .filter((item): item is CollectionAreaStats => item !== null);
  }
}


