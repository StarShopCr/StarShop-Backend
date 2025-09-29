import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { EscrowService } from '../services/escrow.service';
import { FundEscrowDto } from '../dto/fund-escrow.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('escrows')
@Controller('api/v1/escrows')
export class EscrowController {
  constructor(private readonly escrowService: EscrowService) {}

  @Post(':id/fund')
  @ApiOperation({ summary: 'Fund an escrow' })
  async fund(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: FundEscrowDto,
  ) {
    return this.escrowService.fundEscrow(id, dto);
  }
}
