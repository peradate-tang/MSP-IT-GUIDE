import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from './article.entity';
import { ArticlesService } from './articles.service';
import { ArticlesController } from './articles.controller';
import { Category } from '../categories/category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Article, Category])],
  providers: [ArticlesService],
  controllers: [ArticlesController],
})
export class ArticlesModule {}