import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ConfigService } from 'src/modules/config/config.service';
import { CompanyAdminEntity } from 'src/entities/smart-trash/company-admin.entity';
import { EmployeeEntity } from 'src/entities/smart-trash/employee.entity';
import { CompanyEntity } from 'src/entities/smart-trash/company.entity';
import { JwtPayload } from './jwt-payload.interface';
import { AuthRole } from './auth-role.enum';
import { AdminLoginInput } from './inputs/admin-login.input';
import { EmployeeLoginInput } from './inputs/employee-login.input';
import { EmployeeRegisterInput } from './inputs/employee-register.input';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(CompanyAdminEntity)
    private readonly adminRepository: Repository<CompanyAdminEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>,
    @InjectRepository(CompanyEntity)
    private readonly companyRepository: Repository<CompanyEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Генерирует JWT токен для указанного payload
   */
  private generateToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.config.jwtToken.secret,
      expiresIn: this.configService.config.jwtToken.userTokenExpiresIn,
    });
  }

  /**
   * Авторизация администратора компании
   */
  async loginAdmin(input: AdminLoginInput): Promise<CompanyAdminEntity> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const admin = await this.adminRepository.findOne({
      where: { email: normalizedEmail },
      relations: ['company'],
    });

    if (!admin) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    if (!admin.isActive) {
      throw new UnauthorizedException('Аккаунт администратора деактивирован');
    }

    const isPasswordValid = await bcrypt.compare(
      input.password,
      admin.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const payload: JwtPayload = {
      sub: admin.id,
      role: AuthRole.COMPANY_ADMIN,
      companyId: admin.company?.id,
    };

    const token = this.generateToken(payload);

    admin.jwtToken = token;
    await this.adminRepository.save(admin);

    this.logger.log(`Администратор ${admin.email} успешно авторизован`);

    return admin;
  }

  /**
   * Авторизация сотрудника компании
   */
  async loginEmployee(input: EmployeeLoginInput): Promise<EmployeeEntity> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const employee = await this.employeeRepository.findOne({
      where: { email: normalizedEmail, isRegistered: true },
      relations: ['company'],
    });

    if (!employee) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    if (!employee.passwordHash) {
      throw new UnauthorizedException('Пароль не установлен для этого аккаунта');
    }

    const isPasswordValid = await bcrypt.compare(
      input.password,
      employee.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const payload: JwtPayload = {
      sub: employee.id,
      role: AuthRole.EMPLOYEE,
      companyId: employee.company.id,
      employeeId: employee.id,
    };

    const token = this.generateToken(payload);

    employee.jwtToken = token;
    await this.employeeRepository.save(employee);

    this.logger.log(`Сотрудник ${employee.email} успешно авторизован`);

    return employee;
  }

  /**
   * Регистрация нового сотрудника компании
   */
  async registerEmployee(
    input: EmployeeRegisterInput,
  ): Promise<EmployeeEntity> {
    const normalizedEmail = input.email.trim().toLowerCase();

    // Проверяем, существует ли уже сотрудник с таким email
    const existingEmployee = await this.employeeRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (existingEmployee) {
      throw new ConflictException(
        'Сотрудник с таким email уже зарегистрирован',
      );
    }

    // Проверяем, существует ли компания
    const company = await this.companyRepository.findOneBy({
      id: input.companyId,
    });

    if (!company) {
      throw new NotFoundException('Компания не найдена');
    }

    // Создаем нового сотрудника
    const employee = this.employeeRepository.create({
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email: normalizedEmail,
      passwordHash: input.password,
      isRegistered: true,
      isConfirmed: false,
      company,
    });

    await this.employeeRepository.save(employee);

    // Генерируем токен для автоматического логина после регистрации
    const payload: JwtPayload = {
      sub: employee.id,
      role: AuthRole.EMPLOYEE,
      companyId: employee.company.id,
      employeeId: employee.id,
    };

    const token = this.generateToken(payload);

    employee.jwtToken = token;
    await this.employeeRepository.save(employee);

    this.logger.log(
      `Сотрудник ${employee.email} успешно зарегистрирован в компании ${company.name}`,
    );

    return employee;
  }

  /**
   * Проверяет валидность JWT токена и возвращает payload
   */
  async validateToken(token: string): Promise<JwtPayload | null> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.config.jwtToken.secret,
      });
      return payload;
    } catch (error) {
      this.logger.warn(`Невалидный JWT токен: ${error.message}`);
      return null;
    }
  }
}

