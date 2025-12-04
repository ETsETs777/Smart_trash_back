import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyEntity } from 'src/entities/smart-trash/company.entity';
import { CollectionAreaEntity } from 'src/entities/smart-trash/collection-area.entity';
import { CollectionAreaBinEntity } from 'src/entities/smart-trash/collection-area-bin.entity';
import { UserEntity } from 'src/entities/smart-trash/user.entity';
import { CollectionAreaCreateInput } from '../inputs/collection-area-create.input';
import { CollectionAreaUpdateInput } from '../inputs/collection-area-update.input';
import { JwtPayload } from 'src/modules/auth/jwt-payload.interface';
import { AuthRole } from 'src/modules/auth/auth-role.enum';

@Injectable()
export class CollectionAreaService {
  constructor(
    @InjectRepository(CompanyEntity)
    private readonly companyRepository: Repository<CompanyEntity>,
    @InjectRepository(CollectionAreaEntity)
    private readonly areaRepository: Repository<CollectionAreaEntity>,
    @InjectRepository(CollectionAreaBinEntity)
    private readonly binRepository: Repository<CollectionAreaBinEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async createAreaWithBins(
    input: CollectionAreaCreateInput,
    adminPayload: JwtPayload,
  ): Promise<CollectionAreaEntity> {
    if (adminPayload.role !== AuthRole.ADMIN_COMPANY) {
      throw new ForbiddenException('Создавать точки сбора может только администратор компании');
    }

    const user = await this.userRepository.findOne({
      where: { id: adminPayload.sub },
      relations: ['createdCompanies'],
    });

    if (!user) {
      throw new NotFoundException('Администратор не найден');
    }

    const company = await this.companyRepository.findOne({
      where: { id: input.companyId },
      relations: ['createdBy', 'logo'],
    });

    if (!company) {
      throw new NotFoundException('Компания не найдена');
    }

    if (!company.isActive) {
      throw new BadRequestException('Компания неактивна. Невозможно создать точку сбора');
    }

    const isAdminOfCompany = user.createdCompanies?.some((c) => c.id === company.id);

    if (!isAdminOfCompany) {
      throw new ForbiddenException('Администратор не может управлять этой компанией');
    }

    const area = this.areaRepository.create({
      name: input.name,
      description: input.description,
      company,
    });
    const savedArea = await this.areaRepository.save(area);

    const bins = input.presentBinTypes.map((type) =>
      this.binRepository.create({
        type,
        area: savedArea,
      }),
    );
    await this.binRepository.save(bins);

    return this.areaRepository.findOneOrFail({
      where: { id: savedArea.id },
      relations: ['bins', 'company', 'company.logo', 'company.createdBy', 'company.createdBy.logo'],
    });
  }

  async getAllAreasForCompany(
    companyId: string,
    payload: JwtPayload,
  ): Promise<CollectionAreaEntity[]> {
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException('Компания не найдена');
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      relations: ['employeeCompanies', 'createdCompanies'],
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    if (payload.role === AuthRole.EMPLOYEE) {
      const isEmployeeInCompany = user.employeeCompanies?.some((c) => c.id === companyId);
      if (!isEmployeeInCompany) {
        throw new ForbiddenException('Сотрудник не может просматривать точки сбора чужой компании');
      }
    } else if (payload.role === AuthRole.ADMIN_COMPANY) {
      const isAdminOfCompany = user.createdCompanies?.some((c) => c.id === companyId);
      if (!isAdminOfCompany) {
        throw new ForbiddenException('Администратор не может просматривать точки сбора чужой компании');
      }
    } else {
      throw new ForbiddenException('Недостаточно прав для просмотра точек сбора');
    }

    return this.areaRepository.find({
      where: { company: { id: companyId } },
      relations: ['bins', 'company', 'company.logo', 'company.createdBy', 'company.createdBy.logo'],
      order: { createdAt: 'DESC' },
    });
  }

  async getAreaById(
    id: string,
    payload: JwtPayload,
  ): Promise<CollectionAreaEntity> {
    const area = await this.areaRepository.findOne({
      where: { id },
      relations: ['bins', 'company', 'company.logo', 'company.createdBy', 'company.createdBy.logo'],
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
        throw new ForbiddenException('Сотрудник не может просматривать точку сбора чужой компании');
      }
    } else if (payload.role === AuthRole.ADMIN_COMPANY) {
      const isAdminOfCompany = user.createdCompanies?.some((c) => c.id === area.company.id);
      if (!isAdminOfCompany) {
        throw new ForbiddenException('Администратор не может просматривать точку сбора чужой компании');
      }
    } else {
      throw new ForbiddenException('Недостаточно прав для просмотра точки сбора');
    }

    return area;
  }

  async updateArea(
    input: CollectionAreaUpdateInput,
    adminPayload: JwtPayload,
  ): Promise<CollectionAreaEntity> {
    if (adminPayload.role !== AuthRole.ADMIN_COMPANY) {
      throw new ForbiddenException('Обновлять точки сбора может только администратор компании');
    }

    const area = await this.areaRepository.findOne({
      where: { id: input.id },
      relations: ['company', 'company.createdBy', 'company.logo'],
    });

    if (!area) {
      throw new NotFoundException('Точка сбора не найдена');
    }

    if (!area.company.isActive) {
      throw new BadRequestException('Компания неактивна. Невозможно обновить точку сбора');
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
      throw new ForbiddenException('Администратор не может изменять точку сбора чужой компании');
    }

    if (typeof input.name === 'string') {
      area.name = input.name.trim();
    }
    if (typeof input.description !== 'undefined') {
      area.description = input.description ?? null;
    }

    const savedArea = await this.areaRepository.save(area);
    return this.areaRepository.findOneOrFail({
      where: { id: savedArea.id },
      relations: ['bins', 'company', 'company.logo', 'company.createdBy', 'company.createdBy.logo'],
    });
  }

  async deleteArea(id: string, adminPayload: JwtPayload): Promise<boolean> {
    if (adminPayload.role !== AuthRole.ADMIN_COMPANY) {
      throw new ForbiddenException('Удалять точки сбора может только администратор компании');
    }

    const area = await this.areaRepository.findOne({
      where: { id },
      relations: ['company', 'company.createdBy', 'company.logo'],
    });

    if (!area) {
      throw new NotFoundException('Точка сбора не найдена');
    }

    if (!area.company.isActive) {
      throw new BadRequestException('Компания неактивна. Невозможно удалить точку сбора');
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
      throw new ForbiddenException('Администратор не может удалять точку сбора чужой компании');
    }

    await this.areaRepository.remove(area);
    return true;
  }
}


