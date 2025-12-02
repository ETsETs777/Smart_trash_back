import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from 'src/modules/config/config.service';
import { JwtPayload } from './jwt-payload.interface';
import { AuthRole } from './auth-role.enum';
import { CompanyAdminEntity } from 'src/entities/smart-trash/company-admin.entity';
import { EmployeeEntity } from 'src/entities/smart-trash/employee.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(CompanyAdminEntity)
    private readonly adminRepository: Repository<CompanyAdminEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.config.jwtToken.secret,
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    if (!payload.sub || !payload.role) {
      throw new UnauthorizedException('Невалидный токен: отсутствуют обязательные поля');
    }

    if (payload.role === AuthRole.COMPANY_ADMIN) {
      const admin = await this.adminRepository.findOne({
        where: { id: payload.sub },
        relations: ['company'],
      });

      if (!admin) {
        throw new UnauthorizedException('Администратор не найден');
      }

      if (!admin.isActive) {
        throw new UnauthorizedException('Аккаунт администратора деактивирован');
      }

      if (!admin.jwtToken) {
        throw new UnauthorizedException('Сессия истекла. Пожалуйста, войдите снова');
      }

      if (admin.company) {
        payload.companyId = admin.company.id;
      }
    } else if (payload.role === AuthRole.EMPLOYEE) {
      const employee = await this.employeeRepository.findOne({
        where: { id: payload.sub, isRegistered: true },
        relations: ['company'],
      });

      if (!employee) {
        throw new UnauthorizedException('Сотрудник не найден');
      }

      if (!employee.jwtToken) {
        throw new UnauthorizedException('Сессия истекла. Пожалуйста, войдите снова');
      }

      if (employee.company) {
        payload.companyId = employee.company.id;
      }
      payload.employeeId = employee.id;
    }

    return payload;
  }
}


