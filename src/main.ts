import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from './modules/config/config.service';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = await app.resolve(ConfigService);

  app.enableCors({
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    origin: true,
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe());

  await app.listen(configService.config.port || 5000);
}
//
bootstrap();
