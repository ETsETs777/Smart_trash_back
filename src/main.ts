import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from './modules/config/config.service';
import { EmailService } from './modules/auth/services/email.service';
import { Logger as PinoLogger } from 'nestjs-pino';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  
  // Use Pino logger if available
  app.useLogger(app.get(PinoLogger));
  
  const logger = new Logger('Bootstrap');

  const configService = await app.resolve(ConfigService);

  // Enable cookie parser for CSRF tokens
  app.use(cookieParser());

  // Security headers with Helmet
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for React
        scriptSrc: ["'self'"], // Only allow scripts from same origin
        imgSrc: ["'self'", "data:", "https:"], // Allow images from same origin, data URIs, and HTTPS
        connectSrc: ["'self'", "ws:", "wss:"], // Allow WebSocket connections
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Disable for development
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    dnsPrefetchControl: true,
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: false,
    referrerPolicy: { policy: 'no-referrer' },
    xssFilter: true,
  }));

  app.enableCors({
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    origin: true,
    credentials: true,
    exposedHeaders: ['X-CSRF-Token'], // Expose CSRF token header
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Удаляет свойства, которых нет в DTO
      forbidNonWhitelisted: false, // Отключаем для GraphQL, так как GraphQL сам валидирует схему
      transform: true, // Автоматически преобразует типы
      transformOptions: {
        enableImplicitConversion: true,
      },
      validateCustomDecorators: true,
      skipMissingProperties: false,
    }),
  );

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
