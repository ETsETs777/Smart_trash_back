import { Field, ID, InputType } from '@nestjs/graphql';
import { IsEnum, IsNumber, IsOptional, IsUUID, Min, Max } from 'class-validator';
import { TrashBinType } from 'src/entities/smart-trash/trash-bin-type.enum';

@InputType({
  description: 'Входные данные для обновления мусорного контейнера',
})
export class CollectionAreaBinUpdateInput {
  @Field(() => ID, {
    description: 'Идентификатор контейнера',
  })
  @IsUUID('4', { message: 'Идентификатор контейнера должен быть валидным UUID' })
  @IsNotEmpty({ message: 'Идентификатор контейнера обязателен' })
  id: string;

  @Field(() => TrashBinType, {
    nullable: true,
    description: 'Тип контейнера для мусора',
  })
  @IsOptional()
  @IsEnum(TrashBinType, { message: 'Недопустимый тип контейнера' })
  type?: TrashBinType | null;

  @Field(() => Number, {
    nullable: true,
    description: 'Широта расположения контейнера',
  })
  @IsOptional()
  @IsNumber({}, { message: 'Широта должна быть числом' })
  @Min(-90, { message: 'Широта должна быть в диапазоне от -90 до 90' })
  @Max(90, { message: 'Широта должна быть в диапазоне от -90 до 90' })
  latitude?: number | null;

  @Field(() => Number, {
    nullable: true,
    description: 'Долгота расположения контейнера',
  })
  @IsOptional()
  @IsNumber({}, { message: 'Долгота должна быть числом' })
  @Min(-180, { message: 'Долгота должна быть в диапазоне от -180 до 180' })
  @Max(180, { message: 'Долгота должна быть в диапазоне от -180 до 180' })
  longitude?: number | null;
}

