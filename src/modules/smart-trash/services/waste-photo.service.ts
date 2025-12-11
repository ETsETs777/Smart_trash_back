import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Repository } from 'typeorm';
import { Queue } from 'bullmq';
import { WastePhotoEntity } from 'src/entities/smart-trash/waste-photo.entity';
import { CompanyEntity } from 'src/entities/smart-trash/company.entity';
import { CollectionAreaEntity } from 'src/entities/smart-trash/collection-area.entity';
import { UserEntity } from 'src/entities/smart-trash/user.entity';
import { ImageEntity } from 'src/entities/files/image.entity';
import { WastePhotoStatus } from 'src/entities/smart-trash/waste-photo-status.enum';
import { WastePhotoCreateInput } from '../inputs/waste-photo-create.input';
import { JwtPayload } from 'src/modules/auth/jwt-payload.interface';
import { AuthRole } from 'src/modules/auth/auth-role.enum';

@Injectable()
export class WastePhotoService {
  constructor(
    @InjectRepository(WastePhotoEntity)
    private readonly wastePhotoRepository: Repository<WastePhotoEntity>,
    @InjectRepository(CompanyEntity)
    private readonly companyRepository: Repository<CompanyEntity>,
    @InjectRepository(CollectionAreaEntity)
    private readonly areaRepository: Repository<CollectionAreaEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(ImageEntity)
    private readonly imageRepository: Repository<ImageEntity>,
    @InjectQueue('waste-classification')
    private readonly queue: Queue,
  ) {}

  async createAndEnqueue(
    input: WastePhotoCreateInput,
  ): Promise<WastePhotoEntity> {
    const company = await this.companyRepository.findOne({
      where: { id: input.companyId },
      relations: ['logo'],
    });
    if (!company) {
      throw new NotFoundException('Компания не найдена');
    }

    if (!company.isActive) {
      throw new BadRequestException('Компания неактивна. Невозможно создать фотографию мусора');
    }

    const image = await this.imageRepository.findOneBy({
      id: input.imageId,
    });
    if (!image) {
      throw new NotFoundException('Изображение не найдено');
    }

    let user: UserEntity | null = null;
    if (input.userId) {
      user = await this.userRepository.findOne({
        where: { id: input.userId },
        relations: ['employeeCompanies', 'logo'],
      });
      if (!user) {
        throw new NotFoundException('Пользователь не найден');
      }

      const isEmployeeInCompany = user.employeeCompanies?.some(
        (c) => c.id === input.companyId,
      );
      if (!isEmployeeInCompany) {
        throw new BadRequestException(
          'Пользователь не является сотрудником указанной компании',
        );
      }
    }

    let collectionArea: CollectionAreaEntity | null = null;
    if (input.collectionAreaId) {
      collectionArea = await this.areaRepository.findOne({
        where: { id: input.collectionAreaId },
        relations: ['company', 'company.logo'],
      });
      if (!collectionArea) {
        throw new NotFoundException('Область сбора не найдена');
      }

      if (collectionArea.company.id !== input.companyId) {
        throw new BadRequestException(
          'Область сбора не принадлежит указанной компании',
        );
      }
    }

    const wastePhoto = this.wastePhotoRepository.create({
      company,
      user: user ?? undefined,
      collectionArea: collectionArea ?? undefined,
      image,
      status: WastePhotoStatus.PENDING,
    });
    const saved = await this.wastePhotoRepository.save(wastePhoto);

    await this.queue.add(
      'classify-waste-photo',
      {
        wastePhotoId: saved.id,
      },
      {
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    return this.wastePhotoRepository.findOneOrFail({
      where: { id: saved.id },
      relations: ['company', 'company.logo', 'user', 'user.logo', 'collectionArea', 'image'],
    });
  }

  async findById(id: string): Promise<WastePhotoEntity> {
    const wastePhoto = await this.wastePhotoRepository.findOne({
      where: { id },
      relations: ['company', 'company.logo', 'user', 'user.logo', 'collectionArea', 'image'],
    });

    if (!wastePhoto) {
      throw new NotFoundException('Фотография мусора не найдена');
    }

    return wastePhoto;
  }

  async findMany(params: {
    companyId: string;
    userId?: string | null;
    skip?: number;
    take?: number;
    dateFrom?: Date;
    dateTo?: Date;
    currentUser: JwtPayload;
  }): Promise<WastePhotoEntity[]> {
    const { companyId, userId, skip = 0, take = 50, dateFrom, dateTo, currentUser } = params;

    // Проверка доступа: сотрудник/админ только своей компании
    if (currentUser.role === AuthRole.EMPLOYEE && currentUser.companyId !== companyId) {
      throw new BadRequestException('Нет доступа к истории этой компании');
    }
    if (currentUser.role === AuthRole.ADMIN_COMPANY && currentUser.companyId !== companyId) {
      throw new BadRequestException('Нет доступа к истории этой компании');
    }

    const qb = this.wastePhotoRepository
      .createQueryBuilder('wp')
      .leftJoinAndSelect('wp.image', 'image')
      .leftJoinAndSelect('wp.collectionArea', 'collectionArea')
      .leftJoinAndSelect('wp.company', 'company')
      .leftJoinAndSelect('wp.user', 'user')
      .where('wp.companyId = :companyId', { companyId })
      .orderBy('wp.createdAt', 'DESC')
      .skip(skip)
      .take(take);

    if (userId) {
      qb.andWhere('wp.userId = :userId', { userId });
    }
    if (dateFrom) {
      qb.andWhere('wp.createdAt >= :dateFrom', { dateFrom });
    }
    if (dateTo) {
      qb.andWhere('wp.createdAt <= :dateTo', { dateTo });
    }

    return qb.getMany();
  }
}


