jest.setTimeout(100000);
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { MinioContainer, StartedMinioContainer } from '@testcontainers/minio';
import process from 'node:process';
import { AppModule } from '../src/app.module';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { Client } from 'minio';

let postgresContainer: StartedPostgreSqlContainer;
let app: INestApplication;
let moduleFixture: TestingModule;
let minioContainer: StartedMinioContainer;
// This is necessary so that when one of the tests is
// launched through the IDE (for example VSCode),
// the .env.test file is automatically loaded.
dotenv.config({ path: './.env.test' });

async function waitConnectMinio(client: Client) {
  let isMinioReady = false;
  const maxRetries = 10;
  let attempts = 0;

  while (!isMinioReady && attempts < maxRetries) {
    try {
      await client.listBuckets();
      isMinioReady = true;
    } catch (error) {
      attempts++;
      await new Promise((resolve) => setTimeout(() => resolve(0), 1000)); // Ждём 1 секунду перед следующей попыткой
    }
  }
  if (!isMinioReady) {
    throw new Error('MinIO не готов после ожидания');
  }
}

async function createBucket({
  bucketName,
  targetPort,
  accessKey,
  secretKey,
}: {
  bucketName: string;
  targetPort: number;
  accessKey: string;
  secretKey: string;
}): Promise<void> {
  const minioClient = new Client({
    endPoint: 'localhost',
    port: targetPort,
    useSSL: false,
    accessKey,
    secretKey,
  });

  await waitConnectMinio(minioClient);

  const exists = await minioClient.bucketExists(bucketName);

  if (!exists) {
    await minioClient.makeBucket(bucketName);
  }
}

beforeAll(
  async () => {
    //connect our container
    const dbName = process.env.DB_DATABASE;
    if (!dbName) {
      throw new Error('Переменная окружения DB_DATABASE не определена!');
    }
    const postgresContainerPromise = new PostgreSqlContainer('postgres')
      .withExposedPorts(5432)
      .withDatabase(dbName)
      .withUsername('postgres')
      .withPassword('1qa2ws3ed')
      .start();

    const minioUsername = 'minioTestUser';
    const minioPassword = 'minioTestPass';
    const minioContainerPromise = new MinioContainer('minio/minio')
      .withUsername(minioUsername)
      .withPassword(minioPassword)
      .withExposedPorts(9000)
      .start();

    [postgresContainer, minioContainer] = await Promise.all([
      postgresContainerPromise,
      minioContainerPromise,
    ]);

    process.env.DB_PORT = postgresContainer.getMappedPort(5432).toString();

    process.env.S3_PORT = minioContainer.getMappedPort(9000).toString();
    process.env.S3_ACCESS_KEY = minioUsername;
    process.env.S3_SECRET_KEY = minioPassword;

    await createBucket({
      bucketName: 'rentesy',
      targetPort: +process.env.S3_PORT,
      accessKey: minioUsername,
      secretKey: minioPassword,
    });

    // connect our container
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    await app.init();
  },
  8 * 60 * 1000,
);

afterAll(async () => {
  //Stop postgres container
  await Promise.all([postgresContainer.stop(), minioContainer.stop()]);
}, 60 * 1000);

export { app, moduleFixture };
