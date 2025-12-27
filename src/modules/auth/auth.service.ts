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
import { RefreshTokenInput } from './inputs/refresh-token.input';
import { EmailService } from './services/email.service';
import { AuditLoggerService, AuditAction } from '../../common/logger/audit-logger.service';
import { PinoLogger } from 'nestjs-pino';
import { LoginAttemptTrackerService } from '../../common/services/login-attempt-tracker.service';
import { Request, Response } from 'express';

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
    private readonly auditLogger: AuditLoggerService,
    private readonly pinoLogger: PinoLogger,
    private readonly loginAttemptTracker: LoginAttemptTrackerService,
  ) {}

  private generateAccessToken(payload: JwtPayload): string {
    // Short-lived access token (15 minutes)
    return this.jwtService.sign(payload, {
      secret: this.configService.config.jwtToken.secret,
      expiresIn: '15m', // Short expiration for security
    });
  }

  private generateRefreshToken(payload: JwtPayload): string {
    // Long-lived refresh token (7 days)
    return this.jwtService.sign(
      { ...payload, type: 'refresh' },
      {
        secret: this.configService.config.jwtToken.secret,
        expiresIn: '7d',
      },
    );
  }

  // Backward compatibility
  private generateToken(payload: JwtPayload): string {
    return this.generateAccessToken(payload);
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

      // Отправляем email асинхронно, не блокируя ответ
      this.emailService.sendConfirmationEmail(
        normalizedEmail,
        userWithRelations.fullName,
        emailConfirmationToken,
      ).catch((error) => {
        this.logger.error(`Не удалось отправить email подтверждения для ${normalizedEmail}:`, error);
      });

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

    // Отправляем email асинхронно, не блокируя ответ
    this.emailService.sendConfirmationEmail(
      normalizedEmail,
      userWithRelations.fullName,
      emailConfirmationToken,
    ).catch((error) => {
      this.logger.error(`Не удалось отправить email подтверждения для ${normalizedEmail}:`, error);
    });

    this.logger.log(
      `Администратор ${normalizedEmail} зарегистрирован (ожидает подтверждения)`,
    );

    // Audit log
    this.auditLogger.log({
      action: AuditAction.REGISTER,
      userEmail: normalizedEmail,
      userRole: UserRole.ADMIN_COMPANY,
      companyId: company.id,
      metadata: {
        companyName: input.companyName,
      },
    });

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

    // Audit log
    this.auditLogger.log({
      action: AuditAction.REGISTER,
      userEmail: normalizedEmail,
      userRole: UserRole.EMPLOYEE,
      companyId: company.id,
      metadata: {
        employeeName: input.fullName,
      },
    });

    return userWithRelations;
  }

  async login(
    input: LoginInput,
    requestInfo?: { ipAddress?: string; userAgent?: string },
    res?: Response,
  ): Promise<UserEntity> {
    const normalizedEmail = input.email.trim().toLowerCase();
    
    // Check if account should be locked
    const shouldLock = await this.loginAttemptTracker.shouldLockAccount(normalizedEmail, requestInfo?.ipAddress);
    if (shouldLock) {
      await this.loginAttemptTracker.logAttempt({
        email: normalizedEmail,
        ipAddress: requestInfo?.ipAddress,
        userAgent: requestInfo?.userAgent,
        success: false,
        failureReason: 'Account locked due to too many failed attempts',
      });
      throw new UnauthorizedException('Слишком много неудачных попыток входа. Попробуйте позже через 15 минут.');
    }
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
      await this.loginAttemptTracker.logAttempt({
        email: normalizedEmail,
        ipAddress: requestInfo?.ipAddress,
        userAgent: requestInfo?.userAgent,
        success: false,
        failureReason: 'Invalid password',
        userId: user.id,
      });
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

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    // Calculate refresh token expiration (7 days from now)
    const refreshTokenExpiresAt = new Date();
    refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 7);

    user.jwtToken = accessToken;
    user.refreshToken = refreshToken;
    user.refreshTokenExpiresAt = refreshTokenExpiresAt;
    const savedUser = await this.userRepository.save(user);

    // Set refresh token in httpOnly cookie for security
    if (res) {
      res.cookie('refresh-token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
      });
    }
    
    // Log successful login attempt
    await this.loginAttemptTracker.logAttempt({
      email: normalizedEmail,
      ipAddress: requestInfo?.ipAddress,
      userAgent: requestInfo?.userAgent,
      success: true,
      userId: user.id,
    });

    // Audit log for successful login
    this.auditLogger.log({
      action: AuditAction.LOGIN,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      companyId,
      metadata: {
        loginMethod: 'email',
        ipAddress: requestInfo?.ipAddress,
      },
    });
    
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
    
    // Audit log for email confirmation
    this.auditLogger.log({
      action: AuditAction.EMAIL_CONFIRMED,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      metadata: {
        confirmationMethod: 'token',
      },
    });
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

  async refreshToken(
    input: RefreshTokenInput,
    req?: Request,
    res?: Response,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // Get refresh token from cookie or input (cookie takes priority)
    const refreshTokenFromCookie = req?.cookies?.['refresh-token'];
    const refreshToken = refreshTokenFromCookie || input.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh токен не найден');
    }

    // Verify the refresh token
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.config.jwtToken.secret,
      });
    } catch (error) {
      throw new UnauthorizedException('Невалидный или истекший refresh токен');
    }

    // Check if token type is refresh
    if ((payload as any).type !== 'refresh') {
      throw new UnauthorizedException('Токен не является refresh токеном');
    }

    // Find user and verify refresh token matches
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Аккаунт деактивирован');
    }

    if (user.refreshToken !== refreshToken) {
      throw new UnauthorizedException('Невалидный refresh токен');
    }

    // Check if refresh token is expired
    if (user.refreshTokenExpiresAt && user.refreshTokenExpiresAt < new Date()) {
      throw new UnauthorizedException('Refresh токен истек');
    }

    // Generate new tokens
    const newAccessToken = this.generateAccessToken(payload);
    const newRefreshToken = this.generateRefreshToken(payload);

    // Update user tokens
    const refreshTokenExpiresAt = new Date();
    refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 7);

    user.jwtToken = newAccessToken;
    user.refreshToken = newRefreshToken;
    user.refreshTokenExpiresAt = refreshTokenExpiresAt;
    await this.userRepository.save(user);

    // Set new refresh token in httpOnly cookie (token rotation)
    if (res) {
      res.cookie('refresh-token', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
      });
    }

    this.logger.log(`Токены обновлены для пользователя ${user.email}`);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken, // Still return for backward compatibility, but client should use cookie
    };
  }
}

    // Audit log for email confirmation
    this.auditLogger.log({
      action: AuditAction.EMAIL_CONFIRMED,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      metadata: {
        confirmationMethod: 'token',
      },
    });
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

  async refreshToken(
    input: RefreshTokenInput,
    req?: Request,
    res?: Response,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // Get refresh token from cookie or input (cookie takes priority)
    const refreshTokenFromCookie = req?.cookies?.['refresh-token'];
    const refreshToken = refreshTokenFromCookie || input.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh токен не найден');
    }

    // Verify the refresh token
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.config.jwtToken.secret,
      });
    } catch (error) {
      throw new UnauthorizedException('Невалидный или истекший refresh токен');
    }

    // Check if token type is refresh
    if ((payload as any).type !== 'refresh') {
      throw new UnauthorizedException('Токен не является refresh токеном');
    }

    // Find user and verify refresh token matches
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Аккаунт деактивирован');
    }

    if (user.refreshToken !== refreshToken) {
      throw new UnauthorizedException('Невалидный refresh токен');
    }

    // Check if refresh token is expired
    if (user.refreshTokenExpiresAt && user.refreshTokenExpiresAt < new Date()) {
      throw new UnauthorizedException('Refresh токен истек');
    }

    // Generate new tokens
    const newAccessToken = this.generateAccessToken(payload);
    const newRefreshToken = this.generateRefreshToken(payload);

    // Update user tokens
    const refreshTokenExpiresAt = new Date();
    refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 7);

    user.jwtToken = newAccessToken;
    user.refreshToken = newRefreshToken;
    user.refreshTokenExpiresAt = refreshTokenExpiresAt;
    await this.userRepository.save(user);

    // Set new refresh token in httpOnly cookie (token rotation)
    if (res) {
      res.cookie('refresh-token', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
      });
    }

    this.logger.log(`Токены обновлены для пользователя ${user.email}`);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken, // Still return for backward compatibility, but client should use cookie
    };
  }
}

    // Audit log for email confirmation
    this.auditLogger.log({
      action: AuditAction.EMAIL_CONFIRMED,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      metadata: {
        confirmationMethod: 'token',
      },
    });
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

  async refreshToken(
    input: RefreshTokenInput,
    req?: Request,
    res?: Response,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // Get refresh token from cookie or input (cookie takes priority)
    const refreshTokenFromCookie = req?.cookies?.['refresh-token'];
    const refreshToken = refreshTokenFromCookie || input.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh токен не найден');
    }

    // Verify the refresh token
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.config.jwtToken.secret,
      });
    } catch (error) {
      throw new UnauthorizedException('Невалидный или истекший refresh токен');
    }

    // Check if token type is refresh
    if ((payload as any).type !== 'refresh') {
      throw new UnauthorizedException('Токен не является refresh токеном');
    }

    // Find user and verify refresh token matches
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Аккаунт деактивирован');
    }

    if (user.refreshToken !== refreshToken) {
      throw new UnauthorizedException('Невалидный refresh токен');
    }

    // Check if refresh token is expired
    if (user.refreshTokenExpiresAt && user.refreshTokenExpiresAt < new Date()) {
      throw new UnauthorizedException('Refresh токен истек');
    }

    // Generate new tokens
    const newAccessToken = this.generateAccessToken(payload);
    const newRefreshToken = this.generateRefreshToken(payload);

    // Update user tokens
    const refreshTokenExpiresAt = new Date();
    refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 7);

    user.jwtToken = newAccessToken;
    user.refreshToken = newRefreshToken;
    user.refreshTokenExpiresAt = refreshTokenExpiresAt;
    await this.userRepository.save(user);

    // Set new refresh token in httpOnly cookie (token rotation)
    if (res) {
      res.cookie('refresh-token', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
      });
    }

    this.logger.log(`Токены обновлены для пользователя ${user.email}`);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken, // Still return for backward compatibility, but client should use cookie
    };
  }
}
