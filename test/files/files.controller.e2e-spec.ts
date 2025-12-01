import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { FileEntity } from '../../src/entities/files/file.entity';
import { FileEndpoints } from 'src/modules/files/endpoints/file.endpoints';
import { createHashMd5InHex } from 'src/modules/files/utils/hash';
import { App } from 'supertest/types';

describe('FilesController (e2e)', () => {
  let app: INestApplication;
  let httpServer: App;
  let createdFile1: FileEntity;
  let createdFile2: FileEntity;

  let fileBuffer1: Buffer<ArrayBuffer>;
  let fileBuffer2: Buffer<ArrayBuffer>;

  beforeAll(async () => {
    const setup = await import('../setup-tests.e2e');
    app = setup.app;
    httpServer = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it(`1.1) POST ${FileEndpoints.routeFileUpload} - should upload a file successfully`, async () => {
    fileBuffer1 = Buffer.from('Test file content');

    const response = await request(httpServer)
      .post(FileEndpoints.routeFileUpload)
      .attach('file', fileBuffer1, 'testfile.txt')
      .field('filename', 'testfile.txt')
      .field('description', 'This is a test file');

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('testfile.txt');
    expect(response.body.description).toBe('This is a test file');
    expect(response.body.ext).toBe('.txt');

    createdFile1 = response.body;
  });

  it(`1.2) POST ${FileEndpoints.routeFileUpload} - should upload a file with size zero successfully`, async () => {
    fileBuffer2 = Buffer.from(''); // empty

    const response = await request(httpServer)
      .post(FileEndpoints.routeFileUpload)
      .attach('file', fileBuffer2, 'testfile.txt')
      .field('filename', 'testfile.txt')
      .field('description', 'This is a test file');

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('testfile.txt');
    expect(response.body.description).toBe('This is a test file');
    expect(response.body.ext).toBe('.txt');

    createdFile2 = response.body;
  });

  it(`2.1) GET ${FileEndpoints.routeGetFileS3Url} - Должен скачать файл с сервиса`, async () => {
    const downloaded = await request(httpServer)
      .get(`/files/${createdFile1.id}`)
      .buffer()
      .parse((res, callback) => {
        const data: Buffer[] = [];
        res.on('data', (chunk: Buffer) => {
          data.push(chunk);
        });
        res.on('end', () => {
          callback(null, Buffer.concat(data));
        });
      })
      .expect(200);

    expect(createHashMd5InHex(fileBuffer1)).toBe(
      createHashMd5InHex(downloaded.body),
    );
  });

  it(`2.2) GET ${FileEndpoints.routeGetFileS3Url} - Должен скачать файл с сервиса`, async () => {
    const downloaded = await request(httpServer)
      .get(`/files/${createdFile2.id}`)
      .buffer()
      .parse((res, callback) => {
        const data: Buffer[] = [];
        res.on('data', (chunk: Buffer) => {
          data.push(chunk);
        });
        res.on('end', () => {
          callback(null, Buffer.concat(data));
        });
      })
      .expect(200);

    expect(createHashMd5InHex(fileBuffer2)).toBe(
      createHashMd5InHex(downloaded.body),
    );
  });

  it(`3) GET ${FileEndpoints.routeGetFileS3Url} - Должен вернуть 400. Ожидается ошибка валидации uuid`, async () => {
    const response = await request(httpServer)
      .get(`/files/non-existing-id`)
      .expect(400);

    expect(response.body.message).toBe(
      'Validation failed (uuid v 4 is expected)',
    );
  });
});
