import { Field, ID, ObjectType } from '@nestjs/graphql';
import { CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { EmployeeEntity } from './employee.entity';
import { AchievementEntity } from './achievement.entity';

@ObjectType({ description: 'Факт получения ачивки конкретным сотрудником' })
@Entity('employee_achievements')
export class EmployeeAchievementEntity {
  @Field(() => ID, { description: 'Идентификатор выдачи ачивки сотруднику' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => EmployeeEntity, {
    description: 'Сотрудник, получивший ачивку',
  })
  @ManyToOne(() => EmployeeEntity, (employee) => employee.achievements, {
    onDelete: 'CASCADE',
    nullable: false,
    eager: false,
  })
  employee: EmployeeEntity;

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


