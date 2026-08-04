import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequireRole } from '../common/decorators/roles.decorator';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@RequireRole('admin', 'admin:access')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Post()
  create(@Body() body: CreateUserDto, @Request() req) {
    return this.usersService.create(body, { userId: req.user.sub, username: req.user.username });
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: UpdateUserDto, @Request() req) {
    return this.usersService.update(+id, body, { userId: req.user.sub, username: req.user.username });
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.usersService.remove(+id, { userId: req.user.sub, username: req.user.username });
  }
}
