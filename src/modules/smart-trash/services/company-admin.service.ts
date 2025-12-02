import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyAdminEntity } from 'src/entities/smart-trash/company-admin.entity';
import { CompanyEntity } from 'src/entities/smart-trash/company.entity';
import { CompanyAdminRegisterInput } from '../inputs/company-admin-register.input';

@Injectable()
export class CompanyAdminService {
  constructor(
    @InjectRepository(CompanyAdminEntity)
    private readonly adminRepository: Repository<CompanyAdminEntity>,
    @InjectRepository(CompanyEntity)
    private readonly companyRepository: Repository<CompanyEntity>,
  ) {}

  async registerAdminWithCompany(
    input: CompanyAdminRegisterInput,
  ): Promise<CompanyAdminEntity> {
    const company = this.companyRepository.create({
      name: input.companyName,
      description: input.companyDescription,
    });
    await this.companyRepository.save(company);

    const admin = this.adminRepository.create({
      email: input.email,
      passwordHash: input.password,
      firstName: input.firstName,
      lastName: input.lastName,
      company,
    });
    return this.adminRepository.save(admin);
  }

  async findAdminById(id: string): Promise<CompanyAdminEntity> {
    const admin = await this.adminRepository.findOne({
      where: { id },
      relations: ['company'],
    });
    if (!admin) {
      throw new NotFoundException('Администратор компании не найден');
    }
    return admin;
  }
}


