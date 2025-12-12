import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { ConfigService } from 'src/modules/config/config.service';
import { UserEntity, UserRole } from 'src/entities/smart-trash/user.entity';
import { CompanyEntity } from 'src/entities/smart-trash/company.entity';
import { JwtPayload } from './jwt-payload.interface';
import { AuthRole } from './auth-role.enum';
import { LoginInput } from './inputs/login.input';
import { AdminRegisterInput } from './inputs/admin-register.input';
import { EmployeeRegisterInput } from './inputs/employee-register-new.input';
import { ConfirmEmailInput } from './inputs/confirm-email.input';
import { EmailService } from './services/email.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(CompanyEntity)
    private readonly companyRepository: Repository<CompanyEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  private generateToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.config.jwtToken.secret,
      expiresIn: this.configService.config.jwtToken.userTokenExpiresIn,
    });
  }

  private generateEmailConfirmationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async registerAdmin(input: AdminRegisterInput): Promise<UserEntity> {
    const normalizedEmail = input.email.trim().toLowerCase();

    const existingUser = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (existingUser && existingUser.isEmailConfirmed) {
      throw new ConflictException(
        'Пользователь с таким email уже зарегистрирован и подтверждён',
      );
    }

    const emailConfirmationToken = this.generateEmailConfirmationToken();

    let company: CompanyEntity;
    if (existingUser && !existingUser.isEmailConfirmed) {
      const existingCompanies = await this.companyRepository.find({
        where: { createdBy: { id: existingUser.id } },
      });
      if (existingCompanies.length > 0) {
        company = existingCompanies[0];
        company.name = input.companyName;
        if (input.companyDescription !== undefined) {
          company.description = input.companyDescription;
        }
        await this.companyRepository.save(company);
      } else {
        company = this.companyRepository.create({
          name: input.companyName,
          description: input.companyDescription,
          createdBy: existingUser,
        });
        await this.companyRepository.save(company);
      }

      existingUser.fullName = input.fullName.trim();
      existingUser.passwordHash = input.password;
      existingUser.role = UserRole.ADMIN_COMPANY;
      existingUser.emailConfirmationToken = emailConfirmationToken;
      existingUser.isEmailConfirmed = false;
      const savedUser = await this.userRepository.save(existingUser);
      const userWithRelations = await this.userRepository.findOneOrFail({
        where: { id: savedUser.id },
        relations: ['logo', 'createdCompanies', 'createdCompanies.logo'],
      });

      await this.emailService.sendConfirmationEmail(
        normalizedEmail,
        userWithRelations.fullName,
        emailConfirmationToken,
      );

      this.logger.log(
        `Администратор ${normalizedEmail} повторно зарегистрирован (ожидает подтверждения)`,
      );

      return userWithRelations;
    }

    const user = this.userRepository.create({
      email: normalizedEmail,
      passwordHash: input.password,
      fullName: input.fullName.trim(),
      role: UserRole.ADMIN_COMPANY,
      emailConfirmationToken,
      isEmailConfirmed: false,
    });

    const savedUser = await this.userRepository.save(user);

    company = this.companyRepository.create({
      name: input.companyName,
      description: input.companyDescription,
      createdBy: savedUser,
    });
    await this.companyRepository.save(company);

    const userWithRelations = await this.userRepository.findOneOrFail({
      where: { id: savedUser.id },
      relations: ['logo', 'createdCompanies', 'createdCompanies.logo'],
    });

    await this.emailService.sendConfirmationEmail(
      normalizedEmail,
      userWithRelations.fullName,
      emailConfirmationToken,
    );

    this.logger.log(
      `Администратор ${normalizedEmail} зарегистрирован (ожидает подтверждения)`,
    );

    return userWithRelations;
  }

  async registerEmployee(input: EmployeeRegisterInput): Promise<UserEntity> {
    const normalizedEmail = input.email.trim().toLowerCase();

    const existingUser = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (existingUser && existingUser.isEmailConfirmed) {
      throw new ConflictException(
        'Пользователь с таким email уже зарегистрирован и подтверждён',
      );
    }

    const company = await this.companyRepository.findOneBy({
      id: input.companyId,
    });

    if (!company) {
      throw new NotFoundException('Компания не найдена');
    }

    const emailConfirmationToken = this.generateEmailConfirmationToken();

    if (existingUser && !existingUser.isEmailConfirmed) {
      existingUser.fullName = input.fullName.trim();
      existingUser.passwordHash = input.password;
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
        `Сотрудник ${normalizedEmail} повторно зарегистрирован (ожидает подтверждения)`,
      );

      return userWithRelations;
    }

    const user = this.userRepository.create({
      email: normalizedEmail,
      passwordHash: input.password,
      fullName: input.fullName.trim(),
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
      `Сотрудник ${normalizedEmail} зарегистрирован (ожидает подтверждения)`,
    );

    return userWithRelations;
  }

  async login(input: LoginInput): Promise<UserEntity> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const user = await this.userRepository.findOne({
      where: { email: normalizedEmail },
      relations: ['logo', 'employeeCompanies', 'employeeCompanies.logo', 'createdCompanies', 'createdCompanies.logo'],
    });

    if (!user) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Аккаунт деактивирован');
    }

    if (!user.isEmailConfirmed) {
      throw new UnauthorizedException(
        'Электронная почта не подтверждена. Пожалуйста, подтвердите email перед входом',
      );
    }

    const isPasswordValid = await bcrypt.compare(
      input.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const roleMap: Record<UserRole, AuthRole> = {
      [UserRole.ADMIN_COMPANY]: AuthRole.ADMIN_COMPANY,
      [UserRole.EMPLOYEE]: AuthRole.EMPLOYEE,
    };

    let companyId: string | undefined;
    if (
      user.role === UserRole.EMPLOYEE &&
      user.employeeCompanies &&
      user.employeeCompanies.length > 0
    ) {
      companyId = user.employeeCompanies[0].id;
    } else if (
      user.role === UserRole.ADMIN_COMPANY &&
      user.createdCompanies &&
      user.createdCompanies.length > 0
    ) {
      companyId = user.createdCompanies[0].id;
    }

    const payload: JwtPayload = {
      sub: user.id,
      role: roleMap[user.role],
      companyId,
    };

    const token = this.generateToken(payload);

    user.jwtToken = token;
    const savedUser = await this.userRepository.save(user);
    const userWithRelations = await this.userRepository.findOneOrFail({
      where: { id: savedUser.id },
      relations: ['logo', 'employeeCompanies', 'employeeCompanies.logo', 'createdCompanies', 'createdCompanies.logo'],
    });

    this.logger.log(`Пользователь ${userWithRelations.email} успешно авторизован`);

    return userWithRelations;
  }

  async me(payload: JwtPayload): Promise<UserEntity> {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      relations: ['logo', 'employeeCompanies', 'employeeCompanies.logo', 'createdCompanies', 'createdCompanies.logo'],
    });
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }
    return user;
  }

  async confirmEmail(input: ConfirmEmailInput): Promise<UserEntity> {
    const user = await this.userRepository.findOne({
      where: { emailConfirmationToken: input.token },
      relations: ['logo', 'employeeCompanies', 'employeeCompanies.logo', 'createdCompanies', 'createdCompanies.logo'],
    });

    if (!user) {
      throw new NotFoundException('Неверный токен подтверждения');
    }

    if (user.isEmailConfirmed) {
      throw new BadRequestException('Электронная почта уже подтверждена');
    }

    user.isEmailConfirmed = true;
    user.emailConfirmationToken = null;
    const savedUser = await this.userRepository.save(user);
    const confirmedUser = await this.userRepository.findOneOrFail({
      where: { id: savedUser.id },
      relations: ['logo', 'employeeCompanies', 'employeeCompanies.logo', 'createdCompanies', 'createdCompanies.logo'],
    });

    this.logger.log(`Электронная почта ${confirmedUser.email} подтверждена`);

    return confirmedUser;
  }

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
