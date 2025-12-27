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
import { TeamCompetitionParticipantEntity } from './team-competition-participant.entity';

@ObjectType({ description: 'Командное соревнование между отделами компании' })
@Entity('team_competitions')
export class TeamCompetitionEntity {
  @Field(() => ID, { description: 'Идентификатор соревнования' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field({ description: 'Название соревнования' })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Field({ description: 'Описание соревнования' })
  @Column({ type: 'text' })
  description: string;

  @Field(() => Date, {
    description: 'Дата начала соревнования',
  })
  @Column({ type: 'timestamptz' })
  startDate: Date;

  @Field(() => Date, {
    description: 'Дата окончания соревнования',
  })
  @Column({ type: 'timestamptz' })
  endDate: Date;

  @Field({ description: 'Активно ли соревнование' })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Field(() => Int, {
    description: 'Максимальное количество команд',
    nullable: true,
  })
  @Column({ type: 'int', nullable: true })
  maxTeams?: number | null;

  @Field(() => CompanyEntity, {
    description: 'Компания, в которой проводится соревнование',
  })
  @ManyToOne(() => CompanyEntity, {
    onDelete: 'CASCADE',
    nullable: false,
    eager: false,
  })
  company: CompanyEntity;

  @Field(() => UserEntity, {
    nullable: true,
    description: 'Администратор, создавший соревнование',
  })
  @ManyToOne(() => UserEntity, {
    onDelete: 'SET NULL',
    nullable: true,
    eager: false,
  })
  createdBy?: UserEntity | null;

  @Field(() => [TeamCompetitionParticipantEntity], {
    nullable: true,
    description: 'Участники соревнования (команды)',
  })
  @OneToMany(() => TeamCompetitionParticipantEntity, (participant) => participant.competition)
  participants?: TeamCompetitionParticipantEntity[];

  @Field(() => Date, { description: 'Дата создания соревнования' })
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Field(() => Date, { description: 'Дата последнего обновления соревнования' })
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

