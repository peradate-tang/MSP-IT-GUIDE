import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Article, ArticleStatus } from './article.entity';

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(Article)
    private articlesRepository: Repository<Article>,
  ) {}

  async onModuleInit() {
    const count = await this.articlesRepository.count();
    if (count === 0) {
      const categoryRepo = this.articlesRepository.manager.getRepository('Category');
      let retries = 10;
      let categories: any[] = [];
      while (retries > 0) {
        categories = await categoryRepo.find();
        if (categories.length > 0) break;
        await new Promise((r) => setTimeout(r, 1000));
        retries--;
      }
      if (categories.length === 0) return;

      const getCatId = (name: string) =>
        categories.find((c: any) => c.name === name)?.id;

      await this.articlesRepository.save([
        {
          title: 'Getting Started with Network Configuration',
          slug: 'getting-started-network-configuration',
          excerpt: 'Learn the basics of setting up a network from scratch.',
          content: `# Getting Started with Network Configuration\n\nThis guide covers the fundamentals of setting up a network in your organization.\n\n## Prerequisites\n- Basic understanding of IP addressing\n- Access to network equipment\n\n## Step 1: Plan Your Network\nStart by drawing a network diagram...\n\n## Step 2: Configure Your Router\nAccess the router admin panel at \`192.168.1.1\`...\n\n## Step 3: Set Up DHCP\nEnable DHCP to automatically assign IP addresses...`,
          status: ArticleStatus.PUBLISHED,
          tags: ['network', 'beginner', 'configuration'],
          cat