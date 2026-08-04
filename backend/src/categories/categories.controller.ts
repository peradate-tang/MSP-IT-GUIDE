import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequireRole } from '../common/decorators/roles.decorator';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(+id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRole('admin', 'admin:access')
  create(@Body() body: CreateCategoryDto, @Request() req) {
    return this.categoriesService.create(body, { userId: req.user.sub, username: req.user.username });
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRole('admin', 'admin:access')
  update(@Param('id') id: string, @Body() body: UpdateCategoryDto, @Request() req) {
    return this.categoriesService.update(+id, body, { userId: req.user.sub, username: req.user.username });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRole('admin', 'admin:access')
  remove(@Param('id') id: string, @Request() req) {
    return this.categoriesService.remove(+id, { userId: req.user.sub, username: req.user.username });
  }
}
