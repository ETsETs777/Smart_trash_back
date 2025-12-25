import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CollectionAreaBinEntity } from 'src/entities/smart-trash/collection-area-bin.entity';
import { CollectionAreaEntity } from 'src/entities/smart-trash/collection-area.entity';
import { UserEntity } from 'src/entities/smart-trash/user.entity';
import { CollectionAreaBinCreateInput } from '../inputs/collection-area-bin-create.input';
import { CollectionAreaBinUpdateInput } from '../inputs/collection-area-bin-update.input';
import { CollectionAreaBinsAddInput } from '../inputs/collection-area-bins-add.input';
import { JwtPayload } from 'src/modules/auth/jwt-payload.interface';
import { AuthRole } from 'src/modules/auth/auth-role.enum';
import { CacheService } from 'src/common/cache/cache.service';

@Injectable()
export class CollectionAreaBinService {
  constructor(
    @InjectRepository(CollectionAreaBinEntity)
    private readonly binRepository: Repository<CollectionAreaBinEntity>,
    @InjectRepository(CollectionAreaEntity)
    private readonly areaRepository: Repository<CollectionAreaEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly cacheService: CacheService,
  ) {}

  async getAllBinsForArea(
    areaId: string,
    payload: JwtPayload,
  ): Promise<CollectionAreaBinEntity[]> {
    const area = await this.areaRepository.findOne({
      where: { id: areaId },
      relations: ['company', 'company.logo', 'company.createdBy', 'company.createdBy.logo'],
    });

    if (!area) {
      throw new NotFoundException('Точка сбора не найдена');
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      relations: ['employeeCompanies', 'createdCompanies'],
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    if (payload.role === AuthRole.EMPLOYEE) {
      const isEmployeeInCompany = user.employeeCompanies?.some((c) => c.id === area.company.id);
      if (!isEmployeeInCompany) {
        throw new ForbiddenException('Сотрудник не может просматривать мусорки чужой компании');
      }
    } else if (payload.role === AuthRole.ADMIN_COMPANY) {
      const isAdminOfCompany = user.createdCompanies?.some((c) => c.id === area.company.id);
      if (!isAdminOfCompany) {
        throw new ForbiddenException('Администратор не может просматривать мусорки чужой компании');
      }
    } else {
      throw new ForbiddenException('Недостаточно прав для просмотра мусорок');
    }

    return this.binRepository.find({
      where: { area: { id: areaId } },
      relations: ['area', 'area.company', 'area.company.logo', 'area.company.createdBy', 'area.company.createdBy.logo'],
      order: { type: 'ASC' },
    });
  }

  async getBinById(
    id: string,
    payload: JwtPayload,
  ): Promise<CollectionAreaBinEntity> {
    const bin = await this.binRepository.findOne({
      where: { id },
      relations: ['area', 'area.company', 'area.company.logo', 'area.company.createdBy', 'area.company.createdBy.logo'],
    });

    if (!bin) {
      throw new NotFoundException('Мусорка не найдена');
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      relations: ['employeeCompanies', 'createdCompanies'],
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    if (payload.role === AuthRole.EMPLOYEE) {
      const isEmployeeInCompany = user.employeeCompanies?.some((c) => c.id === bin.area.company.id);
      if (!isEmployeeInCompany) {
        throw new ForbiddenException('Сотрудник не может просматривать мусорку чужой компании');
      }
    } else if (payload.role === AuthRole.ADMIN_COMPANY) {
      const isAdminOfCompany = user.createdCompanies?.some((c) => c.id === bin.area.company.id);
      if (!isAdminOfCompany) {
        throw new ForbiddenException('Администратор не может просматривать мусорку чужой компании');
      }
    } else {
      throw new ForbiddenException('Недостаточно прав для просмотра мусорки');
    }

    return bin;
  }

  async createBin(
    input: CollectionAreaBinCreateInput,
    adminPayload: JwtPayload,
  ): Promise<CollectionAreaBinEntity> {
    if (adminPayload.role !== AuthRole.ADMIN_COMPANY) {
      throw new ForbiddenException('Создавать мусорки может только администратор компании');
    }

    const area = await this.areaRepository.findOne({
      where: { id: input.areaId },
      relations: ['company', 'company.logo', 'company.createdBy', 'company.createdBy.logo'],
    });

    if (!area) {
      throw new NotFoundException('Точка сбора не найдена');
    }

    if (!area.company.isActive) {
      throw new BadRequestException('Компания неактивна. Невозможно создать мусорку');
    }

    const user = await this.userRepository.findOne({
      where: { id: adminPayload.sub },
      relations: ['createdCompanies'],
    });

    if (!user) {
      throw new NotFoundException('Администратор не найден');
    }

    const isAdminOfCompany = user.createdCompanies?.some((c) => c.id === area.company.id);

    if (!isAdminOfCompany) {
      throw new ForbiddenException('Администратор не может управлять мусорками чужой компании');
    }

    const existingBin = await this.binRepository.findOne({
      where: {
        area: { id: input.areaId },
        type: input.type,
      },
    });

    if (existingBin) {
      throw new BadRequestException('Мусорка такого типа уже существует в этой точке сбора');
    }

    const bin = this.binRepository.create({
      type: input.type,
      area,
    });

    const savedBin = await this.binRepository.save(bin);
    
    // Invalidate cache for this area's bins
    await this.cacheService.delete(`query:collectionAreaBins:area:${input.areaId}`);
    
    return this.binRepository.findOneOrFail({
      where: { id: savedBin.id },
      relations: ['area', 'area.company', 'area.company.logo', 'area.company.createdBy', 'area.company.createdBy.logo'],
    });
  }

  async updateBin(
    input: CollectionAreaBinUpdateInput,
    adminPayload: JwtPayload,
  ): Promise<CollectionAreaBinEntity> {
    if (adminPayload.role !== AuthRole.ADMIN_COMPANY) {
      throw new ForbiddenException('Обновлять мусорки может только администратор компании');
    }

    const bin = await this.binRepository.findOne({
      where: { id: input.id },
      relations: ['area', 'area.company', 'area.company.logo', 'area.company.createdBy', 'area.company.createdBy.logo'],
    });

    if (!bin) {
      throw new NotFoundException('Мусорка не найдена');
    }

    if (!bin.area.company.isActive) {
      throw new BadRequestException('Компания неактивна. Невозможно обновить мусорку');
    }

    const user = await this.userRepository.findOne({
      where: { id: adminPayload.sub },
      relations: ['createdCompanies'],
    });

    if (!user) {
      throw new NotFoundException('Администратор не найден');
    }

    const isAdminOfCompany = user.createdCompanies?.some((c) => c.id === bin.area.company.id);

    if (!isAdminOfCompany) {
      throw new ForbiddenException('Администратор не может изменять мусорку чужой компании');
    }

    if (input.type && input.type !== bin.type) {
      const existingBin = await this.binRepository.findOne({
        where: {
          area: { id: bin.area.id },
          type: input.type,
        },
      });

      if (existingBin && existingBin.id !== bin.id) {
        throw new BadRequestException('Мусорка такого типа уже существует в этой точке сбора');
      }

      bin.type = input.type;
    }

    // Update coordinates if provided
    if (input.latitude !== undefined) {
      bin.latitude = input.latitude;
    }
    if (input.longitude !== undefined) {
      bin.longitude = input.longitude;
    }

    const savedBin = await this.binRepository.save(bin);
    
    // Invalidate cache for this area's bins
    await this.cacheService.delete(`query:collectionAreaBins:area:${bin.area.id}`);
    
    return this.binRepository.findOneOrFail({
      where: { id: savedBin.id },
      relations: ['area', 'area.company', 'area.company.logo', 'area.company.createdBy', 'area.company.createdBy.logo'],
    });
  }

  async deleteBin(id: string, adminPayload: JwtPayload): Promise<boolean> {
    if (adminPayload.role !== AuthRole.ADMIN_COMPANY) {
      throw new ForbiddenException('Удалять мусорки может только администратор компании');
    }

    const bin = await this.binRepository.findOne({
      where: { id },
      relations: ['area', 'area.company', 'area.company.logo', 'area.company.createdBy', 'area.company.createdBy.logo'],
    });

    if (!bin) {
      throw new NotFoundException('Мусорка не найдена');
    }

    if (!bin.area.company.isActive) {
      throw new BadRequestException('Компания неактивна. Невозможно удалить мусорку');
    }

    const user = await this.userRepository.findOne({
      where: { id: adminPayload.sub },
      relations: ['createdCompanies'],
    });

    if (!user) {
      throw new NotFoundException('Администратор не найден');
    }

    const isAdminOfCompany = user.createdCompanies?.some((c) => c.id === bin.area.company.id);

    if (!isAdminOfCompany) {
      throw new ForbiddenException('Администратор не может удалять мусорку чужой компании');
    }

    const areaId = bin.area.id;
    await this.binRepository.remove(bin);
    
    // Invalidate cache for this area's bins
    await this.cacheService.delete(`query:collectionAreaBins:area:${areaId}`);
    
    return true;
  }

  async addBinsToArea(
    input: CollectionAreaBinsAddInput,
    adminPayload: JwtPayload,
  ): Promise<CollectionAreaBinEntity[]> {
    if (adminPayload.role !== AuthRole.ADMIN_COMPANY) {
      throw new ForbiddenException('Добавлять мусорки может только администратор компании');
    }

    const area = await this.areaRepository.findOne({
      where: { id: input.areaId },
      relations: ['company', 'company.logo', 'company.createdBy', 'company.createdBy.logo', 'bins'],
    });

    if (!area) {
      throw new NotFoundException('Точка сбора не найдена');
    }

    if (!area.company.isActive) {
      throw new BadRequestException('Компания неактивна. Невозможно добавить мусорки');
    }

    const user = await this.userRepository.findOne({
      where: { id: adminPayload.sub },
      relations: ['createdCompanies'],
    });

    if (!user) {
      throw new NotFoundException('Администратор не найден');
    }

    const isAdminOfCompany = user.createdCompanies?.some((c) => c.id === area.company.id);

    if (!isAdminOfCompany) {
      throw new ForbiddenException('Администратор не может управлять мусорками чужой компании');
    }

    const existingTypes = new Set(
      (area.bins || []).map((bin) => bin.type),
    );

    const binsToCreate: CollectionAreaBinEntity[] = [];

    // Handle bins with coordinates
    if (input.binsWithCoordinates && input.binsWithCoordinates.length > 0) {
      for (const binInput of input.binsWithCoordinates) {
        if (!existingTypes.has(binInput.type)) {
          const bin = this.binRepository.create({
            type: binInput.type,
            area,
            latitude: binInput.coordinates?.latitude || null,
            longitude: binInput.coordinates?.longitude || null,
          });
          binsToCreate.push(bin);
          existingTypes.add(binInput.type);
        }
      }
    }

    // Handle types without coordinates (backward compatibility)
    if (input.types && input.types.length > 0) {
      const typesToAdd = input.types.filter((type) => !existingTypes.has(type));
      const binsWithoutCoords = typesToAdd.map((type) =>
        this.binRepository.create({
          type,
          area,
          latitude: null,
          longitude: null,
        }),
      );
      binsToCreate.push(...binsWithoutCoords);
    }

    if (binsToCreate.length === 0) {
      throw new BadRequestException('Все указанные типы мусорок уже существуют в этой точке сбора');
    }

    const savedBins = await this.binRepository.save(binsToCreate);

    // Invalidate cache for this area's bins
    await this.cacheService.delete(`query:collectionAreaBins:area:${input.areaId}`);

    return this.binRepository.find({
      where: savedBins.map((bin) => ({ id: bin.id })),
      relations: ['area', 'area.company'],
    });
  }
}

