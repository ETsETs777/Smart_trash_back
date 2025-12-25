import { Args, ID, Int, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { WastePhotoEntity } from 'src/entities/smart-trash/waste-photo.entity';
import { WastePhotoCreateInput } from '../inputs/waste-photo-create.input';
import { WastePhotoService } from '../services/waste-photo.service';
import { PubSubService } from 'src/common/pubsub/pubsub.service';
import { Public } from 'src/decorators/auth/public.decorator';
import { Roles } from 'src/modules/auth/roles.decorator';
import { AuthRole } from 'src/modules/auth/auth-role.enum';
import { CurrentUser } from 'src/decorators/auth/current-user.decorator';
import { JwtPayload } from 'src/modules/auth/jwt-payload.interface';
import { PaginatedWastePhotos } from 'src/common/dto/paginated-waste-photos.dto';

@Resolver(() => WastePhotoEntity)
export class WastePhotoResolver {
  constructor(
    private readonly wastePhotoService: WastePhotoService,
    private readonly pubSub: PubSubService,
  ) {}

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
    description: 'История сортировок по компании/пользователю (legacy, используйте wastePhotosPaginated)',
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

  @Query(() => PaginatedWastePhotos, {
    description: 'История сортировок по компании/пользователю с пагинацией',
  })
  @Roles(AuthRole.ADMIN_COMPANY, AuthRole.EMPLOYEE)
  async wastePhotosPaginated(
    @CurrentUser() user: JwtPayload,
    @Args('companyId', { type: () => ID }) companyId: string,
    @Args('userId', { type: () => ID, nullable: true }) userId: string | null,
    @Args('page', { type: () => Int, nullable: true, defaultValue: 1 }) page?: number,
    @Args('pageSize', { type: () => Int, nullable: true, defaultValue: 20 }) pageSize?: number,
    @Args('dateFrom', { nullable: true }) dateFrom?: Date,
    @Args('dateTo', { nullable: true }) dateTo?: Date,
  ): Promise<PaginatedWastePhotos> {
    const result = await this.wastePhotoService.findManyWithPagination({
      companyId,
      userId,
      page: page || 1,
      pageSize: pageSize || 20,
      dateFrom,
      dateTo,
      currentUser: user,
    });

    const totalPages = Math.ceil(result.total / result.pageSize);

    return {
      items: result.items,
      meta: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages,
        hasNextPage: result.page < totalPages,
        hasPreviousPage: result.page > 1,
      },
    };
  }

  @Public()
  @Subscription(() => WastePhotoEntity, {
    description: 'Подписка на обновления статуса классификации фотографии мусора',
    filter: (payload, variables) => {
      // Filter by wastePhotoId if provided
      if (variables.wastePhotoId) {
        return payload.wastePhotoStatusUpdated.id === variables.wastePhotoId;
      }
      return true;
    },
  })
  wastePhotoStatusUpdated(
    @Args('wastePhotoId', { type: () => ID, nullable: true })
    wastePhotoId?: string,
  ) {
    return this.pubSub.asyncIterator('wastePhotoStatusUpdated');
  }
}
