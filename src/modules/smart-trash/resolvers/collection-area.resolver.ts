import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CollectionAreaEntity } from 'src/entities/smart-trash/collection-area.entity';
import { CollectionAreaCreateInput } from '../inputs/collection-area-create.input';
import { CollectionAreaUpdateInput } from '../inputs/collection-area-update.input';
import { CollectionAreaService } from '../services/collection-area.service';
import { Roles } from 'src/modules/auth/roles.decorator';
import { AuthRole } from 'src/modules/auth/auth-role.enum';
import { CurrentUser } from 'src/decorators/auth/current-user.decorator';
import { JwtPayload } from 'src/modules/auth/jwt-payload.interface';

@Resolver(() => CollectionAreaEntity)
export class CollectionAreaResolver {
  constructor(private readonly collectionAreaService: CollectionAreaService) {}

  @Mutation(() => CollectionAreaEntity, {
    description:
      'Создаёт область сбора мусора и задаёт, какие типы контейнеров в ней присутствуют',
  })
  @Roles(AuthRole.ADMIN_COMPANY)
  createCollectionArea(
    @Args('input', {
      description:
        'Данные для создания области сбора и список присутствующих типов контейнеров',
    })
    input: CollectionAreaCreateInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<CollectionAreaEntity> {
    return this.collectionAreaService.createAreaWithBins(input, user);
  }

  @Query(() => [CollectionAreaEntity], {
    description:
      'Возвращает список точек сбора для указанной компании. Доступно администратору и сотруднику компании',
  })
  @Roles(AuthRole.ADMIN_COMPANY, AuthRole.EMPLOYEE)
  collectionAreas(
    @Args('companyId', {
      type: () => ID,
      description: 'Идентификатор компании',
    })
    companyId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<CollectionAreaEntity[]> {
    return this.collectionAreaService.getAllAreasForCompany(companyId, user);
  }

  @Query(() => CollectionAreaEntity, {
    description:
      'Возвращает точку сбора по идентификатору. Доступно администратору и сотруднику компании',
  })
  @Roles(AuthRole.ADMIN_COMPANY, AuthRole.EMPLOYEE)
  collectionArea(
    @Args('id', {
      type: () => ID,
      description: 'Идентификатор точки сбора',
    })
    id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<CollectionAreaEntity> {
    return this.collectionAreaService.getAreaById(id, user);
  }

  @Mutation(() => CollectionAreaEntity, {
    description: 'Обновляет данные точки сбора. Доступно только администратору компании',
  })
  @Roles(AuthRole.ADMIN_COMPANY)
  updateCollectionArea(
    @Args('input', {
      description: 'Данные для обновления точки сбора',
    })
    input: CollectionAreaUpdateInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<CollectionAreaEntity> {
    return this.collectionAreaService.updateArea(input, user);
  }

  @Mutation(() => Boolean, {
    description: 'Удаляет точку сбора. Доступно только администратору компании',
  })
  @Roles(AuthRole.ADMIN_COMPANY)
  deleteCollectionArea(
    @Args('id', {
      type: () => ID,
      description: 'Идентификатор точки сбора для удаления',
    })
    id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<boolean> {
    return this.collectionAreaService.deleteArea(id, user);
  }
}

