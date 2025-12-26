import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm'

@Entity('login_attempts')
@Index(['email', 'attemptedAt'])
@Index(['ipAddress', 'attemptedAt'])
export class LoginAttemptEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 255 })
  email: string

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress?: string

  @Column({ type: 'text', nullable: true })
  userAgent?: string

  @Column({ type: 'boolean' })
  success: boolean

  @Column({ type: 'varchar', length: 255, nullable: true })
  failureReason?: string

  @Column({ type: 'uuid', nullable: true })
  userId?: string

  @CreateDateColumn({ type: 'timestamp' })
  attemptedAt: Date
}

