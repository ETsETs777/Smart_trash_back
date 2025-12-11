import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyEntity } from 'src/entities/smart-trash/company.entity';
import { UserEntity } from 'src/entities/smart-trash/user.entity';
import { ImageEntity } from 'src/entities/files/image.entity';
import { CompanyCreateInput } from '../inputs/company-create.input';
import { CompanyUpdateInput } from '../inputs/company-update.input';
import { JwtPayload } from 'src/modules/auth/jwt-payload.interface';
import { AuthRole } from 'src/modules/auth/auth-role.enum';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(CompanyEntity)
    private readonly companyRepository: Repository<CompanyEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(ImageEntity)
    private readonly imageRepository: Repository<ImageEntity>,
  ) {}

  async createCompany(input: CompanyCreateInput, adminPayload: JwtPayload): Promise<CompanyEntity> {
    if (adminPayload.role !== AuthRole.ADMIN_COMPANY) {
      throw new ForbiddenException('Создавать компании может только администратор компании');
    }

    const user = await this.userRepository.findOne({
      where: { id: adminPayload.sub },
      relations: ['createdCompanies'],
    });

    if (!user) {
      throw new ForbiddenException('Администратор не найден');
    }

    let logo: ImageEntity | null = null;
    if (input.logoId) {
      logo = await this.imageRepository.findOne({
        where: { id: input.logoId },
      });
      if (!logo) {
        throw new NotFoundException('Изображение логотипа не найдено');
      }
    }

    const company = this.companyRepository.create({
      name: input.name,
      description: input.description,
      isActive: true,
      createdBy: user,
      logo: logo ?? undefined,
    });

    const savedCompany = await this.companyRepository.save(company);
    return this.companyRepository.findOneOrFail({
      where: { id: savedCompany.id },
      relations: ['logo', 'createdBy', 'createdBy.logo'],
    });
  }

  async updateCompany(input: CompanyUpdateInput, adminPayload: JwtPayload): Promise<CompanyEntity> {
    if (adminPayload.role !== AuthRole.ADMIN_COMPANY) {
      throw new ForbiddenException('Обновлять компании может только администратор компании');
    }

    const company = await this.companyRepository.findOne({
      where: { id: input.id },
      relations: ['logo', 'createdBy', 'createdBy.logo'],
    });

    if (!company) {
      throw new NotFoundException('Компания не найдена');
    }

    const admin = await this.userRepository.findOne({
      where: { id: adminPayload.sub },
      relations: ['createdCompanies'],
    });

    if (!admin) {
      throw new NotFoundException('Администратор не найден');
    }

    const isAdminOfCompany = admin.createdCompanies?.some((c) => c.id === company.id);

    if (!isAdminOfCompany) {
      throw new ForbiddenException('Администратор не может изменять чужую компанию');
    }

    if (typeof input.name === 'string') {
      company.name = input.name;
    }
    if (typeof input.description !== 'undefined') {
      company.description = input.description ?? null;
    }
    if (typeof input.isActive === 'boolean') {
      company.isActive = input.isActive;
    }
    if (typeof input.logoId !== 'undefined') {
      if (input.logoId) {
        const logo = await this.imageRepository.findOne({
          where: { id: input.logoId },
        });
        if (!logo) {
          throw new NotFoundException('Изображение логотипа не найдено');
        }
        company.logo = logo;
      } else {
        company.logo = null;
      }
    }

    const savedCompany = await this.companyRepository.save(company);
    return this.companyRepository.findOneOrFail({
      where: { id: savedCompany.id },
      relations: ['logo', 'createdBy', 'createdBy.logo'],
    });
  }

  async deleteCompany(id: string, adminPayload: JwtPayload): Promise<boolean> {
    if (adminPayload.role !== AuthRole.ADMIN_COMPANY) {
      throw new ForbiddenException('Удалять компанию может только администратор компании');
    }

    const company = await this.companyRepository.findOne({
      where: { id },
      relations: ['createdBy'],
    });

    if (!company) {
      throw new NotFoundException('Компания не найдена');
    }

    const admin = await this.userRepository.findOne({
      where: { id: adminPayload.sub },
      relations: ['createdCompanies'],
    });

    if (!admin) {
      throw new NotFoundException('Администратор не найден');
    }

    const isAdminOfCompany = admin.createdCompanies?.some((c) => c.id === company.id);

    if (!isAdminOfCompany) {
      throw new ForbiddenException('Администратор не может удалять чужую компанию');
    }

    await this.companyRepository.remove(company);
    return true;
  }

  async getAllCompaniesForCurrentUser(payload: JwtPayload): Promise<CompanyEntity[]> {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      relations: ['employeeCompanies', 'employeeCompanies.logo', 'createdCompanies', 'createdCompanies.logo'],
    });

    if (!user) {
      return [];
    }

    if (payload.role === AuthRole.EMPLOYEE && user.employeeCompanies) {
      return user.employeeCompanies;
    }

    if (payload.role === AuthRole.ADMIN_COMPANY && user.createdCompanies) {
      return user.createdCompanies;
    }

    return [];
  }

  async getCompanyByIdForCurrentUser(id: string, payload: JwtPayload): Promise<CompanyEntity> {
    const company = await this.companyRepository.findOne({
      where: { id },
      relations: ['logo', 'createdBy', 'createdBy.logo'],
    });

    if (!company) {
      throw new NotFoundException('Компания не найдена');
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      relations: ['employeeCompanies', 'createdCompanies'],
    });

    if (!user) {
      throw new ForbiddenException('Пользователь не найден');
    }

    if (payload.role === AuthRole.EMPLOYEE) {
      const isEmployeeInCompany = user.employeeCompanies?.some((c) => c.id === company.id);
      if (!isEmployeeInCompany) {
        throw new ForbiddenException('Сотрудник не может просматривать чужую компанию');
      }
    } else if (payload.role === AuthRole.ADMIN_COMPANY) {
      const isAdminOfCompany = user.createdCompanies?.some((c) => c.id === company.id);
      if (!isAdminOfCompany) {
        throw new ForbiddenException('Администратор не может просматривать чужую компанию');
      }
    } else {
      throw new ForbiddenException('Недостаточно прав для доступа к компании');
    }

    return company;
  }

  async getCompanyByQRCode(qrCode: string): Promise<CompanyEntity> {
    // Сначала пытаемся найти по qrCode полю
    let company = await this.companyRepository.findOne({
      where: { qrCode },
      relations: ['logo'],
    });

    // Если не найдено, пытаемся найти по ID (для обратной совместимости)
    if (!company) {
      company = await this.companyRepository.findOne({
        where: { id: qrCode },
        relations: ['logo'],
      });
    }

    if (!company) {
      throw new NotFoundException('Компания с указанным QR кодом не найдена');
    }

    if (!company.isActive) {
      throw new BadRequestException('Компания неактивна');
    }

    // Если qrCode не был установлен, устанавливаем его для будущих запросов
    if (!company.qrCode) {
      company.qrCode = company.id;
      await this.companyRepository.save(company);
    }

    return company;
  }
}


