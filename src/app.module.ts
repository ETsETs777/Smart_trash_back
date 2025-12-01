import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import Entities from './entities/entities';
import { FileModule } from './modules/files/file.module';
import { ConfigService } from './modules/config/config.service';
import { ConfigModule } from './modules/config/config.module';
import { AppResolver } from './app.resolver';

@Module({
  imports: [
    ConfigModule,
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
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AppResolver,
    //{ provide: APP_GUARD, useClass: JwtGuard },
    //{ provide: APP_GUARD, useClass: RolesGuard },
    //{ provide: APP_FILTER, useClass: AllExceptionLoggerFilter },
  ],
})
export class AppModule {}
