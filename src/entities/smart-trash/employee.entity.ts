import { Field, ID, ObjectType } from '@nestjs/graphql';
import { BeforeInsert, BeforeUpdate, Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CompanyEntity } from './company.entity';
import { WastePhotoEntity } from './waste-photo.entity';
import { EmployeeAchievementEntity } from './employee-achievement.entity';

@ObjectType({ description: 'Сотрудник компании, делающий фотографии мусора' })
@Entity('employees')
export class EmployeeEntity {
  @Field(() => ID, { description: 'Идентификатор сотрудника' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field({ description: 'Имя сотрудника' })
  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Field({ description: 'Фамилия сотрудника' })
  @Column({ type: 'varchar', length: 100 })
  lastName: string;

  @Field({ description: 'Полное имя сотрудника, формируется автоматически' })
  @Column({ type: 'varchar', length: 255 })
  fullName: string;

  @Field({ description: 'Флаг, подтверждён ли сотрудник администратором компании' })
  @Column({ type: 'boolean', default: false })
  isConfirmed: boolean;

  @Field({ description: 'Флаг, зарегистрирован ли сотрудник в системе' })
  @Column({ type: 'boolean', default: false })
  isRegistered: boolean;

  @Field(() => String, { nullable: true, description: 'Электронная почта сотрудника при наличии регистрации' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string | null;

  @Field(() => String, {
    nullable: true,
    description: 'Хэш пароля сотрудника (только для зарегистрированных)',
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  passwordHash?: string | null;

  @Field(() => String, {
    nullable: true,
    description: 'JWT токен сотрудника для авторизации (только для зарегистрированных)',
  })
  @Column({ type: 'text', nullable: true })
  jwtToken?: string | null;

  @Field(() => CompanyEntity, {
    description: 'Компания, в которой работает сотрудник',
  })
  @ManyToOne(() => CompanyEntity, (company) => company.employees, {
    onDelete: 'CASCADE',
    nullable: false,
    eager: false,
  })
  company: CompanyEntity;

  @Field(() => [WastePhotoEntity], {
    nullable: true,
    description: 'Фотографии мусора, сделанные сотрудником',
  })
  @OneToMany(() => WastePhotoEntity, (photo) => photo.employee)
  wastePhotos?: WastePhotoEntity[];

  @Field(() => [EmployeeAchievementEntity], {
    nullable: true,
    description: 'Ачивки, полученные сотрудником',
  })
  @OneToMany(() => EmployeeAchievementEntity, (ea) => ea.employee)
  achievements?: EmployeeAchievementEntity[];

  @Field(() => Date, { description: 'Дата и время создания записи о сотруднике' })
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Field(() => Date, { description: 'Дата и время последнего обновления записи о сотруднике' })
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @BeforeInsert()
  async buildFullNameAndHashPassword(): Promise<void> {
    const first = this.firstName ? this.firstName.trim() : '';
    const last = this.lastName ? this.lastName.trim() : '';
    this.fullName = `${first} ${last}`.trim();
    if (this.email) {
      this.email = this.email.trim().toLowerCase();
    }
    if (this.passwordHash && this.isRegistered) {
      const saltRounds = 10;
      this.passwordHash = await bcrypt.hash(this.passwordHash, saltRounds);
    }
  }

  @BeforeUpdate()
  async hashPasswordOnUpdate(): Promise<void> {
    if (this.passwordHash && !this.passwordHash.startsWith('$2b$')) {
      const saltRounds = 10;
      this.passwordHash = await bcrypt.hash(this.passwordHash, saltRounds);
    }
  }
}


