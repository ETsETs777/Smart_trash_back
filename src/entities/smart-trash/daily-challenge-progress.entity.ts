import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { DailyChallengeEntity } from './daily-challenge.entity';
import { UserEntity } from './user.entity';

@ObjectType({ description: 'Прогресс сотрудника по ежедневному заданию' })
@Entity('daily_challenge_progress')
@Unique(['user', 'challenge'])
export class DailyChallengeProgressEntity {
  @Field(() => ID, { description: 'Идентификатор прогресса' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => UserEntity, {
    description: 'Пользователь (сотрудник)',
  })
  @ManyToOne(() => UserEntity, {
    onDelete: 'CASCADE',
    nullable: false,
    eager: false,
  })
  user: UserEntity;

  @Field(() => DailyChallengeEntity, {
    description: 'Ежедневное задание',
  })
  @ManyToOne(() => DailyChallengeEntity, (challenge) => challenge.progress, {
    onDelete: 'CASCADE',
    nullable: false,
    eager: false,
  })
  challenge: DailyChallengeEntity;

  @Field(() => Int, {
    description: 'Текущий прогресс по заданию',
    defaultValue: 0,
  })
  @Column({ type: 'int', default: 0 })
  currentProgress: number;

  @Field({ description: 'Выполнено ли задание' })
  @Column({ type: 'boolean', default: false })
  isCompleted: boolean;

  @Field(() => Date, {
    nullable: true,
    description: 'Дата и время выполнения задания',
  })
  @Column({ type: 'timestamptz', nullable: true })
  completedAt?: Date | null;

  @Field(() => Date, { description: 'Дата создания записи' })
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Field(() => Date, { description: 'Дата последнего обновления' })
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}

