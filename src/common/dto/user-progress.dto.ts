import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'Прогресс пользователя в геймификации' })
export class UserProgressDto {
  @Field(() => Int, { description: 'Текущий уровень пользователя' })
  level: number;

  @Field(() => Int, { description: 'Текущий опыт пользователя' })
  experience: number;

  @Field(() => Int, { description: 'Общее количество очков пользователя' })
  totalPoints: number;

  @Field(() => Int, { description: 'Текущая серия дней подряд (streak)' })
  currentStreak: number;

  @Field(() => Int, { description: 'Лучшая серия дней подряд' })
  bestStreak: number;

  @Field(() => Int, { description: 'Опыт до следующего уровня' })
  experienceToNextLevel: number;

  @Field(() => Int, { description: 'Процент прогресса к следующему уровню (0-100)' })
  levelProgress: number;
}

