import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Article, ArticleStatus } from './article.entity';
import { ActivityLogService } from '../activity-log/activity-log.service';
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

function extractCloudinaryUrls(htmlContent: string): Set<string> {
  const urlRegex = /https?:\/\/res\.cloudinary\.com\/[^\s"'<>)]+/g;
  return new Set(htmlContent.match(urlRegex) || []);
}

async function deleteCloudinaryAssetsByUrl(urls: Iterable<string>): Promise<void> {
  const seen = new Set<string>();
  for (const url of urls) {
    try {
      const parsed = parseCloudinaryUrl(url);
      if (!parsed || seen.has(parsed.publicId)) continue;
      seen.add(parsed.publicId);
      await cloudinary.uploader.destroy(parsed.publicId, { resource_type: parsed.resourceType as any }).catch(() => {});
    } catch {
      // ไม่ให้ error การลบไฟล์เดี่ยวๆ ทำให้ทั้ง request ล้ม
    }
  }
}

async function deleteCloudinaryAssets(htmlContent: string): Promise<void> {
  await deleteCloudinaryAssetsByUrl(extractCloudinaryUrls(htmlContent));
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
    private activityLogService: ActivityLogService,
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
            categoryId: getCatId('IT'),
            authorId: 1,
          },
          {
            title: 'Linux Server Hardening Checklist',
            slug: 'linux-server-hardening-checklist',
            excerpt: 'Essential security steps for hardening a Linux server.',
            content: '# Linux Server Hardening Checklist\n\n## 1. Update the System\n```bash\napt update && apt upgrade -y\n```\n\n## 2. Configure SSH\nDisable root login and use key-based authentication.\n\n## 3. Set Up UFW Firewall\n```bash\nufw allow OpenSSH\nufw enable\n```',
            status: ArticleStatus.PUBLISHED,
            tags: ['linux', 'security', 'server'],
            categoryId: getCatId('IT'),
            authorId: 1,
          },
          {
            title: 'MySQL Backup and Recovery Guide',
            slug: 'mysql-backup-recovery-guide',
            excerpt: 'Complete guide for backing up and restoring MySQL databases.',
            content: '# MySQL Backup and Recovery Guide\n\n## Full Backup\n```bash\nmysqldump -u root -p --all-databases > backup.sql\n```\n\n## Restore\n```bash\nmysql -u root -p mydb < backup.sql\n```',
            status: ArticleStatus.PUBLISHED,
            tags: ['mysql', 'database', 'backup'],
            categoryId: getCatId('IT'),
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
    departmentCategoryId?: number | null;
  }) {
    const { search, categoryId, status, page = 1, limit = 10, isAdmin, isEditor, departmentCategoryId } = query;
    const baseWhere: any = {};
    if (status) baseWhere.status = status;

    // ข้อจำกัดแผนกใช้ตอน "จัดการ" บทความ (เห็น draft/ทุกสถานะ) เท่านั้น — ไม่ใช่ตอนอ่านบทความที่เผยแพร่แล้ว
    // ทุกคน (รวมถึง editor แผนกอื่น) ต้องอ่านบทความที่เผยแพร่แล้วของทุกแผนกได้ปกติ
    // แก้ไข/ลบ ถูกจำกัดแยกต่างหากอยู่แล้วใน update()/remove()/create()
    const isManagementView = status !== 'published';

    if (!isAdmin && isEditor && isManagementView && departmentCategoryId != null) {
      // Editor ที่ผูกแผนก (departmentCategoryId) → ตอนดูเพื่อจัดการ เห็นเฉพาะบทความในหมวดของแผนกตัวเองเท่านั้น
      // (ห้าม categoryId ที่ส่งมาเองใน query bypass ข้อจำกัดนี้)
      baseWhere.categoryId = categoryId && categoryId !== departmentCategoryId ? -1 : departmentCategoryId;
    } else {
      if (categoryId) baseWhere.categoryId = categoryId;
    }

    // ค้นหาครอบคลุม title, content และ tags (ไม่ใช่แค่ title เหมือนเดิม)
    const where = search
      ? [
          { ...baseWhere, title: Like(`%${search}%`) },
          { ...baseWhere, content: Like(`%${search}%`) },
          { ...baseWhere, tags: Like(`%${search}%`) },
        ]
      : baseWhere;

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

  async findOneForViewer(
    id: number,
    viewer?: { userId?: number; isAdmin?: boolean; isEditor?: boolean; departmentCategoryId?: number | null },
  ): Promise<Article> {
    const article = await this.findOne(id);

    if (article.status !== ArticleStatus.PUBLISHED) {
      const isOwner = viewer?.userId != null && viewer.userId === article.authorId;
      const isAllowedEditor =
        !!viewer?.isEditor &&
        (viewer?.departmentCategoryId == null || !article.categoryId || viewer.departmentCategoryId === article.categoryId);

      if (!viewer?.isAdmin && !isOwner && !isAllowedEditor) {
        // ใช้ NotFoundException แทน Forbidden เพื่อไม่ให้ยืนยันการมีอยู่ของ draft/บทความที่ไม่มีสิทธิ์เห็น
        throw new NotFoundException(`Article #${id} not found`);
      }
    }

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
    author?: { isAdmin?: boolean; departmentCategoryId?: number | null; username?: string },
  ): Promise<Article> {
    let categoryId = data.categoryId;
    if (!author?.isAdmin) {
      if (author?.departmentCategoryId == null) {
        throw new ForbiddenException('บัญชีของคุณยังไม่ได้ผูกแผนก กรุณาติดต่อผู้ดูแลระบบให้กำหนดแผนกก่อนสร้างบทความ');
      }
      // Editor สร้างบทความได้เฉพาะในหมวดของแผนกตัวเองเท่านั้น ไม่ว่าจะส่ง categoryId อะไรมาในคำขอก็ตาม
      categoryId = author.departmentCategoryId;
    }

    const slug = data.slug || toSlug(data.title) + '-' + Date.now();
    const entity = this.articlesRepository.create({
      ...data,
      categoryId,
      slug,
      authorId,
    } as any);
    const saved = await this.articlesRepository.save(entity) as unknown as Article;

    this.activityLogService.log({
      userId: authorId,
      username: author?.username,
      action: 'create',
      entityType: 'article',
      entityId: saved.id,
      entityLabel: saved.title,
    });

    return saved;
  }

  async update(
    id: number,
    data: Partial<Article>,
    user?: { isAdmin?: boolean; departmentCategoryId?: number | null; userId?: number; username?: string },
  ): Promise<Article> {
    const article = await this.findOne(id);
    if (!user?.isAdmin) {
      // Editor แก้ไขได้เฉพาะบทความในหมวดของแผนกตัวเองเท่านั้น
      if (user?.departmentCategoryId == null || article.categoryId !== user.departmentCategoryId) {
        throw new ForbiddenException('คุณไม่มีสิทธิ์แก้ไขบทความในหมวดหมู่นี้');
      }
      // กันไม่ให้ editor ย้ายบทความออกนอกแผนกตัวเองผ่านการแก้ categoryId
      if (data.categoryId != null && data.categoryId !== user.departmentCategoryId) {
        throw new ForbiddenException('คุณไม่สามารถย้ายบทความไปหมวดหมู่อื่นนอกแผนกของคุณได้');
      }
    }
    if (data.title && !data.slug) {
      data.slug = toSlug(data.title) + '-' + id;
    }

    const oldContent = article.content || '';
    await this.articlesRepository.update(id, data as any);
    const updated = await this.findOne(id);

    // ถ้าเนื้อหาถูกแก้ไข ให้ลบไฟล์ Cloudinary ที่ถูกเอาออกจากบทความ (กันไฟล์กำพร้าค้างพื้นที่)
    if (typeof data.content === 'string' && data.content !== oldContent) {
      const oldUrls = extractCloudinaryUrls(oldContent);
      const newUrls = extractCloudinaryUrls(updated.content || '');
      const removedUrls = [...oldUrls].filter((u) => !newUrls.has(u));
      if (removedUrls.length > 0) {
        deleteCloudinaryAssetsByUrl(removedUrls).catch(() => {});
      }
    }

    this.activityLogService.log({
      userId: user?.userId,
      username: user?.username,
      action: 'update',
      entityType: 'article',
      entityId: updated.id,
      entityLabel: updated.title,
    });

    return updated;
  }

  async remove(id: number, user?: { isAdmin?: boolean; departmentCategoryId?: number | null; userId?: number; username?: string }): Promise<void> {
    const article = await this.findOne(id);
    if (!user?.isAdmin) {
      // Editor ลบได้เฉพาะบทความในหมวดของแผนกตัวเองเท่านั้น
      if (user?.departmentCategoryId == null || article.categoryId !== user.departmentCategoryId) {
        throw new ForbiddenException('คุณไม่มีสิทธิ์ลบบทความในหมวดหมู่นี้');
      }
    }
    await this.articlesRepository.delete(id);
    await deleteCloudinaryAssets(article.content || '');

    this.activityLogService.log({
      userId: user?.userId,
      username: user?.username,
      action: 'delete',
      entityType: 'article',
      entityId: id,
      entityLabel: article.title,
    });
  }
}
