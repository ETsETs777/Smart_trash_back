import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CompanyEntity } from 'src/entities/smart-trash/company.entity';
import { CompanyService } from '../services/company.service';
import { CompanyCreateInput } from '../inputs/company-create.input';
import { CompanyUpdateInput } from '../inputs/company-update.input';
import { Roles } from 'src/modules/auth/roles.decorator';
import { AuthRole } from 'src/modules/auth/auth-role.enum';
import { CurrentUser } from 'src/decorators/auth/current-user.decorator';
import { JwtPayload } from 'src/modules/auth/jwt-payload.interface';
import { Public } from 'src/decorators/auth/public.decorator';

@Resolver(() => CompanyEntity)
export class CompanyResolver {
  constructor(private readonly companyService: CompanyService) {}

  @Mutation(() => CompanyEntity, {
    description: 'Создаёт новую компанию. Доступно только администратору компании',
  })
  @Roles(AuthRole.ADMIN_COMPANY)
  createCompany(
    @Args('input', {
      description: 'Данные для создания компании',
    })
    input: CompanyCreateInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<CompanyEntity> {
    return this.companyService.createCompany(input, user);
  }

  @Mutation(() => CompanyEntity, {
    description: 'Обновляет данные компании. Доступно только администратору компании',
  })
  @Roles(AuthRole.ADMIN_COMPANY)
  updateCompany(
    @Args('input', {
      description: 'Данные для обновления компании',
    })
    input: CompanyUpdateInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<CompanyEntity> {
    return this.companyService.updateCompany(input, user);
  }

  @Mutation(() => Boolean, {
    description: 'Удаляет компанию. Доступно только администратору компании',
  })
  @Roles(AuthRole.ADMIN_COMPANY)
  deleteCompany(
    @Args('id', {
      type: () => ID,
      description: 'Идентификатор компании для удаления',
    })
    id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<boolean> {
    return this.companyService.deleteCompany(id, user);
  }

  @Query(() => [CompanyEntity], {
    description:
      'Возвращает список компаний, к которым имеет доступ текущий администратор или сотрудник',
  })
  @Roles(AuthRole.ADMIN_COMPANY, AuthRole.EMPLOYEE)
  companies(@CurrentUser() user: JwtPayload): Promise<CompanyEntity[]> {
    return this.companyService.getAllCompaniesForCurrentUser(user);
  }

  @Query(() => CompanyEntity, {
    description:
      'Возвращает компанию по идентификатору, если текущий администратор или сотрудник имеет к ней доступ',
  })
  @Roles(AuthRole.ADMIN_COMPANY, AuthRole.EMPLOYEE)
  company(
    @Args('id', {
      type: () => ID,
      description: 'Идентификатор компании',
    })
    id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<CompanyEntity> {
    return this.companyService.getCompanyByIdForCurrentUser(id, user);
  }

  @Query(() => CompanyEntity, {
    description: 'Возвращает компанию по QR коду. Доступно без авторизации для сканирования',
  })
  @Public()
  companyByQR(
    @Args('qrCode', {
      description: 'QR код компании',
    })
    qrCode: string,
  ): Promise<CompanyEntity> {
    return this.companyService.getCompanyByQRCode(qrCode);
  }
}


