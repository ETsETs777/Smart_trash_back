import { Field, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CompanyEntity } from './company.entity';
import { AchievementEntity } from './achievement.entity';
import { WastePhotoEntity } from './waste-photo.entity';
import { EmployeeAchievementEntity } from './employee-achievement.entity';
import { ImageEntity } from 'src/entities/files/image.entity';

export enum UserRole {
  ADMIN_COMPANY = 'ADMIN_COMPANY',
  EMPLOYEE = 'EMPLOYEE',
}

registerEnumType(UserRole, {
  name: 'UserRole',
  description: 'Роль пользователя в системе',
});

@ObjectType({
  description:
    'Пользователь системы умных урн (администратор компании или сотрудник)',
})
@Entity('users')
export class UserEntity {
  @Field(() => ID, { description: 'Идентификатор пользователя' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field({ description: 'Адрес электронной почты пользователя' })
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash: string;

  @Field({ description: 'Фамилия, имя и отчество пользователя' })
  @Column({ type: 'varchar', length: 255 })
  fullName: string;

  @Field(() => UserRole, { description: 'Роль пользователя в системе' })
  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @Field({ description: 'Флаг активности пользователя' })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Field({ description: 'Флаг подтверждения адреса электронной почты' })
  @Column({ type: 'boolean', default: false })
  isEmailConfirmed: boolean;

  @Column({ type: 'text', nullable: true })
  emailConfirmationToken?: string | null;

  @Field({ description: 'Флаг подтверждения участия сотрудника в компании' })
  @Column({ type: 'boolean', default: false })
  isEmployeeConfirmed: boolean;

  @Field(() => String, {
    nullable: true,
    description: 'Текущий JWT access токен пользователя для авторизации',
  })
  @Column({ type: 'text', nullable: true })
  jwtToken?: string | null;

  @Column({ type: 'text', nullable: true })
  refreshToken?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  refreshTokenExpiresAt?: Date | null;

  @Field(() => [CompanyEntity], {
    nullable: true,
    description: 'Компании, в которых пользователь участвует как сотрудник',
  })
  @ManyToMany(() => CompanyEntity, (company) => company.employees, {
    eager: false,
  })
  @JoinTable({
    name: 'user_employee_companies',
    joinColumn: { name: 'userId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'companyId', referencedColumnName: 'id' },
  })
  employeeCompanies?: CompanyEntity[];

  @Field(() => [CompanyEntity], {
    nullable: true,
    description: 'Компании, которые пользователь создал как администратор',
  })
  @OneToMany(() => CompanyEntity, (company) => company.createdBy, {
    eager: false,
  })
  createdCompanies?: CompanyEntity[];

  @Field(() => [AchievementEntity], {
    nullable: true,
    description: 'Ачивки, созданные пользователем как администратором компании',
  })
  @OneToMany(() => AchievementEntity, (achievement) => achievement.createdBy)
  createdAchievements?: AchievementEntity[];

  @Field(() => [WastePhotoEntity], {
    nullable: true,
    description: 'Фотографии мусора, сделанные пользователем как сотрудником',
  })
  @OneToMany(() => WastePhotoEntity, (photo) => photo.user)
  wastePhotos?: WastePhotoEntity[];

  @Field(() => [EmployeeAchievementEntity], {
    nullable: true,
    description: 'Ачивки, полученные пользователем как сотрудником',
  })
  @OneToMany(() => EmployeeAchievementEntity, (ea) => ea.user)
  achievements?: EmployeeAchievementEntity[];

  @Field(() => ImageEntity, {
    nullable: true,
    description: 'Логотип/аватар пользователя',
  })
  @ManyToOne(() => ImageEntity, {
    onDelete: 'SET NULL',
    nullable: true,
    eager: false,
  })
  logo?: ImageEntity | null;

  @Field(() => Date, { description: 'Дата и время создания пользователя' })
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Field(() => Date, {
    description: 'Дата и время последнего обновления пользователя',
  })
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // Gamification fields
  @Field(() => Int, {
    description: 'Текущий уровень пользователя',
    defaultValue: 1,
  })
  @Column({ type: 'int', default: 1 })
  level: number;

  @Field(() => Int, {
    description: 'Очки опыта пользователя',
    defaultValue: 0,
  })
  @Column({ type: 'int', default: 0 })
  experience: number;

  @Field(() => Int, {
    description: 'Общее количество очков пользователя',
    defaultValue: 0,
  })
  @Column({ type: 'int', default: 0 })
  totalPoints: number;

  @Field(() => Int, {
    description: 'Текущая серия дней подряд (streak)',
    defaultValue: 0,
  })
  @Column({ type: 'int', default: 0 })
  currentStreak: number;

  @Field(() => Int, {
    description: 'Лучшая серия дней подряд',
    defaultValue: 0,
  })
  @Column({ type: 'int', default: 0 })
  bestStreak: number;

  @Field(() => Date, {
    nullable: true,
    description: 'Дата последней активности пользователя',
  })
  @Column({ type: 'timestamptz', nullable: true })
  lastActivityDate?: Date | null;

  @BeforeInsert()
  async normalizeAndHashPassword(): Promise<void> {
    if (this.email) {
      this.email = this.email.trim().toLowerCase();
    }
    if (this.fullName) {
      this.fullName = this.fullName.trim();
    }
    if (this.passwordHash) {
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

