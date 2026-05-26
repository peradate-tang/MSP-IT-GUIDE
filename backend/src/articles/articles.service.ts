import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { Article, ArticleStatus } from './article.entity';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Extract Cloudinary public_id and resource_type from a URL
function parseCloudinaryUrl(url: string): { publicId: string; resourceType: string } | null {
  const match = url.match(/https?:\/\/res\.cloudinary\.com\/[^/]+\/(image|video|raw)\/upload\/(?:[^/]+\/)*msp-it-guide\/(\w+)\//);
  if (!match) return null;
  const resourceType = match[1];
  // Extract public_id: everything after /upload/[optional-transforms]/ until end, strip extension
  const afterUpload = url.replace(/^.*\/upload\//, '');
  // Remove transformation segments (they contain commas or known transform keywords)
  const parts = afterUpload.split('/');
  const publicParts = parts.filter(p => !p.includes(',') && !p.match(/^[a-z]_/));
  const publicIdWithExt = publicParts.join('/');
  const publicId = publicIdWithExt.replace(/\.[^.]+$/, '');
  return { publicId, resourceType };
}

async function deleteCloudinaryAssets(htmlContent: string): Promise<void> {
  try {
    const urlRegex = /https?:\/\/res\.cloudinary\.com\/[^\s"'<>)]+/g;
    const urls = htmlContent.match(urlRegex) || [];
    const seen = new Set<string>();
    for (const url of urls) {
      const parsed = parseCloudinaryUrl(url);
      if (!parsed || seen.has(parsed.publicId)) continue;
      seen.add(parsed.publicId);
      await cloudinary.uploader.destroy(parsed.publicId, { resource_type: parsed.resourceType as any }).catch(() => {});
    }
  } catch {}
}

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
    try {
      const count = await this.articlesRepository.count();
      if (count === 0) {
        const categoryRepo =
          this.articlesRepository.manager.getRepository('Category');
        let retries = 15;
        let categories: any[] = [];
        while (retries > 0) {
          categories = await categoryRepo.find();
          if (categories.length > 0) break;
          await new Promise((r) => setTimeout(r, 1000));
          retries--;
        }
        if (categories.length === 0) return;

        const getCatId = (name: string) =>
          categories.find((c: any) => c.name === name)?.id ?? null;

        const seeds: any[] = [
          {
            title: 'Getting Started with Network Configuration',
            slug: 'getting-started-network-configuration',
            excerpt: 'Learn the basics of setting up a network from scratch.',
            content: '# Getting Started with Network Configuration\n\nThis guide covers the fundamentals of setting up a network.\n\n## Prerequisites\n- Basic understanding of IP addressing\n- Access to network equipment\n\n## Step 1: Plan Your Network\nStart by drawing a network diagram.\n\n## Step 2: Configure Your Router\nAccess the admin panel at `192.168.1.1`.\n\n## Step 3: Set Up DHCP\nEnable DHCP to automatically assign IP addresses.',
            status: ArticleStatus.PUBLISHED,
            tags: ['network', 'beginner', 'configuration'],
            categoryId: getCatId('Network'),
            authorId: 1,
          },
          {
            title: 'Linux Server Hardening Checklist',
            slug: 'linux-server-hardening-checklist',
            excerpt: 'Essential security steps for hardening a Linux server.',
            content: '# Linux Server Hardening Checklist\n\n## 1. Update the System\n```bash\napt update && apt upgrade -y\n```\n\n## 2. Configure SSH\nDisable root login and use key-based authentication.\n\n## 3. Set Up UFW Firewall\n```bash\nufw allow OpenSSH\nufw enable\n```',
            status: ArticleStatus.PUBLISHED,
            tags: ['linux', 'security', 'server'],
            categoryId: getCatId('Security'),
            authorId: 1,
          },
          {
            title: 'MySQL Backup and Recovery Guide',
            slug: 'mysql-backup-recovery-guide',
            excerpt: 'Complete guide for backing up and restoring MySQL databases.',
            content: '# MySQL Backup and Recovery Guide\n\n## Full Backup\n```bash\nmysqldump -u root -p --all-databases > backup.sql\n```\n\n## Restore\n```bash\nmysql -u root -p mydb < backup.sql\n```',
            status: ArticleStatus.PUBLISHED,
            tags: ['mysql', 'database', 'backup'],
            categoryId: getCatId('Database'),
            authorId: 1,
          },
        ];

        for (const seed of seeds) {
          const entity = this.articlesRepository.create(seed);
          await this.articlesRepository.save(entity);
        }
      }
    } catch (e: any) {
      console.error('Article seed error (non-fatal):', e?.message);
    }
  }

  async findAll(query: {
    search?: string;
    categoryId?: number;
    status?: string;
    page?: number;
    limit?: number;
    isAdmin?: boolean;
    isEditor?: boolean;
    allowedCategories?: number[];
  }) {
    const { search, categoryId, status, page = 1, limit = 10, isAdmin, isEditor, allowedCategories } = query;
    const where: any = {};
    if (search) where.title = Like(`%${search}%`);
    if (status) where.status = status;
    // Editor ที่มี allowedCategories → เห็นเฉพาะหมวดที่กำหนด
    if (!isAdmin && isEditor && allowedCategories && allowedCategories.length > 0) {
      where.categoryId = categoryId ? categoryId : In(allowedCategories);
    } else {
      if (categoryId) where.categoryId = categoryId;
    }

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
    userDepartment?: string,
  ): Promise<Article> {
    const slug = data.slug || toSlug(data.title) + '-' + Date.now();
    const entity = this.articlesRepository.create({
      ...data,
      slug,
      authorId,
      department: userDepartment || null,
    } as any);
    return this.articlesRepository.save(entity) as unknown as Article;
  }

  async update(id: number, data: Partial<Article>, user?: { role: string; department: string; allowedCategories?: number[]; permissions?: string[] }): Promise<Article> {
    const article = await this.findOne(id);
    // ถ้าไม่ใช่ admin และมีการจำกัด category → ตรวจสอบสิทธิ์
    const isAdmin = user?.role === 'admin' || user?.permissions?.includes('*');
    if (!isAdmin && user?.allowedCategories && user.allowedCategories.length > 0 && article.categoryId) {
      if (!user.allowedCategories.includes(article.categoryId)) {
        throw new ForbiddenException('คุณไม่มีสิทธิ์แก้ไขบทความในหมวดหมู่นี้');
      }
    }
    if (data.title && !data.slug) {
      data.slug = toSlug(data.title) + '-' + id;
    }
    await this.articlesRepository.update(id, data as any);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const article = await this.findOne(id);
    await this.articlesRepository.delete(id);
    await deleteCloudinaryAssets(article.content || '');
  }
}
