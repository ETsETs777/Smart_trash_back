import { Field, InputType } from '@nestjs/graphql';

@InputType({
  description: 'Входные данные для регистрации администратора компании',
})
export class AdminRegisterInput {
  @Field({
    description: 'Фамилия, имя и отчество администратора',
  })
  fullName: string;

  @Field({
    description: 'Адрес электронной почты администратора',
  })
  email: string;

  @Field({
    description: 'Пароль администратора',
  })
  password: string;

  @Field({
    description: 'Название компании',
  })
  companyName: string;

  @Field(() => String, {
    nullable: true,
    description: 'Описание компании',
  })
  companyDescription?: string | null;
}

