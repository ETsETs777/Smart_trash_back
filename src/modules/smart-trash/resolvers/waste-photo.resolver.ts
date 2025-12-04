import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { WastePhotoEntity } from 'src/entities/smart-trash/waste-photo.entity';
import { WastePhotoCreateInput } from '../inputs/waste-photo-create.input';
import { WastePhotoService } from '../services/waste-photo.service';
import { Public } from 'src/decorators/auth/public.decorator';

@Resolver(() => WastePhotoEntity)
export class WastePhotoResolver {
  constructor(private readonly wastePhotoService: WastePhotoService) {}

  @Mutation(() => WastePhotoEntity, {
    description:
      'Создаёт запись о фотографии мусора и отправляет её в очередь BullMQ для классификации через GigaChat. Доступно без авторизации для незарегистрированных пользователей',
  })
  @Public()
  createWastePhoto(
    @Args('input', {
      description:
        'Данные о компании, изображении, пользователе (опционально) и области сбора для создания фотографии мусора',
    })
    input: WastePhotoCreateInput,
  ): Promise<WastePhotoEntity> {
    return this.wastePhotoService.createAndEnqueue(input);
  }
}
