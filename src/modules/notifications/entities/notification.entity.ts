import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  message: string;

  @Column({
    type: 'enum',
    enum: ['info', 'warning', 'error', 'offer', 'offer_accepted', 'offer_rejected'],
    default: 'info',
  })
  type: 'info' | 'warning' | 'error' | 'offer' | 'offer_accepted' | 'offer_rejected';

  // Nuevo campo para el payload JSON
  @Column({ type: 'jsonb', nullable: true })
  payload: Record<string, any>;

  // Nuevo campo para evitar duplicados
  @Column({ nullable: true })
  entityId: string; // offerId para nuestro caso

  @ManyToOne(() => User, (user) => user.notifications)
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}