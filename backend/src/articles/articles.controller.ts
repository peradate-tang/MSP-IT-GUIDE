import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, Optional } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequireRole } from '../common/decorators/roles.decorator';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  findAll(
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Request() req?: any,
  ) {
    const user = req?.user;
    const isAdmin = user?.role === 'admin';
    const isEditor = user?.role === 'editor';
    return this.articlesService.findAll({
      search,
      categoryId: categoryId ? +categoryId : undefined,
      status: (isAdmin || isEditor) ? status : 'published',
      page: page ? +page : 1,
      limit: limit ? +limit : 10,
      userRole: user?.role,
      userDepartment: user?.department,
      allowedDepartments: user?.allowedDepartments,
    });
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.articlesService.findBySlug(slug);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.articlesService.findOne(+id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRole('admin', 'editor')
  create(@Body() body: any, @Request() req) {
    return this.articlesService.create(body, req.user.sub, req.user.department);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRole('admin', 'editor')
  update(@Param('id') id: string, @Body() body: any, @Request() req) {
    return this.articlesService.update(+id, body, { role: req.user.role, department: req.user.department, allowedDepartments: req.user.allowedDepartments });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRole('admin')
  remove(@Param('id') id: string) {
    return this.articlesService.remove(+id);
  }
}
