import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { BeforeInsert, Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { CompanyEntity } from './company.entity';
import { AchievementCriterionType } from './achievement-criterion.enum';
import { UserEntity } from './user.entity';
import { EmployeeAchievementEntity } from './employee-achievement.entity';

@ObjectType({ description: 'Ачивка, которую может получить сотрудник' })
@Entity('achievements')
export class AchievementEntity {
  @Field(() => ID, { description: 'Идентификатор ачивки' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field({ description: 'Название ачивки' })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Field({ description: 'Описание условия получения ачивки' })
  @Column({ type: 'text' })
  description: string;

  @Field(() => AchievementCriterionType, {
    description: 'Тип критерия, по которому вычисляется ачивка',
  })
  @Column({ type: 'enum', enum: AchievementCriterionType })
  criterionType: AchievementCriterionType;

  @Field(() => Int, {
    description: 'Пороговое значение критерия, после которого ачивка выдаётся',
  })
  @Column({ type: 'int' })
  threshold: number;

  @Field(() => CompanyEntity, {
    description: 'Компания, для которой действует ачивка',
  })
  @ManyToOne(() => CompanyEntity, (company) => company.achievements, {
    onDelete: 'CASCADE',
    nullable: false,
    eager: false,
  })
  company: CompanyEntity;

  @Field(() => UserEntity, {
    nullable: true,
    description: 'Администратор компании, создавший ачивку',
  })
  @ManyToOne(() => UserEntity, (user) => user.createdAchievements, {
    onDelete: 'SET NULL',
    nullable: true,
    eager: false,
  })
  createdBy?: UserEntity | null;

  @Field(() => [EmployeeAchievementEntity], {
    nullable: true,
    description: 'Выдачи данной ачивки конкретным сотрудникам',
  })
  @OneToMany(() => EmployeeAchievementEntity, (ea) => ea.achievement)
  employeeAchievements?: EmployeeAchievementEntity[];

  @Field(() => Date, { description: 'Дата и время создания ачивки' })
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Field(() => Date, { description: 'Дата и время последнего обновления ачивки' })
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


