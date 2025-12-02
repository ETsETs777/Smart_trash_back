import { Field, ID, ObjectType } from '@nestjs/graphql';
import { BeforeInsert, Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { CompanyEntity } from './company.entity';
import { CollectionAreaBinEntity } from './collection-area-bin.entity';
import { WastePhotoEntity } from './waste-photo.entity';

@ObjectType({ description: 'Область сбора отходов с набором мусорных контейнеров' })
@Entity('collection_areas')
export class CollectionAreaEntity {
  @Field(() => ID, { description: 'Идентификатор области сбора' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field({ description: 'Название или обозначение области сбора' })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Field(() => String, { nullable: true, description: 'Описание или дополнительные детали области сбора' })
  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Field(() => CompanyEntity, {
    description: 'Компания, которой принадлежит область сбора',
  })
  @ManyToOne(() => CompanyEntity, (company) => company.collectionAreas, {
    onDelete: 'CASCADE',
    nullable: false,
    eager: false,
  })
  company: CompanyEntity;

  @Field(() => [CollectionAreaBinEntity], {
    nullable: true,
    description: 'Типы мусорных контейнеров, присутствующие в области',
  })
  @OneToMany(() => CollectionAreaBinEntity, (bin) => bin.area, {
    cascade: true,
  })
  bins?: CollectionAreaBinEntity[];

  @Field(() => [WastePhotoEntity], {
    nullable: true,
    description: 'Фотографии мусора, сделанные в этой области',
  })
  @OneToMany(() => WastePhotoEntity, (photo) => photo.collectionArea)
  wastePhotos?: WastePhotoEntity[];

  @Field(() => Date, { description: 'Дата и время создания области сбора' })
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Field(() => Date, { description: 'Дата и время последнего обновления области сбора' })
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @BeforeInsert()
  normalizeName(): void {
    if (this.name) {
      this.name = this.name.trim();
    }
  }
}


