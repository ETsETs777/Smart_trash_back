import { Field, ID, ObjectType } from '@nestjs/graphql';
import { BeforeInsert, Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CompanyEntity } from './company.entity';
import { AchievementEntity } from './achievement.entity';

@ObjectType({ description: 'Администратор компании, управляющий умной урной' })
@Entity('company_admins')
export class CompanyAdminEntity {
  @Field(() => ID, { description: 'Идентификатор администратора компании' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field({ description: 'Адрес электронной почты администратора' })
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Field({ description: 'Хэш пароля администратора компании' })
  @Column({ type: 'varchar', length: 255 })
  passwordHash: string;

  @Field({ description: 'Имя администратора компании' })
  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Field({ description: 'Фамилия администратора компании' })
  @Column({ type: 'varchar', length: 100 })
  lastName: string;

  @Field({ description: 'Флаг активности администратора' })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Field(() => String, {
    nullable: true,
    description: 'JWT токен администратора для авторизации',
  })
  @Column({ type: 'text', nullable: true })
  jwtToken?: string | null;

  @Field(() => CompanyEntity, {
    nullable: true,
    description: 'Компания, к которой привязан администратор',
  })
  @ManyToOne(() => CompanyEntity, (company) => company.admins, {
    onDelete: 'SET NULL',
    eager: false,
    nullable: true,
  })
  company?: CompanyEntity | null;

  @Field(() => [AchievementEntity], {
    nullable: true,
    description: 'Ачивки, созданные администратором для своей компании',
  })
  @OneToMany(() => AchievementEntity, (achievement) => achievement.createdBy)
  createdAchievements?: AchievementEntity[];

  @Field(() => Date, { description: 'Дата и время регистрации администратора' })
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Field(() => Date, {
    description: 'Дата и время последнего обновления профиля администратора',
  })
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @BeforeInsert()
  async normalizeAndHashPassword(): Promise<void> {
    if (this.email) {
      this.email = this.email.trim().toLowerCase();
    }
    if (this.firstName) {
      this.firstName = this.firstName.trim();
    }
    if (this.lastName) {
      this.lastName = this.lastName.trim();
    }
    if (this.passwordHash) {
      const saltRounds = 10;
      this.passwordHash = await bcrypt.hash(this.passwordHash, saltRounds);
    }
  }
}


