import { Field, ID, ObjectType } from '@nestjs/graphql';
import { CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from './user.entity';
import { AchievementEntity } from './achievement.entity';

@ObjectType({ description: 'Факт получения ачивки конкретным сотрудником' })
@Entity('employee_achievements')
export class EmployeeAchievementEntity {
  @Field(() => ID, { description: 'Идентификатор выдачи ачивки сотруднику' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => UserEntity, {
    description: 'Пользователь (сотрудник), получивший ачивку',
  })
  @ManyToOne(() => UserEntity, (user) => user.achievements, {
    onDelete: 'CASCADE',
    nullable: false,
    eager: false,
  })
  user: UserEntity;

  @Field(() => AchievementEntity, {
    description: 'Ачивка, которая была получена сотрудником',
  })
  @ManyToOne(() => AchievementEntity, (achievement) => achievement.employeeAchievements, {
    onDelete: 'CASCADE',
    nullable: false,
    eager: false,
  })
  achievement: AchievementEntity;

  @Field(() => Date, {
    description: 'Дата и время получения ачивки сотрудником',
  })
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}


