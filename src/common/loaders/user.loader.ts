import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import DataLoader from 'dataloader';
import { UserEntity } from 'src/entities/smart-trash/user.entity';

/**
 * DataLoader for User entities
 * Solves N+1 problem when loading users by IDs
 */
@Injectable()
export class UserLoader {
  private readonly loader: DataLoader<string, UserEntity | null>;

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {
    this.loader = new DataLoader<string, UserEntity | null>(
      async (ids: readonly string[]) => {
        const users = await this.userRepository.find({
          where: ids.map((id) => ({ id })),
          relations: ['logo', 'employeeCompanies', 'employeeCompanies.logo', 'createdCompanies', 'createdCompanies.logo'],
        });

        // Create a map for quick lookup
        const userMap = new Map<string, UserEntity>();
        users.forEach((user) => {
          userMap.set(user.id, user);
        });

        // Return users in the same order as requested IDs
        return ids.map((id) => userMap.get(id) || null);
      },
      {
        cache: true,
        maxBatchSize: 100,
      },
    );
  }

  async load(id: string): Promise<UserEntity | null> {
    return this.loader.load(id);
  }

  async loadMany(ids: string[]): Promise<(UserEntity | null)[]> {
    return this.loader.loadMany(ids);
  }
}

