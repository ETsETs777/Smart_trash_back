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
  });
}
