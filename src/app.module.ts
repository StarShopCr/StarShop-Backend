import './config/crypto-global';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { SharedModule } from './modules/shared/shared.module';
import { CouponModule } from './modules/coupons/coupon.module';
import { ProductsModule } from './modules/products/products.module';
import { ProductTypesModule } from './modules/productTypes/productTypes.module';
import { ProductVariantsModule } from './modules/productVariants/productVariants.module';
import { AttributeModule } from './modules/attributes/attributes.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OrdersModule } from './modules/orders/orders.module';
import { BuyerRequestsModule } from './modules/buyer-requests/buyer-requests.module';
import { OffersModule } from './modules/offers/offers.module';
import { EscrowModule } from './modules/escrow/escrow.module';
import { SupabaseModule } from './modules/supabase/supabase.module';

// Entities
import { User } from './modules/users/entities/user.entity';
import { Order } from './modules/orders/entities/order.entity';
import { OrderItem } from './modules/orders/entities/order-item.entity';
import { UserRole } from './modules/auth/entities/user-role.entity';
import { Role } from './modules/auth/entities/role.entity';
import { Notification } from './modules/notifications/entities/notification.entity';
import { Wishlist } from './modules/wishlist/entities/wishlist.entity';
import { Product } from './modules/products/entities/product.entity';
import { ProductType } from './modules/productTypes/entities/productTypes.entity';
import { ProductVariant } from './modules/productVariants/entities/productVariants.entity';
import { Attribute } from './modules/attributes/entities/attribute.entity';
import { AttributeValue } from './modules/attributes/entities/attribute-value.entity';
import { Coupon } from './modules/coupons/entities/coupon.entity';
import { CouponUsage } from './modules/coupons/entities/coupon-usage.entity';
import { BuyerRequest } from './modules/buyer-requests/entities/buyer-request.entity';
import { Offer } from './modules/offers/entities/offer.entity';
import { OfferAttachment } from './modules/offers/entities/offer-attachment.entity';
import { EscrowAccount } from './modules/escrow/entities/escrow-account.entity';
import { Milestone } from './modules/escrow/entities/milestone.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
      entities: [
        User,
        Order,
        OrderItem,
        UserRole,
        Role,
        Notification,
        Wishlist,
        Product,
        ProductType,
        ProductVariant,
        Attribute,
        AttributeValue,
        Coupon,
        CouponUsage,
        BuyerRequest,
        Offer,
        OfferAttachment,
        EscrowAccount,
        Milestone,
      ],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
    }),
    SharedModule,
    AuthModule,
    UsersModule,
    CouponModule,
    WishlistModule,
    ProductsModule,
    ProductTypesModule,
    ProductVariantsModule,
    AttributeModule,
    NotificationsModule,
    OrdersModule,
    BuyerRequestsModule,
    OffersModule,
    EscrowModule,
    SupabaseModule,
  ],
})
export class AppModule {}
