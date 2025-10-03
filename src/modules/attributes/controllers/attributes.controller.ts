import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  HttpStatus,
  UseGuards,
} from "@nestjs/common"
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiBearerAuth } from "@nestjs/swagger"
import { ApiSuccessResponse, ApiErrorResponse } from "../../../common/decorators/api-response.decorator"
import { CreateAttributeDto } from "../dto/create-attribute.dto"
import { UpdateAttributeDto } from "../dto/update-attribute.dto"
import { GetAttributesQueryDto } from "../dto/get-attributes-query.dto"
import { AttributeResponseDto, PaginatedAttributesResponseDto } from "../dto/attribute-response.dto"
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard"
import { RolesGuard } from "../../auth/guards/roles.guard"
import { Roles } from "../../auth/decorators/roles.decorator"
import { UserRole } from "../../auth/enums/user-role.enum"
import { AttributeService } from "../services/attributes.service"

@ApiTags("Attributes")
@Controller("attributes")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AttributeController {
  constructor(private readonly attributeService: AttributeService) {}

  @Post()
  @UseGuards(RolesGuard)
  // @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new attribute' })
  @ApiSuccessResponse(HttpStatus.CREATED, 'Attribute created successfully', AttributeResponseDto)
  @ApiErrorResponse(HttpStatus.CONFLICT, 'Attribute with this name already exists')
  @ApiErrorResponse(HttpStatus.BAD_REQUEST, 'Invalid input data')
  async create(@Body() createAttributeDto: CreateAttributeDto) {
    return this.attributeService.create(createAttributeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all attributes with pagination' })
  @ApiSuccessResponse(HttpStatus.OK, 'Attributes retrieved successfully', PaginatedAttributesResponseDto)
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(@Query() query: GetAttributesQueryDto) {
    return this.attributeService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an attribute by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Attribute ID' })
  @ApiSuccessResponse(HttpStatus.OK, 'Attribute retrieved successfully', AttributeResponseDto)
  @ApiErrorResponse(HttpStatus.NOT_FOUND, 'Attribute not found')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.attributeService.findOne(id);
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  // @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: "Update an attribute" })
  @ApiParam({ name: "id", type: Number, description: "Attribute ID" })
  @ApiSuccessResponse(HttpStatus.OK, "Attribute updated successfully", AttributeResponseDto)
  @ApiErrorResponse(HttpStatus.NOT_FOUND, "Attribute not found")
  @ApiErrorResponse(HttpStatus.CONFLICT, "Attribute with this name already exists")
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateAttributeDto: UpdateAttributeDto) {
    return this.attributeService.update(id, updateAttributeDto)
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  // @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete an attribute' })
  @ApiParam({ name: 'id', type: Number, description: 'Attribute ID' })
  @ApiSuccessResponse(HttpStatus.NO_CONTENT, 'Attribute deleted successfully')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, 'Attribute not found')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.attributeService.remove(id);
  }

  @Post(":id/values")
  @UseGuards(RolesGuard)
  // @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: "Add a value to an attribute" })
  @ApiParam({ name: "id", type: Number, description: "Attribute ID" })
  @ApiSuccessResponse(HttpStatus.CREATED, "Attribute value added successfully")
  @ApiErrorResponse(HttpStatus.NOT_FOUND, "Attribute not found")
  @ApiErrorResponse(HttpStatus.CONFLICT, "Value already exists for this attribute")
  async addValue(@Param('id', ParseIntPipe) id: number, @Body('value') value: string) {
    return this.attributeService.addValue(id, value)
  }

  @Get(':id/values')
  @ApiOperation({ summary: 'Get all values for an attribute' })
  @ApiParam({ name: 'id', type: Number, description: 'Attribute ID' })
  @ApiSuccessResponse(HttpStatus.OK, 'Attribute values retrieved successfully')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, 'Attribute not found')
  async getValues(@Param('id', ParseIntPipe) id: number) {
    return this.attributeService.getAttributeValues(id);
  }

  @Delete(":id/values/:valueId")
  @UseGuards(RolesGuard)
  // @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: "Remove a value from an attribute" })
  @ApiParam({ name: "id", type: Number, description: "Attribute ID" })
  @ApiParam({ name: "valueId", type: Number, description: "Attribute Value ID" })
  @ApiSuccessResponse(HttpStatus.NO_CONTENT, "Attribute value removed successfully")
  @ApiErrorResponse(HttpStatus.NOT_FOUND, "Attribute or value not found")
  async removeValue(@Param('id', ParseIntPipe) id: number, @Param('valueId', ParseIntPipe) valueId: number) {
    await this.attributeService.removeValue(id, valueId)
  }
}
