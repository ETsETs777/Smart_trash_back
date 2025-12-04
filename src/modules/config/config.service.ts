import * as process from 'process';
import type { ReadonlyDeep } from 'type-fest';
import { Injectable, Logger } from '@nestjs/common';
import { set, values } from 'lodash';
import ms from 'ms';
import { NodeEnv } from './node-env.enum';
import { joi } from 'src/common/joi-configured';

/**
 * Interface for typing the application startup configuration.
 * Provides connection data to various services.
 */
export interface IJsonConfig {
  /**
   * App environment mode enum.
   */
  nodeEnv: NodeEnv;
  /**
   * Application port.
   */
  port: number;
  /**
   * Relative path to folder where stores uploaded files.
   */
  filesUrl: string;
  /**
   * Absolute path to folder where stores uploaded images.
   */
  imagesUrl: string;
  /**
   * GraphQL API URL for remote auth service
   */
  remoteAuthGqlUrl: string;
  /**
   * JWT auth options
   */
  jwtToken: {
    /**
     * Secret for token signing
     */
    secret: string;
    /**
     * User token expiration time
     */
    userTokenExpiresIn: string;
    /**
     * API token expiration time
     */
    apiTokenExpiresIn: string;
  };
  /**
   * Database connection configuration
   */
  database: {
    type: 'postgres';
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
  };
  /**
   * S3 (file storage) configuration
   */
  s3: {
    bucketName: string; // Bucket (container) name.
    endPoint: string; // S3 endpoint.
    port?: number; // S3 port.
    accessKey: string; // S3 access key.
    secretKey: string; // S3 secret key.
    presignedUrlExpiration: number; // Presigned url expiration time in seconds.
  };
  /**
   * SMTP (email) configuration
   */
  smtp: {
    host: string; // SMTP server host.
    port: number; // SMTP server port.
    secure: boolean; // Use TLS/SSL.
    auth: {
      user: string; // SMTP username.
      pass: string; // SMTP password.
    };
    from: string; // Default sender email address.
  };
  /**
   * GigaChat (LLM) configuration
   */
  gigachat: {
    authKey: string; // GigaChat API key.
    scope: string; // GigaChat scope.
    model: string; // GigaChat model name.
    baseUrl: string; // GigaChat base URL.
    authUrl: string; // GigaChat OAuth URL.
    rejectUnauthorized: boolean; // Reject unauthorized SSL certificates.
  };
}

/**
 * Service that receives startup configuration of the whole application
 */
@Injectable()
export class ConfigService {
  private readonly validatedConfig: IJsonConfig;

  public readonly isMode: ReadonlyDeep<Record<NodeEnv, boolean>> = values(
    NodeEnv,
  ).reduce<Record<NodeEnv, boolean>>(
    (acc, key) => set(acc, key, key === process.env.NODE_ENV),
    {} as Record<NodeEnv, boolean>,
  );

  private logger = new Logger(ConfigService.name);

  /**
   * Config Constructor: tries to read env.CONFIG_PATH or 'config.${NODE_ENV}.json'.
   * Performs initialization for use of the getConfig() method.
   */
  constructor() {
    this.validateEnvironment();
    this.validatedConfig = this.validateConfig({});
  }

  /**
   * Method for getting the loaded application configuration
   */
  public get config(): ReadonlyDeep<IJsonConfig> {
    return this.validatedConfig;
  }

  /**
   * Template Method for throwing an error of loading the application configuration
   */
  private throwConfigLoadingError(errorMessage: string): never {
    throw new Error(`Failed to load configuration: ${errorMessage}`);
  }

  /**
   * Method for validation of environment variables.
   */
  private validateEnvironment() {
    const { error } = this.environmentSchema.validate(process.env);
    if (error) {
      throw new Error(`Environment validation error: ${error.message})`);
    }
  }

  /**
   * Method for validation of loaded config.
   * Must be called after validating environment variables.
   */
  private validateConfig(config: unknown): IJsonConfig {
    const { error, value } = this.configSchema.validate(config);
    if (error) {
      throw new Error(`Config validation error: ${error.message})`);
    }
    return value;
  }

  /**
   * Joi schema for environment validation
   */
  private readonly environmentSchema = joi
    .object<NodeJS.ProcessEnv>({
      NODE_ENV: joi
        .string()
        .valid(...values(NodeEnv))
        .required(),
      JWT_TOKEN_SECRET: joi.string().required(),
      DB_HOST: joi.string().required(),
      DB_PORT: joi.number().port().required(),
      DB_USER: joi.string().required(),
      DB_PASSWORD: joi.string().required(),
      DB_DATABASE: joi.string().required(),
      S3_ACCESS_KEY: joi.string().required(),
      S3_SECRET_KEY: joi.string().required(),
      S3_BUCKET_NAME: joi.string().required(),
      S3_ENDPOINT: joi.string().required(),
      S3_PORT: joi.string().required(),
      SERVER_PORT: joi.string().required(),
      JWT_USER_TOKEN_EXPIRES_IN: joi.string().required(),
      SMTP_HOST: joi.string().required(),
      SMTP_PORT: joi.number().port().required(),
      SMTP_SECURE: joi.string().valid('true', 'false').required(),
      SMTP_USER: joi.string().required(),
      SMTP_PASS: joi.string().required(),
      SMTP_FROM: joi.string().email().required(),
      GIGACHAT_API_KEY: joi.string().required(),
      GIGACHAT_SCOPE: joi.string().optional().default('GIGACHAT_API_PERS'),
      GIGACHAT_REJECT_UNAUTHORIZED: joi
        .string()
        .valid('true', 'false')
        .optional()
        .default('false'),
      GIGACHAT_BASE_URL: joi.string().optional(),
      GIGACHAT_AUTH_URL: joi.string().optional(),
      GIGACHAT_MODEL: joi.string().optional().default('gigachat'),
    })
    .required();

  /**
   * Joi schema for config validation
   */
  private readonly configSchema = joi.object<IJsonConfig>({
    nodeEnv: joi.string().forbidden().default(process.env.NODE_ENV),
    port: joi.forbidden().default(process.env.SERVER_PORT),
    filesUrl: joi.string().optional().default('/files/'),
    imagesUrl: joi.string().optional().default('/images/'),
    jwtToken: joi.forbidden().default({
      secret: process.env.JWT_TOKEN_SECRET,
      userTokenExpiresIn: process.env.JWT_USER_TOKEN_EXPIRES_IN,
      apiTokenExpiresIn: '500y',
    }),
    database: joi.forbidden().default({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      database: process.env.DB_DATABASE,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    }),
    s3: joi.forbidden().default({
      bucketName: process.env.S3_BUCKET_NAME,
      endPoint: process.env.S3_ENDPOINT,
      port: Number(process.env.S3_PORT),
      accessKey: process.env.S3_ACCESS_KEY,
      secretKey: process.env.S3_SECRET_KEY,
      presignedUrlExpiration: ms('1d') / 1000,
    }),
    smtp: joi.forbidden().default({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      from: process.env.SMTP_FROM,
    }),
    gigachat: joi.forbidden().default({
      authKey: process.env.GIGACHAT_API_KEY,
      scope: process.env.GIGACHAT_SCOPE || 'GIGACHAT_API_PERS',
      model: process.env.GIGACHAT_MODEL || 'gigachat',
      baseUrl:
        process.env.GIGACHAT_BASE_URL ||
        'https://gigachat.devices.sberbank.ru/api/v1',
      authUrl:
        process.env.GIGACHAT_AUTH_URL ||
        'https://gigachat.devices.sberbank.ru/api/v1/oauth',
      rejectUnauthorized: process.env.GIGACHAT_REJECT_UNAUTHORIZED === 'true',
    }),
  });
}
