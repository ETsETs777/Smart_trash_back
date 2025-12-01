import { Field, Int, ObjectType } from '@nestjs/graphql';
import { AfterLoad, Column, Entity } from 'typeorm';
import { FileEntity } from './file.entity';
import { ImageEndpoints } from 'src/modules/files/endpoints/image.endpoints';

/**
 * Entity for storing images.
 */
@Entity()
@ObjectType()
export class ImageEntity extends FileEntity {
  /**
   * Image width in pixels after resizing.
   */
  @Field(() => Int, {
    nullable: true,
    description: 'Image width in pixels after resizing',
  })
  @Column('integer', { nullable: true })
  width?: number;

  /**
   * Image height in pixels after resizing.
   */
  @Field(() => Int, {
    nullable: true,
    description: 'Image height in pixels after resizing',
  })
  @Column('integer', { nullable: true })
  height?: number;

  /**
   * URL to view this image, starts with "/".
   */
  @Field(() => String)
  url?: string;

  /**
   * URL to download this image, starts with "/".
   */
  @Field(() => String)
  downloadUrl?: string;

  /**
   * URL to view AVATAR of this image, starts with "/".
   */
  @Field(() => String)
  avatarUrl?: string;

  /**
   * Is image visible to users.
   */
  @Field(() => Boolean, {
    nullable: true,
    description: 'Is image visible to users',
  })
  @Column({ type: 'boolean', nullable: false, default: true })
  isVisible: boolean;

  /**
   * Check sum of file content.
   */
  @Field(() => String, {
    description: 'Check sum of file content',
    nullable: true,
  })
  @Column('text', { nullable: true })
  checksum?: string;

  /**
   * Auto-generation after entity select.
   */
  @AfterLoad()
  generateUrl() {
    this.url = ImageEndpoints.imageView(this.id);
    this.downloadUrl = ImageEndpoints.imageDownload(this.id);
    this.avatarUrl = ImageEndpoints.avatarGet(this.id);
  }
}
