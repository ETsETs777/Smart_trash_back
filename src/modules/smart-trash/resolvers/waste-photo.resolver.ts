import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { WastePhotoEntity } from 'src/entities/smart-trash/waste-photo.entity';
import { WastePhotoCreateInput } from '../inputs/waste-photo-create.input';
import { WastePhotoService } from '../services/waste-photo.service';
import { Public } from 'src/decorators/auth/public.decorator';
import { Roles } from 'src/modules/auth/roles.decorator';
import { AuthRole } from 'src/modules/auth/auth-role.enum';
import { CurrentUser } from 'src/decorators/auth/current-user.decorator';
import { JwtPayload } from 'src/modules/auth/jwt-payload.interface';
import { SortAndPaginationInput } from 'src/common/gql/sort-and-pagination.input';

@Resolver(() => WastePhotoEntity)
export class WastePhotoResolver {
  constructor(private readonly wastePhotoService: WastePhotoService) {}

  @Query(() => WastePhotoEntity, {
    description: 'Возвращает фотографию мусора по идентификатору. Доступно без авторизации для polling статуса',
  })
  @Public()
  wastePhoto(
    @Args('id', {
      type: () => ID,
      description: 'Идентификатор фотографии мусора',
    })
    id: string,
  ): Promise<WastePhotoEntity> {
    return this.wastePhotoService.findById(id);
  }

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

  @Query(() => [WastePhotoEntity], {
    description: 'История сортировок по компании/пользователю',
  })
  @Roles(AuthRole.ADMIN_COMPANY, AuthRole.EMPLOYEE)
  wastePhotos(
    @CurrentUser() user: JwtPayload,
    @Args('companyId', { type: () => ID }) companyId: string,
    @Args('userId', { type: () => ID, nullable: true }) userId: string | null,
    @Args('skip', { type: () => Int, nullable: true }) skip?: number,
    @Args('take', { type: () => Int, nullable: true }) take?: number,
    @Args('dateFrom', { nullable: true }) dateFrom?: Date,
    @Args('dateTo', { nullable: true }) dateTo?: Date,
  ): Promise<WastePhotoEntity[]> {
    return this.wastePhotoService.findMany({ companyId, userId, skip, take, dateFrom, dateTo, currentUser: user });
  }
}
