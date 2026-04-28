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
          categoryId: getCatId('Network'),
          authorId: 1,
        },
        {
          title: 'Linux Server Hardening Checklist',
          slug: 'linux-server-hardening-checklist',
          excerpt: 'Essential security steps for hardening a Linux server.',
          content: `# Linux Server Hardening Checklist\n\nSecuring your Linux server is critical.\n\n## 1. Update the System\n\`\`\`bash\napt update && apt upgrade -y\n\`\`\`\n\n## 2. Configure SSH\nDisable root login and use key-based authentication.\n\n## 3. Set Up UFW Firewall\n\`\`\`bash\nufw allow OpenSSH\nufw enable\n\`\`\``,
          status: ArticleStatus.PUBLISHED,
          tags: ['linux', 'security', 'server'],
          categoryId: getCatId('Security'),
          authorId: 1,
        },
        {
          title: 'MySQL Backup and Recovery Guide',
          slug: 'mysql-backup-recovery-guide',
          excerpt: 'Complete guide for backing up and restoring MySQL databases.',
          content: `# MySQL Backup and Recovery Guide\n\n## Full Backup with mysqldump\n\`\`\`bash\nmysqldump -u root -p --all-databases > backup.sql\n\`\`\`\n\n## Restore from Backup\n\`\`\`bash\nmysql -u root -p mydb < backup.sql\n\`\`\``,
          status: ArticleStatus.PUBLISHED,
          tags: ['mysql', 'database', 'backup'],
          categoryId: getCatId('Database'),
          authorId: 1,
        },
      ]);
    }
  }

  async findAll(query: {
    search?: string;
    categoryId?: number;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, categoryId, status, page = 1, limit = 10 } = query;
    const where: any = {};
    if (search) where.title = Like(`%${search}%`);
    if (categoryId) where.categoryId = categoryId;
    if (status) where.status = status;

    const [data, total] = await this.articlesRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number): Promise<Article> {
    const article = await this.articlesRepository.findOne({ where: { id } });
    if (!article) throw new NotFoundException(`Article #${id} not found`);
    return article;
  }

  async findBySlug(slug: string): Promise<Article> {
    const article = await this.articlesRepository.findOne({ where: { slug } });
    if (!article) throw new NotFoundException(`Article not found`);
    await this.articlesRepository.increment({ id: article.id }, 'viewCount', 1);
    return article;
  }

  async create(
    data: Partial<Article> & { title: string; content: string },
    authorId: number,
  ): Promise<Article> {
    const slug = data.slug || toSlug(data.title) + '-' + Date.now();
    const article = this.articlesRepository.create({ ...data, slug, authorId });
    return this.articlesRepository.save(article);
  }

  async update(id: number, data: Partial<Article>): Promise<Article> {
    await this.findOne(id);
    if (data.title && !data.slug) {
      data.slug = toSlug(data.title) + '-' + id;
    }
    await this.articlesRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.articlesRepository.delete(id);
  }
}