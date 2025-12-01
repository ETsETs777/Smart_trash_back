import { INestApplication } from '@nestjs/common';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';

import { ImageEntity } from 'src/entities/files/image.entity';

describe('ImageResolver (e2e)', () => {
  let app: INestApplication;
  let imageRepository: Repository<ImageEntity>;

  let image: ImageEntity;

  beforeAll(async () => {
    const setup = await import('../setup-tests.e2e');
    app = setup.app;
    imageRepository = app.get<Repository<ImageEntity>>(
      getRepositoryToken(ImageEntity),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  async function UpdateImageStore(input: { id: string; isVisible: boolean }) {
    const mutation = `
      mutation UpdateImageStore($input: ImageStoreUpdateInput!) {
        updateImageStore(input: $input) {
          id
          isVisible
        }
      }
    `;
    const variables = { input };
    const response = await request(app.getHttpServer()).post('/graphql').send({
      query: mutation,
      variables,
    });
    return response;
  }

  it('1.1) updateImageStore mutation. Первое изменение поля isVisible', async () => {
    image = await imageRepository.save({
      name: 'graphql-image.jpg',
      ext: '.jpg',
      description: 'GraphQL test image',
      width: 800,
      height: 600,
      checksum: 'dummychecksum5',
      isVisible: false,
    });

    const response = await UpdateImageStore({ id: image.id, isVisible: true });

    expect(response.status).toBe(200);
    expect(response.body.data.updateImageStore.id).toBe(image.id);
    expect(response.body.data.updateImageStore.isVisible).toBe(true);

    // Verify the image is updated in the repository
    const updatedImage = await imageRepository.findOne({
      where: { id: image.id },
    });
    expect(updatedImage).toBeDefined();
    if (!updatedImage) return new Error(`Обновленная картинка отсутствует`);
    expect(updatedImage.isVisible).toBe(true);
    image = updatedImage;
  });

  it('1.2) updateImageStore mutation. Повторное изменение поля isVisible на тоже самое.', async () => {
    const response = await UpdateImageStore({ id: image.id, isVisible: true });

    expect(response.status).toBe(200);
    expect(response.body.data.updateImageStore.id).toBe(image.id);
    expect(response.body.data.updateImageStore.isVisible).toBe(true);
  });

  it('2) updateImageStore mutation. Должен вернуть Изображение не найдено', async () => {
    const input = {
      id: '123e4567-e89b-12d3-a456-999999999999', // random uuid
      isVisible: true,
    };

    const response = await UpdateImageStore(input);

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message).toBe(
      `Изображение с id=${input.id} не найдено`,
    );
  });

  it('3) updateImageStore mutation. Должен вернуть ошибку: value is not a valid UUID: non-existing-id', async () => {
    const input = {
      id: 'non-existing-id',
      isVisible: true,
    };

    const response = await UpdateImageStore(input);

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message).toContain('invalid value');
    expect(response.body.errors[0].message as string).toContain(
      'Value is not a valid UUID: non-existing-id',
    );
  });
});
