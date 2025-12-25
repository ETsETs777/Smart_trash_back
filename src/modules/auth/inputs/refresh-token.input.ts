import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType({
  description: 'Входные данные для обновления access токена',
})
export class RefreshTokenInput {
  @Field(() => String, {
    description: 'Refresh токен для получения нового access токена',
  })
  @IsString({ message: 'Refresh токен должен быть строкой' })
  @IsNotEmpty({ message: 'Refresh токен обязателен' })
  refreshToken: string;
}

