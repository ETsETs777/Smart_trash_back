import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { ImageEntity } from 'src/entities/files/image.entity';

import generateImage from 'jdenticon';
import { createImageAndAvatar } from 'src/modules/files/utils/image';
import { ImageEndpoints } from 'src/modules/files/endpoints/image.endpoints';
import { createHashMd5InHex } from 'src/modules/files/utils/hash';
import { App } from 'supertest/types';

describe('ImageController (e2e)', () => {
  let app: INestApplication;
  let httpServer: App;
  let createdImage: ImageEntity;
  let imageBuffer: Buffer<ArrayBufferLike>;

  beforeAll(async () => {
    const setup = await import('../setup-tests.e2e');
    app = setup.app;
    httpServer = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it(`1) POST ${ImageEndpoints.routeImageUpload} - should upload an image successfully`, async () => {
    imageBuffer = generateImage.toPng('test image', 255);

    const response = await request(httpServer)
      .post(ImageEndpoints.routeImageUpload)
      .attach('file', imageBuffer, 'testimage.png')
      .field('filename', 'testimage.png')
      .field('description', 'This is a test image');

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('testimage.png');
    expect(response.body.description).toBe('This is a test image');
    expect(response.body.ext).toBe('.jpg');
    expect(response.body).toHaveProperty('checksum');

    createdImage = response.body;
  });

  it(`2) GET ${ImageEndpoints.routeImageView} - should view the uploaded image`, async () => {
    const response = await request(httpServer)
      .get(ImageEndpoints.imageView(createdImage.id))
      .expect(302); // Redirect to presigned URL

    expect(response.headers.location).toContain('/images/');
  });

  it(`3) GET ${ImageEndpoints.routeAvatarGet} - should view the avatar of the uploaded image`, async () => {
    const response = await request(httpServer)
      .get(ImageEndpoints.avatarGet(createdImage.id))
      .expect(302); // Redirect to presigned URL

    expect(response.headers.location).toContain('/images/');
  });

  it(`4) GET ${ImageEndpoints.routeImageDownload} - should download the uploaded image`, async () => {
    const response = await request(httpServer)
      .get(ImageEndpoints.imageDownload(createdImage.id))
      .expect(200); // Redirect to presigned URL for download

    const { bufferImage, bufferAvatar } = await createImageAndAvatar({
      buffer: imageBuffer,
    });

    expect(
      createHashMd5InHex(bufferImage) === createHashMd5InHex(response.body),
    ).toBe(true);
    expect(
      createHashMd5InHex(bufferAvatar) !== createHashMd5InHex(response.body),
    ).toBe(true);
  });

  it(`5) POST ${ImageEndpoints.routeImageUpdate} - should update (rotate) the image`, async () => {
    const newAngle = '90';
    const newImageBuffer = generateImage.toPng('test image2', 666); // Mock rotated JPEG buffer

    const response = await request(httpServer)
      .post(ImageEndpoints.imageUpdate(createdImage.id, Number(newAngle)))
      .attach('file', newImageBuffer, 'testimage.png')
      .field('filename', 'testimage_rotated.png')
      .field('description', 'Rotated test image');

    expect(response.status).toBe(201);
    expect(response.body.id).toBe(createdImage.id);
    expect(response.body.name).toBe('testimage_rotated.png');
    expect(response.body.description).toBe('Rotated test image');
    expect(response.body.ext).toBe('.jpg');
    expect(response.body).toHaveProperty('checksum');
  });

  it(`6) POST ${ImageEndpoints.routeImageUpdate} - Должен вернуть 404. Изображение не найден`, async () => {
    const newAngle = 90;
    const id = '10195afd-bb63-45a5-bf75-4be00cf86be6';
    const fakeImageBuffer = generateImage.toPng('image for test 6', 64);
    const response = await request(httpServer)
      .post(ImageEndpoints.imageUpdate(id, newAngle))
      .attach('file', fakeImageBuffer, 'nonexistent.png')
      .field('filename', 'nonexistent.png')
      .field('description', 'Non-existent image');
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty(
      'message',
      `Изображение с id=${id} не найден`,
    );
  });

  it(`7) POST ${ImageEndpoints.routeImageUpdate} - Должен вернуть 400. Ожидается ошибка валидации uuid`, async () => {
    const newAngle = '90';
    const fakeImageBuffer = generateImage.toPng('image for test 6', 64);
    const response = await request(httpServer)
      .post(ImageEndpoints.imageUpdate('non-existing-id', Number(newAngle)))
      .attach('file', fakeImageBuffer, 'nonexistent.png')
      .field('filename', 'nonexistent.png')
      .field('description', 'Non-existent image');
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty(
      'message',
      `Validation failed (uuid v 4 is expected)`,
    );
  });

  it(`8) POST ${ImageEndpoints.routeImageUpdate} - Должен вернуть 400. Некорректное числовое значение для параметра angle`, async () => {
    const newAngle = 'non-existing-id';
    const id = '10195afd-bb63-45a5-bf75-4be00cf86be6';
    const fakeImageBuffer = generateImage.toPng('image for test 6', 64);
    const response = await request(httpServer)
      .post(ImageEndpoints.imageUpdate(id, Number(newAngle)))
      .attach('file', fakeImageBuffer, 'nonexistent.png')
      .field('filename', 'nonexistent.png')
      .field('description', 'Non-existent image');
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty(
      'message',
      `Некорректное числовое значение для параметра angle. Значение должно быть конечным числом.`,
    );
  });
});
