import { Field, ID, InputType } from '@nestjs/graphql';
import { Sanitize, SanitizeRichText } from 'src/common/decorators/sanitize.decorator';

@InputType({
  description: 'Входные данные для создания новой компании администратором',
})
export class CompanyCreateInput {
  @Field({
    description: 'Название компании',
  })
  @Sanitize()
  name: string;

  @Field(() => String, {
    nullable: true,
    description: 'Краткое описание компании',
  })
  @SanitizeRichText()
  description?: string | null;

  @Field(() => ID, {
    nullable: true,
    description: 'Идентификатор изображения логотипа компании',
  })
  logoId?: string | null;
}


