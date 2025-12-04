import { Field, InputType } from '@nestjs/graphql';

@InputType({
  description: 'Входные данные для подтверждения адреса электронной почты',
})
export class ConfirmEmailInput {
  @Field({
    description: 'Токен подтверждения, отправленный на электронную почту',
  })
  token: string;
}

