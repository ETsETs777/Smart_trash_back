import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TeamCompetitionEntity } from './team-competition.entity';
import { UserEntity } from './user.entity';

@ObjectType({ description: 'Участник командного соревнования (команда/отдел)' })
@Entity('team_competition_participants')
export class TeamCompetitionParticipantEntity {
  @Field(() => ID, { description: 'Идентификатор участника' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field({ description: 'Название команды/отдела' })
  @Column({ type: 'varchar', length: 255 })
  teamName: string;

  @Field(() => TeamCompetitionEntity, {
    description: 'Соревнование, в котором участвует команда',
  })
  @ManyToOne(() => TeamCompetitionEntity, (competition) => competition.participants, {
    onDelete: 'CASCADE',
    nullable: false,
    eager: false,
  })
  competition: TeamCompetitionEntity;

  @Field(() => [UserEntity], {
    description: 'Участники команды (сотрудники)',
  })
  @ManyToMany(() => UserEntity)
  @JoinTable({
    name: 'team_competition_members',
    joinColumn: { name: 'participantId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
  })
  members: UserEntity[];

  @Field(() => Int, {
    description: 'Общее количество очков команды',
    defaultValue: 0,
  })
  @Column({ type: 'int', default: 0 })
  totalPoints: number;

  @Field(() => Int, {
    description: 'Место команды в рейтинге',
    nullable: true,
  })
  @Column({ type: 'int', nullable: true })
  rank?: number | null;

  @Field(() => Date, { description: 'Дата создания записи' })
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Field(() => Date, { description: 'Дата последнего обновления' })
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}

