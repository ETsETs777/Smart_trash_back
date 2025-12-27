import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import DataLoader from 'dataloader';
import { ImageEntity } from 'src/entities/files/image.entity';

/**
 * DataLoader for Image entities
 * Solves N+1 problem when loading images by IDs
 */
@Injectable()
export class ImageLoader {
  private readonly loader: DataLoader<string, ImageEntity | null>;

  constructor(
    @InjectRepository(ImageEntity)
    private readonly imageRepository: Repository<ImageEntity>,
  ) {
    this.loader = new DataLoader<string, ImageEntity | null>(
      async (ids: readonly string[]) => {
        const images = await this.imageRepository.find({
          where: ids.map((id) => ({ id })),
        });

        // Create a map for quick lookup
        const imageMap = new Map<string, ImageEntity>();
        images.forEach((image) => {
          imageMap.set(image.id, image);
        });

        // Return images in the same order as requested IDs
        return ids.map((id) => imageMap.get(id) || null);
      },
      {
        cache: true,
        maxBatchSize: 100,
      },
    );
  }

  async load(id: string): Promise<ImageEntity | null> {
    return this.loader.load(id);
  }

  async loadMany(ids: string[]): Promise<(ImageEntity | null)[]> {
    const results = await this.loader.loadMany(ids);
    return results.map((result) => (result instanceof Error ? null : result));
  }
}



