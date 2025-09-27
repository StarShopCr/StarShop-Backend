import { Controller, Get, Param, Req } from '@nestjs/common';
import { OrderService } from '../services/order.service';
import { OrderDto } from '../dto/order.dto';
import { AuthenticatedRequest } from '../../shared/types/auth-request.type';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  async getOrders(@Req() req: AuthenticatedRequest): Promise<OrderDto[]> {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return this.orderService.getOrdersByUser(userId.toString());
  }

  @Get(':id')
  async getOrderDetails(
    @Param('id') orderId: string,
    @Req() req: AuthenticatedRequest
  ): Promise<OrderDto> {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return this.orderService.getOrderDetails(userId.toString(), orderId);
  }
}
