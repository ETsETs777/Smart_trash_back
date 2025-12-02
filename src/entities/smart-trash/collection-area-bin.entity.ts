import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CollectionAreaEntity } from './collection-area.entity';
import { TrashBinType } from './trash-bin-type.enum';

@ObjectType({ description: 'Конкретный тип мусорного контейнера в области сбора' })
@Entity('collection_area_bins')
export class CollectionAreaBinEntity {
  @Field(() => ID, { description: 'Идентификатор записи о контейнере в области' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => TrashBinType, { description: 'Тип контейнера для мусора в области' })
  @Column({ type: 'enum', enum: TrashBinType })
  type: TrashBinType;

  @Field(() => CollectionAreaEntity, {
    description: 'Область сбора, к которой относится контейнер',
  })
  @ManyToOne(() => CollectionAreaEntity, (area) => area.bins, {
    onDelete: 'CASCADE',
    nullable: false,
    eager: false,
  })
  area: CollectionAreaEntity;
}


