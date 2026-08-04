import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './category.entity';
import { User } from '../users/user.entity';
import { Article } from '../articles/article.entity';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { ActivityLogModule } from '../activity-log/activity-log.module';

@Module({
  imports: [TypeOrmModule.forFeature([Category, User, Article]), ActivityLogModule],
  providers: [CategoriesService],
  controllers: [CategoriesController],
  exports: [CategoriesService],
})
export class CategoriesModule {}
