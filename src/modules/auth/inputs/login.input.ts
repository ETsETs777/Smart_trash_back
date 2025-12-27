import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

@InputType({
  description: 'Входные данные для авторизации пользователя',
})
export class LoginInput {
  @Field({
    description: 'Адрес электронной почты пользователя',
  })
  @IsEmail({}, { message: 'Некорректный адрес электронной почты' })
  @IsNotEmpty({ message: 'Email обязателен' })
  email: string;

  @Field({
    description: 'Пароль пользователя',
  })
  @IsString({ message: 'Пароль должен быть строкой' })
  @IsNotEmpty({ message: 'Пароль обязателен' })
  password: string;
}


  @IsNotEmpty({ message: 'Пароль обязателен' })
  password: string;
}


  @IsNotEmpty({ message: 'Пароль обязателен' })
  password: string;
}

