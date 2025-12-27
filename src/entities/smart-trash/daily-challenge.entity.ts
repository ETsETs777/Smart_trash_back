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
import { AchievementCriterionType } from './achievement-criterion.enum';
import { DailyChallengeProgressEntity } from './daily-challenge-progress.entity';

@ObjectType({ description: 'Ежедневное задание для сотрудников компании' })
@Entity('daily_challenges')
export class DailyChallengeEntity {
  @Field(() => ID, { description: 'Идентификатор ежедневного задания' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field({ description: 'Название задания' })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Field({ description: 'Описание задания' })
  @Column({ type: 'text' })
  description: string;

  @Field(() => AchievementCriterionType, {
    description: 'Тип критерия для задания',
  })
  @Column({ type: 'enum', enum: AchievementCriterionType })
  criterionType: AchievementCriterionType;

  @Field(() => Int, {
    description: 'Целевое значение для выполнения задания',
  })
  @Column({ type: 'int' })
  target: number;

  @Field(() => Int, {
    description: 'Награда в очках за выполнение задания',
  })
  @Column({ type: 'int', default: 100 })
  rewardPoints: number;

  @Field(() => Int, {
    description: 'Награда в опыте за выполнение задания',
  })
  @Column({ type: 'int', default: 50 })
  rewardExperience: number;

  @Field(() => Date, {
    description: 'Дата начала действия задания',
  })
  @Column({ type: 'date' })
  startDate: Date;

  @Field(() => Date, {
    description: 'Дата окончания действия задания',
  })
  @Column({ type: 'date' })
  endDate: Date;

  @Field({ description: 'Активно ли задание' })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Field(() => CompanyEntity, {
    description: 'Компания, для которой создано задание',
  })
  @ManyToOne(() => CompanyEntity, {
    onDelete: 'CASCADE',
    nullable: false,
    eager: false,
  })
  company: CompanyEntity;

  @Field(() => UserEntity, {
    nullable: true,
    description: 'Администратор, создавший задание',
  })
  @ManyToOne(() => UserEntity, {
    onDelete: 'SET NULL',
    nullable: true,
    eager: false,
  })
  createdBy?: UserEntity | null;

  @Field(() => [DailyChallengeProgressEntity], {
    nullable: true,
    description: 'Прогресс сотрудников по этому заданию',
  })
  @OneToMany(() => DailyChallengeProgressEntity, (progress) => progress.challenge)
  progress?: DailyChallengeProgressEntity[];

  @Field(() => Date, { description: 'Дата создания задания' })
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Field(() => Date, { description: 'Дата последнего обновления задания' })
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

