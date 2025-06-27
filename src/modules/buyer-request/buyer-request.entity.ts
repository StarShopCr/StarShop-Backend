import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  Validate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { User } from '../users/entities/user.entity';
import { BuyerRequestStatus } from './enums/buyer-request-status.enum';
import { BudgetRangeValidator } from './validators/budget-range.validator';
import { Category } from '../category/category.entity';

@Entity('buyer_requests')
export class BuyerRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { eager: true })
  @Index()
  @IsNotEmpty()
  buyer: User;

  // @ManyToOne(() => Category, { eager: true })
  // @Index()
  // @IsNotEmpty()
  // category: Category;

  @Column({ type: 'varchar', length: 100 })
  @IsString()
  @MaxLength(100)
  @IsNotEmpty()
  title: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Column('numeric', { precision: 10, scale: 2 })
  @Type(() => Number)
  @Min(0)
  @IsNotEmpty()
  budgetMin: number;

  @Column('numeric', { precision: 10, scale: 2 })
  @Type(() => Number)
  @Min(0)
  @IsNotEmpty()
  budgetMax: number;

  @Column({
    type: 'enum',
    enum: BuyerRequestStatus,
    default: BuyerRequestStatus.OPEN,
  })
  @IsEnum(BuyerRequestStatus)
  status: BuyerRequestStatus;

  @Column({ type: 'timestamp' })
  @IsNotEmpty()
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Validate(BudgetRangeValidator)
  private readonly _validateBudgetRange: any;
}