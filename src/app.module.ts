import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { BullModule } from '@nestjs/bullmq';
import Entities from './entities/entities';
import { FileModule } from './modules/files/file.module';
import { ConfigService } from './modules/config/config.service';
import { ConfigModule } from './modules/config/config.module';
import { AppResolver } from './app.resolver';
import { SmartTrashModule } from './modules/smart-trash/smart-trash.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtGuard } from './modules/auth/jwt.guard';
import { RolesGuard } from './modules/auth/roles.guard';
import { AllExceptionLoggerFilter } from './common/filters/all-exception-logger.filter';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT || 6379),
        db: Number(process.env.REDIS_DB || 0),
      },
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      installSubscriptionHandlers: true,
      playground: true,
      context: ({ req, res }: { req: Request; res: Response }) => ({
        req,
        res,
      }),
      autoSchemaFile: './dist/schema.gql',
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        ...configService.config.database,
        entities: Entities,
        synchronize: true,
        logger: 'debug',
      }),
      inject: [ConfigService],
    }),
    FileModule,
    SmartTrashModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AppResolver,
    { provide: APP_GUARD, useClass: JwtGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: AllExceptionLoggerFilter },
  ],
})
export class AppModule {}
