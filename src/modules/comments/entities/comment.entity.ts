import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { BuyerRequest } from '@/modules/buyer-requests/entities/buyer-request.entity';
import { User } from '@/modules/users/entities/user.entity';

@Entity('comments')
export class Comment {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    buyerRequestId: number;

    @Column()
    userId: number;

    @Column({ type: 'text' })
    text: string;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @ManyToOne(() => BuyerRequest, (buyerRequest) => buyerRequest.comments, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'buyerRequestId' })
    buyerRequest: BuyerRequest;

    @ManyToOne(() => User, (user) => user.comments, { onDelete: 'CASCADE', eager: true })
    @JoinColumn({ name: 'userId' })
    user: User;
}
