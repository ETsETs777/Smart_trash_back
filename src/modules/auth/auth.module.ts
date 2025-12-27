import { Module } from '@nestjs/common'
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from 'src/modules/config/config.module';
import { ConfigService } from 'src/modules/config/config.service';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { EmailService } from './services/email.service';
import { UserEntity } from 'src/entities/smart-trash/user.entity';
import { CompanyEntity } from 'src/entities/smart-trash/company.entity';
import { AuditLoggerService } from '../../common/logger/audit-logger.service';
import { LoginAttemptTrackerService } from '../../common/services/login-attempt-tracker.service';
import { LoginAttemptEntity } from '../../entities/security/login-attempt.entity';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([UserEntity, CompanyEntity, LoginAttemptEntity]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.config.jwtToken.secret,
        signOptions: {
          expiresIn: configService.config.jwtToken.userTokenExpiresIn,
        },
      }),
      inject: [ConfigService],
    }),
    ConfigModule,
  ],
  controllers: [AuthController],
  providers: [JwtStrategy, AuthService, AuthResolver, EmailService, AuditLoggerService, LoginAttemptTrackerService],
  exports: [AuthService, EmailService],
})
export class AuthModule {}



export class AuthModule {}



export class AuthModule {}


