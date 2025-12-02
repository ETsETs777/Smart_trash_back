import { registerEnumType } from '@nestjs/graphql';

export enum WastePhotoStatus {
  PENDING = 'PENDING',
  CLASSIFIED = 'CLASSIFIED',
  FAILED = 'FAILED',
}

registerEnumType(WastePhotoStatus, {
  name: 'WastePhotoStatus',
  description: 'Статус обработки фотографии мусора',
});


