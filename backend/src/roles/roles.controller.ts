import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequireRole } from '../common/decorators/roles.decorator';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';

@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
@RequireRole('admin', 'admin:access')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(+id);
  }

  @Post()
  create(@Body() body: CreateRoleDto, @Request() req) {
    return this.rolesService.create(body, { userId: req.user.sub, username: req.user.username });
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: UpdateRoleDto, @Request() req) {
    return this.rolesService.update(+id, body, { userId: req.user.sub, username: req.user.username });
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.rolesService.remove(+id, { userId: req.user.sub, username: req.user.username });
  }
}
