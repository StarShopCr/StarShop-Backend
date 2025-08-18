import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe, Req, Query } from '@nestjs/common';
import { CommentsService } from '../services/comments.service';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { JwtAuthGuard, RolesGuard } from '@/modules/auth';
import { Request } from 'express';
import { Roles } from '@/modules/shared/decorators/roles.decorator';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post('/buyer-request/:id/comments')
  @UseGuards(JwtAuthGuard)
  async create(
    @Param('id', ParseIntPipe) id: number, 
    @Body() createCommentDto: CreateCommentDto,
    @Req() req: Request
  ) {
    const user = req.user as { id: number };
    return this.commentsService.create(id, user.id, createCommentDto);
  }

  @Get('/buyer-request/:id/comments')
  async getAll(
    @Param('id', ParseIntPipe) id: number,
    @Query('page', ParseIntPipe) page: number = 1
  ) {
    return this.commentsService.findAllForBuyerRequest(id, page);
  }

  @Delete('/comments/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'buyer')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const user = req.user as { id: number };
    return this.commentsService.remove(id, user.id);
  }
}
