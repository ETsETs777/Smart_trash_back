import { Field, ID, InputType } from '@nestjs/graphql';
import { IsNumber, Min, Max, IsNotEmpty, IsEnum, IsArray, ValidateNested, IsOptional, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { TrashBinType } from 'src/entities/smart-trash/trash-bin-type.enum';

@InputType({
  description: 'Координаты контейнера',
})
export class BinCoordinateInput {
  @Field(() => Number, { description: 'Широта' })
  @IsNumber({}, { message: 'Широта должна быть числом' })
  @Min(-90, { message: 'Широта должна быть в диапазоне от -90 до 90' })
  @Max(90, { message: 'Широта должна быть в диапазоне от -90 до 90' })
  @IsNotEmpty({ message: 'Широта обязательна' })
  latitude: number;

  @Field(() => Number, { description: 'Долгота' })
  @IsNumber({}, { message: 'Долгота должна быть числом' })
  @Min(-180, { message: 'Долгота должна быть в диапазоне от -180 до 180' })
  @Max(180, { message: 'Долгота должна быть в диапазоне от -180 до 180' })
  @IsNotEmpty({ message: 'Долгота обязательна' })
  longitude: number;
}

@InputType({
  description: 'Входные данные для добавления контейнера с координатами',
})
export class BinWithCoordinatesInput {
  @Field(() => TrashBinType, { description: 'Тип контейнера' })
  @IsEnum(TrashBinType, { message: 'Недопустимый тип контейнера' })
  @IsNotEmpty({ message: 'Тип контейнера обязателен' })
  type: TrashBinType;

  @Field(() => BinCoordinateInput, { nullable: true, description: 'Координаты контейнера' })
  @IsOptional()
  @ValidateNested()
  @Type(() => BinCoordinateInput)
  coordinates?: BinCoordinateInput | null;
}

@InputType({
  description: 'Входные данные для добавления нескольких мусорных контейнеров в область сбора',
})
export class CollectionAreaBinsAddInput {
  @Field(() => ID, {
    description: 'Идентификатор области сбора, к которой добавляются контейнеры',
  })
  @IsNotEmpty({ message: 'Идентификатор области сбора обязателен' })
  areaId: string;

  @Field(() => [TrashBinType], {
    description: 'Список типов контейнеров для добавления (без координат)',
    nullable: true,
  })
  @IsOptional()
  @IsArray({ message: 'Типы контейнеров должны быть массивом' })
  @IsEnum(TrashBinType, { each: true, message: 'Недопустимый тип контейнера в массиве' })
  @ArrayMinSize(0, { message: 'Массив типов контейнеров не может быть пустым' })
  types?: TrashBinType[];

  @Field(() => [BinWithCoordinatesInput], {
    description: 'Список контейнеров с координатами для добавления',
    nullable: true,
  })
  @IsOptional()
  @IsArray({ message: 'Контейнеры с координатами должны быть массивом' })
  @ValidateNested({ each: true })
  @Type(() => BinWithCoordinatesInput)
  @ArrayMinSize(0, { message: 'Массив контейнеров с координатами не может быть пустым' })
  binsWithCoordinates?: BinWithCoordinatesInput[];
}

