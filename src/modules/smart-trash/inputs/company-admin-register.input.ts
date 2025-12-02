import { Field, InputType } from '@nestjs/graphql';

@InputType({
  description:
    'Входные данные для регистрации администратора компании и создания первой компании',
})
export class CompanyAdminRegisterInput {
  @Field({
    description: 'Адрес электронной почты администратора компании',
  })
  email: string;

  @Field({
    description: 'Пароль администратора компании',
  })
  password: string;

  @Field({
    description: 'Имя администратора компании',
  })
  firstName: string;

  @Field({
    description: 'Фамилия администратора компании',
  })
  lastName: string;

  @Field({
    description: 'Название создаваемой компании',
  })
  companyName: string;

  @Field(() => String, {
    nullable: true,
    description: 'Краткое описание создаваемой компании',
  })
  companyDescription?: string | null;
}


