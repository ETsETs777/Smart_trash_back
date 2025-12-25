import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { CsrfMiddleware } from './common/middleware/csrf.middleware';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
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
import { GraphQLThrottlerGuard } from './common/guards/graphql-throttler.guard';
import { LoadersModule } from './common/loaders/loaders.module';
import { UserLoader } from './common/loaders/user.loader';
import { CompanyLoader } from './common/loaders/company.loader';
import { ImageLoader } from './common/loaders/image.loader';
import { LoggerModule } from './common/logger/logger.module';
import { AuditLoggerService } from './common/logger/audit-logger.service';
import { CacheModule } from './common/cache/cache.module';
import { CacheQueryInterceptor } from './common/interceptors/cache-query.interceptor';
//import { AllExceptionLoggerFilter } from './common/filters/all-exception-logger.filter';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    CacheModule,
    AuthModule,
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 10, // 10 requests per second
      },
      {
        name: 'medium',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
      {
        name: 'long',
        ttl: 3600000, // 1 hour
        limit: 1000, // 1000 requests per hour
      },
    ]),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT || 6379),
        db: Number(process.env.REDIS_DB || 0),
      },
    }),
    GraphQLModule.forRootAsync({
      driver: ApolloDriver,
      imports: [LoadersModule],
      inject: [UserLoader, CompanyLoader, ImageLoader],
      useFactory: (
        userLoader: UserLoader,
        companyLoader: CompanyLoader,
        imageLoader: ImageLoader,
      ) => ({
        installSubscriptionHandlers: true,
        playground: true,
        // Enable @defer and @stream directives support
        plugins: [],
        context: ({ req, res, connection }: { req: Request; res: Response; connection?: any }) => {
          // For subscriptions, connection context is used
          if (connection) {
            return {
              ...connection.context,
              loaders: {
                userLoader,
                companyLoader,
                imageLoader,
              },
            };
          }
          // For queries/mutations, request context is used
          return {
            req,
            res,
            loaders: {
              userLoader,
              companyLoader,
              imageLoader,
            },
          };
        },
        subscriptions: {
          'graphql-ws': {
            onConnect: (context: any) => {
              // Extract token from connection params
              const token = context.connectionParams?.authorization?.replace('Bearer ', '') || null;
              return { token };
            },
          },
        },
        autoSchemaFile: './dist/schema.gql',
      }),
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
    LoadersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AppResolver,
    AuditLoggerService,
    { provide: APP_GUARD, useClass: GraphQLThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: CacheQueryInterceptor },
   // { provide: APP_FILTER, useClass: AllExceptionLoggerFilter },
  ],
})
export class AppModule {}
