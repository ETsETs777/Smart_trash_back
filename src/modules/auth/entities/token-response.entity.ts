import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType({
  description: 'Ответ с access и refresh токенами',
})
export class TokenResponse {
  @Field(() => String, {
    description: 'Access токен для авторизации (короткий срок жизни)',
  })
  accessToken: string;

  @Field(() => String, {
    description: 'Refresh токен для обновления access токена (длинный срок жизни)',
  })
  refreshToken: string;
}

