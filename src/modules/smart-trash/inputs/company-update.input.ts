import { Field, ID, InputType } from '@nestjs/graphql';
import { Sanitize, SanitizeRichText } from 'src/common/decorators/sanitize.decorator';

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
  @Sanitize()
  name?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Новое краткое описание компании',
  })
  @SanitizeRichText()
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


