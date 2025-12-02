import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeEntity } from 'src/entities/smart-trash/employee.entity';
import { CompanyEntity } from 'src/entities/smart-trash/company.entity';
import { EmployeeCreateInput } from '../inputs/employee-create.input';
import { EmployeeConfirmInput } from '../inputs/employee-confirm.input';

@Injectable()
export class EmployeeService {
  constructor(
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>,
    @InjectRepository(CompanyEntity)
    private readonly companyRepository: Repository<CompanyEntity>,
  ) {}

  async createEmployee(input: EmployeeCreateInput): Promise<EmployeeEntity> {
    const company = await this.companyRepository.findOneBy({
      id: input.companyId,
    });
    if (!company) {
      throw new NotFoundException('Компания не найдена');
    }

    const employee = this.employeeRepository.create({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      isRegistered: Boolean(input.isRegistered),
      company,
    });
    return this.employeeRepository.save(employee);
  }

  async createOrFindAnonymousEmployee(args: {
    companyId: string;
    firstName: string;
    lastName: string;
  }): Promise<EmployeeEntity> {
    const company = await this.companyRepository.findOneBy({
      id: args.companyId,
    });
    if (!company) {
      throw new NotFoundException('Компания не найдена');
    }

    const normalizedFirstName = args.firstName.trim();
    const normalizedLastName = args.lastName.trim();

    const existed = await this.employeeRepository.findOne({
      where: {
        company: { id: company.id },
        firstName: normalizedFirstName,
        lastName: normalizedLastName,
      },
      relations: ['company'],
    });
    if (existed) {
      return existed;
    }

    const employee = this.employeeRepository.create({
      firstName: normalizedFirstName,
      lastName: normalizedLastName,
      isRegistered: false,
      isConfirmed: false,
      company,
    });
    return this.employeeRepository.save(employee);
  }

  async confirmEmployee(
    input: EmployeeConfirmInput,
  ): Promise<EmployeeEntity> {
    const employee = await this.employeeRepository.findOne({
      where: { id: input.employeeId },
      relations: ['company'],
    });
    if (!employee) {
      throw new NotFoundException('Сотрудник не найден');
    }
    employee.isConfirmed = input.isConfirmed;
    return this.employeeRepository.save(employee);
  }
}


