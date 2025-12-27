import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CompanyEntity } from './company.entity';
import { UserEntity } from './user.entity';
import { AchievementEntity } from './achievement.entity';

@ObjectType({ description: 'Сезонное событие с специальными ачивками' })
@Entity('seasonal_events')
export class SeasonalEventEntity {
  @Field(() => ID, { description: 'Идентификатор события' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field({ description: 'Название события' })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Field({ description: 'Описание события' })
  @Column({ type: 'text' })
  description: string;

  @Field(() => Date, {
    description: 'Дата начала события',
  })
  @Column({ type: 'timestamptz' })
  startDate: Date;

  @Field(() => Date, {
    description: 'Дата окончания события',
  })
  @Column({ type: 'timestamptz' })
  endDate: Date;

  @Field({ description: 'Активно ли событие' })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Field(() => Int, {
    description: 'Множитель очков во время события',
    defaultValue: 1,
  })
  @Column({ type: 'int', default: 1 })
  pointsMultiplier: number;

  @Field(() => Int, {
    description: 'Множитель опыта во время события',
    defaultValue: 1,
  })
  @Column({ type: 'int', default: 1 })
  experienceMultiplier: number;

  @Field(() => CompanyEntity, {
    nullable: true,
    description: 'Компания, для которой создано событие (null = глобальное)',
  })
  @ManyToOne(() => CompanyEntity, {
    onDelete: 'CASCADE',
    nullable: true,
    eager: false,
  })
  company?: CompanyEntity | null;

  @Field(() => UserEntity, {
    nullable: true,
    description: 'Администратор, создавший событие',
  })
  @ManyToOne(() => UserEntity, {
    onDelete: 'SET NULL',
    nullable: true,
    eager: false,
  })
  createdBy?: UserEntity | null;

  @Field(() => [AchievementEntity], {
    nullable: true,
    description: 'Специальные ачивки для этого события',
  })
  @OneToMany(() => AchievementEntity, (achievement) => achievement.seasonalEvent)
  specialAchievements?: AchievementEntity[];

  @Field(() => Date, { description: 'Дата создания события' })
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Field(() => Date, { description: 'Дата последнего обновления события' })
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @BeforeInsert()
  trimFields(): void {
    if (this.title) {
      this.title = this.title.trim();
    }
    if (this.description) {
      this.description = this.description.trim();
    }
  }
}

