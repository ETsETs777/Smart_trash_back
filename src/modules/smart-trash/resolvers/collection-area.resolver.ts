import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { CollectionAreaEntity } from 'src/entities/smart-trash/collection-area.entity';
import { CollectionAreaCreateInput } from '../inputs/collection-area-create.input';
import { CollectionAreaService } from '../services/collection-area.service';
import { Roles } from 'src/modules/auth/roles.decorator';
import { AuthRole } from 'src/modules/auth/auth-role.enum';
import { CurrentAdmin } from 'src/decorators/auth/current-admin.decorator';
import { JwtPayload } from 'src/modules/auth/jwt-payload.interface';

@Resolver(() => CollectionAreaEntity)
export class CollectionAreaResolver {
  constructor(private readonly collectionAreaService: CollectionAreaService) {}

  @Mutation(() => CollectionAreaEntity, {
    description:
      'Создаёт область сбора мусора и задаёт, какие типы контейнеров в ней присутствуют',
  })
  @Roles(AuthRole.COMPANY_ADMIN)
  createCollectionArea(
    @Args('input', {
      description:
        'Данные для создания области сбора и список присутствующих типов контейнеров',
    })
    input: CollectionAreaCreateInput,
    @CurrentAdmin() _admin: JwtPayload | null,
  ): Promise<CollectionAreaEntity> {
    return this.collectionAreaService.createAreaWithBins(input);
  }
}


