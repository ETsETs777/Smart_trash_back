import { registerEnumType } from '@nestjs/graphql';

export enum TrashBinType {
  MIXED = 'MIXED',
  PLASTIC = 'PLASTIC',
  PAPER = 'PAPER',
  GLASS = 'GLASS',
  METAL = 'METAL',
  ORGANIC = 'ORGANIC',
  ELECTRONIC = 'ELECTRONIC',
  HAZARDOUS = 'HAZARDOUS',
}

registerEnumType(TrashBinType, {
  name: 'TrashBinType',
  description: 'Тип контейнера для раздельного сбора отходов',
});


