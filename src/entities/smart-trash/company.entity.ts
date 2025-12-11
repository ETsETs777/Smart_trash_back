import { Field, ID, ObjectType } from '@nestjs/graphql';
import { BeforeInsert, Column, CreateDateColumn, Entity, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { UserEntity } from './user.entity';
import { CollectionAreaEntity } from './collection-area.entity';
import { WastePhotoEntity } from './waste-photo.entity';
import { AchievementEntity } from './achievement.entity';
import { ImageEntity } from 'src/entities/files/image.entity';

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

  @Field(() => UserEntity, {
    nullable: true,
    description: 'Администратор, создавший компанию',
  })
  @ManyToOne(() => UserEntity, (user) => user.createdCompanies, {
    onDelete: 'SET NULL',
    nullable: true,
    eager: false,
  })
  createdBy?: UserEntity | null;

  @Field(() => [UserEntity], {
    nullable: true,
    description: 'Сотрудники, работающие в компании',
  })
  @ManyToMany(() => UserEntity, (user) => user.employeeCompanies, {
    eager: false,
  })
  employees?: UserEntity[];

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

  @Field(() => ImageEntity, {
    nullable: true,
    description: 'Логотип компании',
  })
  @ManyToOne(() => ImageEntity, {
    onDelete: 'SET NULL',
    nullable: true,
    eager: false,
  })
  logo?: ImageEntity | null;

  @Field(() => String, {
    nullable: true,
    description: 'QR код компании (обычно равен ID, но может быть кастомным)',
  })
  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  qrCode?: string | null;

  @BeforeInsert()
  normalizeName(): void {
    if (this.name) {
      this.name = this.name.trim();
    }
    // Если qrCode не задан, используем ID (будет установлен после сохранения)
    if (!this.qrCode) {
      // Установим после сохранения в сервисе
    }
  }
}


