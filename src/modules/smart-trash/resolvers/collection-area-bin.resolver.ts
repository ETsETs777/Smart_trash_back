import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CollectionAreaBinEntity } from 'src/entities/smart-trash/collection-area-bin.entity';
import { CollectionAreaBinService } from '../services/collection-area-bin.service';
import { CollectionAreaBinCreateInput } from '../inputs/collection-area-bin-create.input';
import { CollectionAreaBinUpdateInput } from '../inputs/collection-area-bin-update.input';
import { CollectionAreaBinsAddInput } from '../inputs/collection-area-bins-add.input';
import { Roles } from 'src/modules/auth/roles.decorator';
import { AuthRole } from 'src/modules/auth/auth-role.enum';
import { CurrentUser } from 'src/decorators/auth/current-user.decorator';
import { JwtPayload } from 'src/modules/auth/jwt-payload.interface';

@Resolver(() => CollectionAreaBinEntity)
export class CollectionAreaBinResolver {
  constructor(private readonly binService: CollectionAreaBinService) {}

  @Query(() => [CollectionAreaBinEntity], {
    description:
      'Возвращает список мусорок для указанной точки сбора. Доступно администратору и сотруднику компании',
  })
  @Roles(AuthRole.ADMIN_COMPANY, AuthRole.EMPLOYEE)
  collectionAreaBins(
    @Args('areaId', {
      type: () => ID,
      description: 'Идентификатор точки сбора',
    })
    areaId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<CollectionAreaBinEntity[]> {
    return this.binService.getAllBinsForArea(areaId, user);
  }

  @Query(() => CollectionAreaBinEntity, {
    description:
      'Возвращает мусорку по идентификатору. Доступно администратору и сотруднику компании',
  })
  @Roles(AuthRole.ADMIN_COMPANY, AuthRole.EMPLOYEE)
  collectionAreaBin(
    @Args('id', {
      type: () => ID,
      description: 'Идентификатор мусорки',
    })
    id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<CollectionAreaBinEntity> {
    return this.binService.getBinById(id, user);
  }

  @Mutation(() => CollectionAreaBinEntity, {
    description: 'Создаёт мусорку в точке сбора. Доступно только администратору компании',
  })
  @Roles(AuthRole.ADMIN_COMPANY)
  createCollectionAreaBin(
    @Args('input', {
      description: 'Данные для создания мусорки',
    })
    input: CollectionAreaBinCreateInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<CollectionAreaBinEntity> {
    return this.binService.createBin(input, user);
  }

  @Mutation(() => CollectionAreaBinEntity, {
    description: 'Обновляет данные мусорки. Доступно только администратору компании',
  })
  @Roles(AuthRole.ADMIN_COMPANY)
  updateCollectionAreaBin(
    @Args('input', {
      description: 'Данные для обновления мусорки',
    })
    input: CollectionAreaBinUpdateInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<CollectionAreaBinEntity> {
    return this.binService.updateBin(input, user);
  }

  @Mutation(() => Boolean, {
    description: 'Удаляет мусорку. Доступно только администратору компании',
  })
  @Roles(AuthRole.ADMIN_COMPANY)
  deleteCollectionAreaBin(
    @Args('id', {
      type: () => ID,
      description: 'Идентификатор мусорки для удаления',
    })
    id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<boolean> {
    return this.binService.deleteBin(id, user);
  }

  @Mutation(() => [CollectionAreaBinEntity], {
    description:
      'Добавляет несколько мусорок в точку сбора. Доступно только администратору компании',
  })
  @Roles(AuthRole.ADMIN_COMPANY)
  addBinsToCollectionArea(
    @Args('input', {
      description: 'Данные для добавления мусорок',
    })
    input: CollectionAreaBinsAddInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<CollectionAreaBinEntity[]> {
    return this.binService.addBinsToArea(input, user);
  }
}
