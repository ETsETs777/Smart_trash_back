import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import DataLoader from 'dataloader';
import { CompanyEntity } from 'src/entities/smart-trash/company.entity';

/**
 * DataLoader for Company entities
 * Solves N+1 problem when loading companies by IDs
 */
@Injectable()
export class CompanyLoader {
  private readonly loader: DataLoader<string, CompanyEntity | null>;

  constructor(
    @InjectRepository(CompanyEntity)
    private readonly companyRepository: Repository<CompanyEntity>,
  ) {
    this.loader = new DataLoader<string, CompanyEntity | null>(
      async (ids: readonly string[]) => {
        const companies = await this.companyRepository.find({
          where: ids.map((id) => ({ id })),
          relations: ['logo', 'createdBy', 'createdBy.logo'],
        });

        // Create a map for quick lookup
        const companyMap = new Map<string, CompanyEntity>();
        companies.forEach((company) => {
          companyMap.set(company.id, company);
        });

        // Return companies in the same order as requested IDs
        return ids.map((id) => companyMap.get(id) || null);
      },
      {
        cache: true,
        maxBatchSize: 100,
      },
    );
  }

  async load(id: string): Promise<CompanyEntity | null> {
    return this.loader.load(id);
  }

  async loadMany(ids: string[]): Promise<(CompanyEntity | null)[]> {
    const results = await this.loader.loadMany(ids);
    return results.map((result) => (result instanceof Error ? null : result));
  }
}

