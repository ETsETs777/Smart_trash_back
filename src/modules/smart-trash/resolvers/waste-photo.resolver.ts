import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { WastePhotoEntity } from 'src/entities/smart-trash/waste-photo.entity';
import { WastePhotoCreateInput } from '../inputs/waste-photo-create.input';
import { WastePhotoService } from '../services/waste-photo.service';
import { Roles } from 'src/modules/auth/roles.decorator';
import { AuthRole } from 'src/modules/auth/auth-role.enum';
import { CurrentEmployee } from 'src/decorators/auth/current-employee.decorator';
import { CurrentNonAuthEmployee } from 'src/decorators/auth/current-non-auth-employee.decorator';
import { JwtPayload } from 'src/modules/auth/jwt-payload.interface';

@Resolver(() => WastePhotoEntity)
export class WastePhotoResolver {
  constructor(private readonly wastePhotoService: WastePhotoService) {}

  @Mutation(() => WastePhotoEntity, {
    description:
      'Создаёт запись о фотографии мусора и отправляет её в очередь BullMQ для классификации через GigaChat',
  })
  @Roles(
    AuthRole.COMPANY_ADMIN,
    AuthRole.EMPLOYEE,
    AuthRole.NON_AUTH_EMPLOYEE,
  )
  createWastePhoto(
    @Args('input', {
      description:
        'Данные о компании, изображении, сотруднике и области сбора для создания фотографии мусора',
    })
    input: WastePhotoCreateInput,
    @CurrentEmployee() _employee: JwtPayload | null,
    @CurrentNonAuthEmployee() _nonAuthEmployee: JwtPayload | null,
  ): Promise<WastePhotoEntity> {
    return this.wastePhotoService.createAndEnqueue(input);
  }
}


