import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './User';

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn()
  id: number; // Unique identifier for the session

  @ManyToOne(() => User)
  user: User; // Reference to the user associated with the session

  @Column({ unique: true })
  token: string; // Unique token for the session

  @Column()
  expiresAt: Date; // Expiration date of the session

  @CreateDateColumn()
  createdAt: Date; // Timestamp when the session was created

  @UpdateDateColumn()
  updatedAt: Date; // Timestamp when the session was last updated
}
