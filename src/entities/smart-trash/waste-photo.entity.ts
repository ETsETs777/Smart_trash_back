import { Field, ID, ObjectType } from '@nestjs/graphql';
import { BeforeInsert, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { CompanyEntity } from './company.entity';
import { UserEntity } from './user.entity';
import { CollectionAreaEntity } from './collection-area.entity';
import { TrashBinType } from './trash-bin-type.enum';
import { WastePhotoStatus } from './waste-photo-status.enum';
import { ImageEntity } from '../files/image.entity';

@ObjectType({ description: 'Фотография мусора, отправленная на классификацию' })
@Entity('waste_photos')
export class WastePhotoEntity {
  @Field(() => ID, { description: 'Идентификатор фотографии мусора' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => CompanyEntity, {
    description: 'Компания, от имени которой была сделана фотография',
  })
  @ManyToOne(() => CompanyEntity, (company) => company.wastePhotos, {
    onDelete: 'CASCADE',
    nullable: false,
    eager: false,
  })
  company: CompanyEntity;

  @Field(() => UserEntity, {
    nullable: true,
    description: 'Пользователь (сотрудник), сделавший фотографию',
  })
  @ManyToOne(() => UserEntity, (user) => user.wastePhotos, {
    onDelete: 'SET NULL',
    nullable: true,
    eager: false,
  })
  user?: UserEntity | null;

  @Field(() => CollectionAreaEntity, {
    nullable: true,
    description: 'Область сбора, где сделана фотография',
  })
  @ManyToOne(() => CollectionAreaEntity, (area) => area.wastePhotos, {
    onDelete: 'SET NULL',
    nullable: true,
    eager: false,
  })
  collectionArea?: CollectionAreaEntity | null;

  @Field(() => ImageEntity, {
    description: 'Сущность изображения, связанного с фотографией мусора',
  })
  @ManyToOne(() => ImageEntity, {
    onDelete: 'CASCADE',
    nullable: false,
    eager: true,
  })
  image: ImageEntity;

  @Field(() => WastePhotoStatus, {
    description: 'Текущий статус обработки фотографии',
  })
  @Column({ type: 'enum', enum: WastePhotoStatus, default: WastePhotoStatus.PENDING })
  status: WastePhotoStatus;

  @Field(() => TrashBinType, {
    nullable: true,
    description: 'Рекомендованный тип контейнера для выброса мусора',
  })
  @Column({ type: 'enum', enum: TrashBinType, nullable: true })
  recommendedBinType?: TrashBinType | null;

  @Field(() => String, { nullable: true, description: 'Текстовое объяснение рекомендации от нейросети' })
  @Column({ type: 'text', nullable: true })
  aiExplanation?: string | null;

  @Field(() => String, { nullable: true, description: 'Сырые данные от нейросети GigaChat' })
  @Column({ type: 'jsonb', nullable: true })
  aiRawResult?: unknown | null;

  @Field(() => Date, { description: 'Дата и время создания записи о фотографии' })
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Field(() => Date, { description: 'Дата и время последнего обновления записи о фотографии' })
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @BeforeInsert()
  ensureInitialStatus(): void {
    if (!this.status) {
      this.status = WastePhotoStatus.PENDING;
    }
  }
}


