import { Field, InputType } from '@nestjs/graphql';
import { Sanitize, SanitizeRichText } from 'src/common/decorators/sanitize.decorator';

@InputType({
  description: 'Входные данные для регистрации администратора компании',
})
export class AdminRegisterInput {
  @Field({
    description: 'Фамилия, имя и отчество администратора',
  })
  @Sanitize()
  fullName: string;

  @Field({
    description: 'Адрес электронной почты администратора',
  })
  email: string; // Email не санитизируем, так как он валидируется отдельно

  @Field({
    description: 'Пароль администратора',
  })
  password: string; // Пароль не санитизируем

  @Field({
    description: 'Название компании',
  })
  @Sanitize()
  companyName: string;

  @Field(() => String, {
    nullable: true,
    description: 'Описание компании',
  })
  @SanitizeRichText()
  companyDescription?: string | null;
}

