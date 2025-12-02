import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CompanyAdminEntity } from 'src/entities/smart-trash/company-admin.entity';
import { Public } from 'src/decorators/auth/public.decorator';
import { CompanyAdminRegisterInput } from '../inputs/company-admin-register.input';
import { CompanyAdminService } from '../services/company-admin.service';

@Resolver(() => CompanyAdminEntity)
export class CompanyAdminResolver {
  constructor(private readonly companyAdminService: CompanyAdminService) {}

  @Public()
  @Mutation(() => CompanyAdminEntity, {
    description:
      'Регистрирует администратора и одновременно создаёт для него первую компанию',
  })
  registerCompanyAdmin(
    @Args('input', {
      description:
        'Данные для регистрации администратора и создания первой компании',
    })
    input: CompanyAdminRegisterInput,
  ): Promise<CompanyAdminEntity> {
    return this.companyAdminService.registerAdminWithCompany(input);
  }

  @Query(() => CompanyAdminEntity, {
    description: 'Возвращает данные администратора компании по его идентификатору',
  })
  companyAdmin(
    @Args('id', {
      description: 'Идентификатор администратора компании',
    })
    id: string,
  ): Promise<CompanyAdminEntity> {
    return this.companyAdminService.findAdminById(id);
  }
}


