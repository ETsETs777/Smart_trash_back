import { Field, InputType } from '@nestjs/graphql';
import { IsString, IsNotEmpty } from 'class-validator';

@InputType({
  description: 'Входные данные для подтверждения адреса электронной почты',
})
export class ConfirmEmailInput {
  @Field({
    description: 'Токен подтверждения, отправленный на электронную почту',
  })
  @IsString({ message: 'Токен должен быть строкой' })
  @IsNotEmpty({ message: 'Токен обязателен' })
  token: string;
}

