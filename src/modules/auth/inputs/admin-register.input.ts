import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsString, IsNotEmpty, IsOptional, MinLength } from 'class-validator';
import { Sanitize, SanitizeRichText } from 'src/common/decorators/sanitize.decorator';

@InputType({
  description: 'Входные данные для регистрации администратора компании',
})
export class AdminRegisterInput {
  @Field({
    description: 'Фамилия, имя и отчество администратора',
  })
  @IsString({ message: 'ФИО должно быть строкой' })
  @IsNotEmpty({ message: 'ФИО обязательно' })
  @Sanitize()
  fullName: string;

  @Field({
    description: 'Адрес электронной почты администратора',
  })
  @IsEmail({}, { message: 'Некорректный адрес электронной почты' })
  @IsNotEmpty({ message: 'Email обязателен' })
  email: string; // Email не санитизируем, так как он валидируется отдельно

  @Field({
    description: 'Пароль администратора',
  })
  @IsString({ message: 'Пароль должен быть строкой' })
  @IsNotEmpty({ message: 'Пароль обязателен' })
  @MinLength(6, { message: 'Пароль должен быть не менее 6 символов' })
  password: string; // Пароль не санитизируем

  @Field({
    description: 'Название компании',
  })
  @IsString({ message: 'Название компании должно быть строкой' })
  @IsNotEmpty({ message: 'Название компании обязательно' })
  @Sanitize()
  companyName: string;

  @Field(() => String, {
    nullable: true,
    description: 'Описание компании',
  })
  @IsOptional()
  @IsString({ message: 'Описание компании должно быть строкой' })
  @SanitizeRichText()
  companyDescription?: string | null;
}



  @Field(() => String, {
    nullable: true,
    description: 'Описание компании',
  })
  @IsOptional()
  @IsString({ message: 'Описание компании должно быть строкой' })
  @SanitizeRichText()
  companyDescription?: string | null;
}



  @Field(() => String, {
    nullable: true,
    description: 'Описание компании',
  })
  @IsOptional()
  @IsString({ message: 'Описание компании должно быть строкой' })
  @SanitizeRichText()
  companyDescription?: string | null;
}

