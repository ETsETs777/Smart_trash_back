import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { UserEntity, UserRole } from 'src/entities/smart-trash/user.entity';
import { CompanyEntity } from 'src/entities/smart-trash/company.entity';
import { EmployeeCreateInput } from '../inputs/employee-create.input';
import { EmployeeConfirmInput } from '../inputs/employee-confirm.input';
import { JwtPayload } from 'src/modules/auth/jwt-payload.interface';
import { AuthRole } from 'src/modules/auth/auth-role.enum';
import { EmailService } from 'src/modules/auth/services/email.service';

@Injectable()
export class EmployeeService {
  private readonly logger = new Logger(EmployeeService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(CompanyEntity)
    private readonly companyRepository: Repository<CompanyEntity>,
    private readonly emailService: EmailService,
  ) {}

  async createEmployee(
    input: EmployeeCreateInput,
    adminPayload: JwtPayload,
  ): Promise<UserEntity> {
    if (adminPayload.role !== AuthRole.ADMIN_COMPANY) {
      throw new ForbiddenException('Только администратор компании может создавать сотрудников');
    }

    if (!input.email) {
      throw new BadRequestException('Email обязателен для создания сотрудника');
    }

    const normalizedEmail = input.email.trim().toLowerCase();
    const fullName = `${input.firstName} ${input.lastName}`.trim();

    const company = await this.companyRepository.findOne({
      where: { id: input.companyId },
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

    const isAdminOfCompany = admin.createdCompanies?.some((c) => c.id === input.companyId);

    if (!isAdminOfCompany) {
      throw new ForbiddenException('Администратор не может управлять этой компанией');
    }

    const existingUser = await this.userRepository.findOne({
      where: { email: normalizedEmail },
      relations: ['employeeCompanies'],
    });

    if (existingUser) {
      if (existingUser.isEmailConfirmed) {
        throw new ConflictException('Пользователь с таким email уже зарегистрирован и подтверждён');
      }

      if (existingUser.employeeCompanies && existingUser.employeeCompanies.length > 0) {
        throw new BadRequestException('Пользователь уже состоит в компании');
      }

      const emailConfirmationToken = this.generateEmailConfirmationToken();
      existingUser.fullName = fullName;
      existingUser.role = UserRole.EMPLOYEE;
      existingUser.employeeCompanies = [company];
      existingUser.isEmployeeConfirmed = false;
      existingUser.emailConfirmationToken = emailConfirmationToken;
      existingUser.isEmailConfirmed = false;

      const savedUser = await this.userRepository.save(existingUser);
      const userWithRelations = await this.userRepository.findOneOrFail({
        where: { id: savedUser.id },
        relations: ['logo', 'employeeCompanies', 'employeeCompanies.logo'],
      });

      await this.emailService.sendConfirmationEmail(
        normalizedEmail,
        userWithRelations.fullName,
        emailConfirmationToken,
      );

      this.logger.log(
        `Сотрудник ${normalizedEmail} создан администратором (ожидает подтверждения email)`,
      );

      return userWithRelations;
    }

    const emailConfirmationToken = this.generateEmailConfirmationToken();

    const user = this.userRepository.create({
      email: normalizedEmail,
      passwordHash: crypto.randomBytes(32).toString('hex'),
      fullName,
      role: UserRole.EMPLOYEE,
      employeeCompanies: [company],
      isEmployeeConfirmed: false,
      emailConfirmationToken,
      isEmailConfirmed: false,
    });

    const savedUser = await this.userRepository.save(user);
    const userWithRelations = await this.userRepository.findOneOrFail({
      where: { id: savedUser.id },
      relations: ['logo', 'employeeCompanies', 'employeeCompanies.logo'],
    });

    await this.emailService.sendConfirmationEmail(
      normalizedEmail,
      userWithRelations.fullName,
      emailConfirmationToken,
    );

    this.logger.log(
      `Сотрудник ${normalizedEmail} создан администратором (ожидает подтверждения email)`,
    );

    return userWithRelations;
  }

  private generateEmailConfirmationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async confirmEmployee(
    input: EmployeeConfirmInput,
    adminPayload: JwtPayload,
  ): Promise<UserEntity> {
    if (adminPayload.role !== AuthRole.ADMIN_COMPANY) {
      throw new ForbiddenException('Только администратор компании может подтверждать сотрудников');
    }

    const employee = await this.userRepository.findOne({
      where: { id: input.employeeId },
      relations: ['employeeCompanies'],
    });

    if (!employee) {
      throw new NotFoundException('Сотрудник не найден');
    }

    if (employee.role !== UserRole.EMPLOYEE) {
      throw new BadRequestException('Пользователь не является сотрудником');
    }

    const company = await this.companyRepository.findOne({
      where: { id: input.companyId },
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

    const isAdminOfCompany = admin.createdCompanies?.some((c) => c.id === input.companyId);

    if (!isAdminOfCompany) {
      throw new ForbiddenException('Администратор не может управлять этой компанией');
    }

    const isEmployeeInCompany = employee.employeeCompanies?.some((c) => c.id === input.companyId);

    if (!isEmployeeInCompany) {
      throw new BadRequestException('Сотрудник не состоит в этой компании');
    }

    employee.isEmployeeConfirmed = input.isConfirmed;
    const savedEmployee = await this.userRepository.save(employee);
    return this.userRepository.findOneOrFail({
      where: { id: savedEmployee.id },
      relations: ['logo', 'employeeCompanies', 'employeeCompanies.logo'],
    });
  }
}


