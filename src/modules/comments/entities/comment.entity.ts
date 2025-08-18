import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { BuyerRequest } from '@/modules/buyer-requests/entities/buyer-request.entity';
import { User } from '@/modules/users/entities/user.entity';

@Entity('comments')
export class Comment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    requestId: string;

    @Column({ type: 'uuid' })
    userId: string;

    @Column({ type: 'text' })
    text: string;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @ManyToOne(() => BuyerRequest, (buyerRequest) => buyerRequest.comments, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'requestId' })
    buyerRequest: BuyerRequest;

    @ManyToOne(() => User, (user) => user.comments, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;
}
