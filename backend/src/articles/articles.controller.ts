import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequireRole } from '../common/decorators/roles.decorator';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { CreateArticleDto, UpdateArticleDto } from './dto/article.dto';

const MAX_PAGE_SIZE = 100;

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
    const isAdmin = user?.role === 'admin' || user?.permissions?.includes('*');
    const isEditor = isAdmin || user?.role === 'editor' || user?.permissions?.includes('articles:write');
    const requestedLimit = limit ? +limit : 10;
    return this.articlesService.findAll({
      search,
      categoryId: categoryId ? +categoryId : undefined,
      status: isEditor ? status : 'published',
      page: page ? Math.max(1, +page) : 1,
      // จำกัดเพดานบนของ limit กัน request ขอข้อมูลทั้งตารางในทีเดียว
      limit: Number.isFinite(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, MAX_PAGE_SIZE) : 10,
      isAdmin,
      isEditor,
      allowedCategories: isAdmin ? [] : user?.allowedCategories,
    });
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.articlesService.findBySlug(slug);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  findOne(@Param('id') id: string, @Request() req?: any) {
    const user = req?.user;
    const isAdmin = user?.role === 'admin' || user?.permissions?.includes('*');
    const isEditor = isAdmin || user?.role === 'editor' || user?.permissions?.includes('articles:write');
    return this.articlesService.findOneForViewer(+id, {
      userId: user?.sub,
      isAdmin,
      isEditor,
      allowedCategories: user?.allowedCategories,
    });
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRole('admin', 'editor', 'articles:write')
  create(@Body() body: CreateArticleDto, @Request() req) {
    return this.articlesService.create(body, req.user.sub, req.user.department);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRole('admin', 'editor', 'articles:write')
  update(@Param('id') id: string, @Body() body: UpdateArticleDto, @Request() req) {
    return this.articlesService.update(+id, body, { role: req.user.role, department: req.user.department, allowedCategories: req.user.allowedCategories, permissions: req.user.permissions });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRole('admin', 'articles:delete')
  remove(@Param('id') id: string) {
    return this.articlesService.remove(+id);
  }
}
