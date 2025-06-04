import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wishlist } from './entities/wishlist.entity';
import { WishlistService } from './services/wishlist.service';
import { WishlistController } from './controller/wishlist.controller';
import { Product } from '../products/entities/product.entity';
import { SharedModule } from '../shared/shared.module';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Wishlist, Product,User]), SharedModule],
  controllers: [WishlistController],
  providers: [WishlistService],
})
export class WishlistModule {}
