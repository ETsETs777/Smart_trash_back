import { Field, ID, InputType } from '@nestjs/graphql';

@InputType({
  description: 'Входные данные для создания новой компании администратором',
})
export class CompanyCreateInput {
  @Field({
    description: 'Название компании',
  })
  name: string;

  @Field(() => String, {
    nullable: true,
    description: 'Краткое описание компании',
  })
  description?: string | null;

  @Field(() => ID, {
    nullable: true,
    description: 'Идентификатор изображения логотипа компании',
  })
  logoId?: string | null;
}


