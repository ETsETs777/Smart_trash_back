import { Field, ID, ObjectType } from '@nestjs/graphql';
import { BeforeInsert, Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { CompanyAdminEntity } from './company-admin.entity';
import { EmployeeEntity } from './employee.entity';
import { CollectionAreaEntity } from './collection-area.entity';
import { WastePhotoEntity } from './waste-photo.entity';
import { AchievementEntity } from './achievement.entity';

@ObjectType({ description: 'Компания, подключённая к системе умных урн' })
@Entity('companies')
export class CompanyEntity {
  @Field(() => ID, { description: 'Идентификатор компании' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field({ description: 'Название компании' })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Field(() => String, { nullable: true, description: 'Краткое описание или备注 компании' })
  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Field({ description: 'Флаг активности компании' })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Field(() => Date, { description: 'Дата и время создания записи о компании' })
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Field(() => Date, { description: 'Дата и время последнего обновления записи о компании' })
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @Field(() => [CompanyAdminEntity], {
    nullable: true,
    description: 'Список администраторов, управляющих данной компанией',
  })
  @OneToMany(() => CompanyAdminEntity, (admin) => admin.company)
  admins?: CompanyAdminEntity[];

  @Field(() => [EmployeeEntity], {
    nullable: true,
    description: 'Список сотрудников, привязанных к компании',
  })
  @OneToMany(() => EmployeeEntity, (employee) => employee.company)
  employees?: EmployeeEntity[];

  @Field(() => [CollectionAreaEntity], {
    nullable: true,
    description: 'Области сбора отходов, настроенные в компании',
  })
  @OneToMany(() => CollectionAreaEntity, (area) => area.company)
  collectionAreas?: CollectionAreaEntity[];

  @Field(() => [WastePhotoEntity], {
    nullable: true,
    description: 'Фотографии отходов, сделанные в контексте компании',
  })
  @OneToMany(() => WastePhotoEntity, (photo) => photo.company)
  wastePhotos?: WastePhotoEntity[];

  @Field(() => [AchievementEntity], {
    nullable: true,
    description: 'Набор ачивок, настроенный администратором компании',
  })
  @OneToMany(() => AchievementEntity, (achievement) => achievement.company)
  achievements?: AchievementEntity[];

  @BeforeInsert()
  normalizeName(): void {
    if (this.name) {
      this.name = this.name.trim();
    }
  }
}


