import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequireRole } from '../common/decorators/roles.decorator';

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
  @RequireRole('admin', 'editor', 'categories:write')
  create(@Body() body: { name: string; description?: string; icon?: string; sortOrder?: number }) {
    return this.categoriesService.create(body);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRole('admin', 'editor', 'categories:write')
  update(@Param('id') id: string, @Body() body: { name?: string; description?: string; icon?: string; sortOrder?: number }) {
    return this.categoriesService.update(+id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRole('admin', 'categories:write')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(+id);
  }
}
