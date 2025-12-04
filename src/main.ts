import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from './modules/config/config.service';
import { EmailService } from './modules/auth/services/email.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  const configService = await app.resolve(ConfigService);

  app.enableCors({
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    origin: true,
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe());

  try {
    const emailService = await app.resolve(EmailService);
    const isSmtpConnected = await emailService.verifyConnection();
    if (isSmtpConnected) {
      logger.log('SMTP соединение успешно установлено');
    } else {
      logger.warn('SMTP соединение не установлено. Проверьте настройки SMTP');
    }
  } catch (error) {
    logger.warn('Не удалось проверить SMTP соединение:', error.message);
  }

  await app.listen(configService.config.port || 5000);
  logger.log(`Приложение запущено на порту ${configService.config.port || 5000}`);
}

bootstrap();
