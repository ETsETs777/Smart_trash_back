import { Field, ID, InputType } from '@nestjs/graphql';
import { IsEmail, IsString, IsNotEmpty, IsUUID, MinLength } from 'class-validator';

@InputType({
  description: 'Входные данные для регистрации сотрудника компании',
})
export class EmployeeRegisterInput {
  @Field({
    description: 'Фамилия, имя и отчество сотрудника',
  })
  @IsString({ message: 'ФИО должно быть строкой' })
  @IsNotEmpty({ message: 'ФИО обязательно' })
  fullName: string;

  @Field({
    description: 'Адрес электронной почты сотрудника',
  })
  @IsEmail({}, { message: 'Некорректный адрес электронной почты' })
  @IsNotEmpty({ message: 'Email обязателен' })
  email: string;

  @Field({
    description: 'Пароль сотрудника',
  })
  @IsString({ message: 'Пароль должен быть строкой' })
  @IsNotEmpty({ message: 'Пароль обязателен' })
  @MinLength(6, { message: 'Пароль должен быть не менее 6 символов' })
  password: string;

  @Field(() => ID, {
    description: 'Идентификатор компании, в которой работает сотрудник',
  })
  @IsUUID('4', { message: 'Идентификатор компании должен быть валидным UUID' })
  @IsNotEmpty({ message: 'Идентификатор компании обязателен' })
  companyId: string;
}

