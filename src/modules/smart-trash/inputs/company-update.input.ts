import { Field, ID, InputType } from '@nestjs/graphql';

@InputType({
  description: 'Входные данные для обновления существующей компании администратором',
})
export class CompanyUpdateInput {
  @Field(() => ID, {
    description: 'Идентификатор компании, которую нужно обновить',
  })
  id: string;

  @Field({
    nullable: true,
    description: 'Новое название компании',
  })
  name?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Новое краткое описание компании',
  })
  description?: string | null;

  @Field(() => Boolean, {
    nullable: true,
    description: 'Флаг активности компании',
  })
  isActive?: boolean;

  @Field(() => ID, {
    nullable: true,
    description: 'Идентификатор изображения логотипа компании',
  })
  logoId?: string | null;
}


