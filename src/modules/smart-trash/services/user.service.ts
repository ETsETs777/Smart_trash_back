import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity, UserRole } from 'src/entities/smart-trash/user.entity';
import { CompanyEntity } from 'src/entities/smart-trash/company.entity';
import { ImageEntity } from 'src/entities/files/image.entity';
import { JwtPayload } from 'src/modules/auth/jwt-payload.interface';
import { AuthRole } from 'src/modules/auth/auth-role.enum';
import { UserUpdateInput } from '../inputs/user-update.input';
import { UserConfirmEmployeeInput } from '../inputs/user-confirm-employee.input';
import { UserAddToCompanyInput } from '../inputs/user-add-to-company.input';
import { UserRemoveFromCompanyInput } from '../inputs/user-remove-from-company.input';
import { UserUpdateEmployeeInput } from '../inputs/user-update-employee.input';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(CompanyEntity)
    private readonly companyRepository: Repository<CompanyEntity>,
    @InjectRepository(ImageEntity)
    private readonly imageRepository: Repository<ImageEntity>,
  ) {}

  async updateSelf(input: UserUpdateInput, payload: JwtPayload): Promise<UserEntity> {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      relations: ['logo'],
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    if (typeof input.fullName === 'string') {
      user.fullName = input.fullName.trim();
    }

    if (typeof input.password === 'string' && input.password.length > 0) {
      user.passwordHash = input.password;
    }

    if (typeof input.logoId !== 'undefined') {
      if (input.logoId) {
        const logo = await this.imageRepository.findOne({
          where: { id: input.logoId },
        });
        if (!logo) {
          throw new NotFoundException('Изображение логотипа не найдено');
        }
        user.logo = logo;
      } else {
        user.logo = null;
      }
    }

    const savedUser = await this.userRepository.save(user);
    return this.userRepository.findOneOrFail({
      where: { id: savedUser.id },
      relations: ['logo', 'employeeCompanies', 'employeeCompanies.logo', 'createdCompanies', 'createdCompanies.logo'],
    });
  }

  async getCompanyEmployees(
    companyId: string,
    adminPayload: JwtPayload,
  ): Promise<UserEntity[]> {
    if (adminPayload.role !== AuthRole.ADMIN_COMPANY) {
      throw new ForbiddenException('Только администратор компании может просматривать сотрудников');
    }

    const company = await this.companyRepository.findOne({
      where: { id: companyId },
      relations: ['createdBy', 'createdBy.logo', 'employees', 'employees.logo'],
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

    const isAdminOfCompany = admin.createdCompanies?.some((c) => c.id === companyId);

    if (!isAdminOfCompany) {
      throw new ForbiddenException('Администратор не может управлять этой компанией');
    }

    return company.employees || [];
  }

  async confirmEmployee(
    input: UserConfirmEmployeeInput,
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
      relations: ['createdBy', 'createdBy.logo', 'employees', 'employees.logo', 'logo'],
    });

    if (!company) {
      throw new NotFoundException('Компания не найдена');
    }

    if (!company.isActive) {
      throw new BadRequestException('Компания неактивна. Невозможно подтвердить сотрудника');
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

  async addEmployeeToCompany(
    input: UserAddToCompanyInput,
    adminPayload: JwtPayload,
  ): Promise<UserEntity> {
    if (adminPayload.role !== AuthRole.ADMIN_COMPANY) {
      throw new ForbiddenException('Только администратор компании может добавлять сотрудников');
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

    if (employee.employeeCompanies && employee.employeeCompanies.length > 0) {
      throw new BadRequestException('Сотрудник уже состоит в компании');
    }

    const company = await this.companyRepository.findOne({
      where: { id: input.companyId },
      relations: ['createdBy', 'createdBy.logo', 'employees', 'employees.logo', 'logo'],
    });

    if (!company) {
      throw new NotFoundException('Компания не найдена');
    }

    if (!company.isActive) {
      throw new BadRequestException('Компания неактивна. Невозможно добавить сотрудника');
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

    if (!employee.employeeCompanies) {
      employee.employeeCompanies = [];
    }

    employee.employeeCompanies.push(company);
    employee.isEmployeeConfirmed = false;

    const savedEmployee = await this.userRepository.save(employee);
    return this.userRepository.findOneOrFail({
      where: { id: savedEmployee.id },
      relations: ['logo', 'employeeCompanies', 'employeeCompanies.logo'],
    });
  }

  async removeEmployeeFromCompany(
    input: UserRemoveFromCompanyInput,
    adminPayload: JwtPayload,
  ): Promise<boolean> {
    if (adminPayload.role !== AuthRole.ADMIN_COMPANY) {
      throw new ForbiddenException('Только администратор компании может удалять сотрудников');
    }

    const employee = await this.userRepository.findOne({
      where: { id: input.employeeId },
      relations: ['employeeCompanies'],
    });

    if (!employee) {
      throw new NotFoundException('Сотрудник не найден');
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

    if (!employee.employeeCompanies) {
      throw new BadRequestException('Сотрудник не состоит в этой компании');
    }

    employee.employeeCompanies = employee.employeeCompanies.filter((c) => c.id !== input.companyId);
    employee.isEmployeeConfirmed = false;

    await this.userRepository.save(employee);

    return true;
  }

  async updateEmployee(
    input: UserUpdateEmployeeInput,
    adminPayload: JwtPayload,
  ): Promise<UserEntity> {
    if (adminPayload.role !== AuthRole.ADMIN_COMPANY) {
      throw new ForbiddenException('Только администратор компании может обновлять данные сотрудников');
    }

    const employee = await this.userRepository.findOne({
      where: { id: input.employeeId },
      relations: ['employeeCompanies', 'logo'],
    });

    if (!employee) {
      throw new NotFoundException('Сотрудник не найден');
    }

    if (employee.role !== UserRole.EMPLOYEE) {
      throw new BadRequestException('Пользователь не является сотрудником');
    }

    const company = await this.companyRepository.findOne({
      where: { id: input.companyId },
      relations: ['createdBy', 'createdBy.logo', 'employees', 'employees.logo', 'logo'],
    });

    if (!company) {
      throw new NotFoundException('Компания не найдена');
    }

    if (!company.isActive) {
      throw new BadRequestException('Компания неактивна. Невозможно обновить данные сотрудника');
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

    if (typeof input.fullName === 'string') {
      employee.fullName = input.fullName.trim();
    }

    if (typeof input.password === 'string' && input.password.length > 0) {
      employee.passwordHash = input.password;
    }

    if (typeof input.logoId !== 'undefined') {
      if (input.logoId) {
        const logo = await this.imageRepository.findOne({
          where: { id: input.logoId },
        });
        if (!logo) {
          throw new NotFoundException('Изображение логотипа не найдено');
        }
        employee.logo = logo;
      } else {
        employee.logo = null;
      }
    }

    const savedEmployee = await this.userRepository.save(employee);
    return this.userRepository.findOneOrFail({
      where: { id: savedEmployee.id },
      relations: ['logo', 'employeeCompanies', 'employeeCompanies.logo'],
    });
  }
}

