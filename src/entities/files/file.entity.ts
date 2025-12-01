import { Field, ID, ObjectType } from '@nestjs/graphql';
import { FileEndpoints } from 'src/modules/files/endpoints/file.endpoints';
import {
  AfterLoad,
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Entity for storing files.
 */
@Entity()
@ObjectType()
export class FileEntity extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Original file name with extension.
   * "image.jpg", "document.pdf", etc.
   */
  @Field(() => String, {
    description:
      'Original file name with extension: "image.jpg", "document.pdf", etc',
  })
  @Column('text')
  name: string;

  /**
   * File description if needed.
   */
  @Field(() => String, {
    nullable: true,
    description: 'File description if needed',
  })
  @Column('text', { nullable: true })
  description?: string;

  /**
   * File extension with dot.
   * ".jpg", ".png", ".pdf", etc.
   */
  @Field(() => String, {
    description: 'File extension with dot: ".jpg", ".png", ".pdf", etc',
  })
  @Column('text')
  ext: string;

  /**
   * File URL to get this file from current backend.
   * Starts with "/".
   */
  @Field(() => String)
  url?: string;

  // Auto-generation after entity select.
  @AfterLoad()
  generateUrl() {
    // url for download file from current backend.
    this.url = FileEndpoints.getS3ObjectKey(this);
  }

  @Field(() => String)
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: string;

  @Field(() => Date)
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt?: Date;
}
