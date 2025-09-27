import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum FileType {
  IMAGE = 'IMAGE',
  DOCUMENT = 'DOCUMENT',
  OTHER = 'OTHER',
}

@Entity('files')
export class File {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  url: string;

  @Column({
    type: 'enum',
    enum: FileType,
    default: FileType.OTHER,
  })
  type: FileType;

  @Column({ nullable: true })
  filename: string;

  @Column({ nullable: true })
  mimetype: string;

  @Column({ nullable: true })
  size: number;

  @Column({ nullable: true })
  providerType: 'cloudinary' | 's3';

  @Column({ nullable: true })
  providerPublicId: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'uploaded_by' })
  uploadedBy: User;

  @Column({ name: 'uploaded_by' })
  uploadedById: string;

  @CreateDateColumn({ name: 'uploaded_at' })
  uploadedAt: Date;
}
