import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Logger } from '@nestjs/common';
import { ImageService } from '../services/image.service';

import { ImageEntity } from 'src/entities/files/image.entity';

import { ImageStoreUpdateInput } from '../inputs/image-store-update.input';

@Resolver()
export class ImageResolver {
  private readonly logger = new Logger(ImageResolver.name);

  constructor(private readonly imageService: ImageService) {}

  /**
   * Updates the image store in the database
   * (specifically isVisible)
   * @param input
   */
  @Mutation(() => ImageEntity, {
    description:
      'Updates the image store in the database (specifically isVisible)',
  })
  async updateImageStore(
    @Args('input') input: ImageStoreUpdateInput,
  ): Promise<ImageEntity> {
    this.logger.log(`updateImageStore: ${JSON.stringify(input)}`);
    return this.imageService.updateVisible(input);
  }
}
