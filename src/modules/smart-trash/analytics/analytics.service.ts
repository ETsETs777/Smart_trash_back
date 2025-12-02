import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { WastePhotoEntity } from 'src/entities/smart-trash/waste-photo.entity';
import { EmployeeEntity } from 'src/entities/smart-trash/employee.entity';
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
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>,
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
      .select('wp.employeeId', 'employeeId')
      .addSelect('COUNT(*)', 'count')
      .where('wp.companyId = :companyId', { companyId })
      .andWhere('wp.employeeId IS NOT NULL')
      .andWhere('wp.recommendedBinType IS NOT NULL')
      .groupBy('wp.employeeId')
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany<{ employeeId: string; count: string }>();

    const employeeIds = rows.map((row) => row.employeeId);
    if (employeeIds.length === 0) {
      return [];
    }

    const employees = await this.employeeRepository.findBy({
      id: In(employeeIds),
    });
    const employeesById = new Map(employees.map((e) => [e.id, e]));

    return rows
      .map<CompanyLeaderboardEntry | null>((row) => {
        const employee = employeesById.get(row.employeeId);
        if (!employee) {
          return null;
        }
        return {
          employee,
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


