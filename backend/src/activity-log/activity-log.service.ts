import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog, ActivityAction, ActivityEntityType } from './activity-log.entity';

@Injectable()
export class ActivityLogService {
  constructor(
    @InjectRepository(ActivityLog)
    private logsRepository: Repository<ActivityLog>,
  ) {}

  // fire-and-forget โดยตั้งใจ — การบันทึก log ต้องไม่ทำให้ action หลัก (เช่นสร้าง/ลบบทความ) ล้มเหลวไปด้วย
  log(entry: {
    userId?: number;
    username?: string;
    action: ActivityAction;
    entityType: ActivityEntityType;
    entityId?: number;
    entityLabel?: string;
  }): void {
    this.logsRepository
      .save({
        userId: entry.userId,
        username: entry.username || 'unknown',
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        entityLabel: entry.entityLabel?.slice(0, 255),
      })
      .catch((err) => console.error('Failed to write activity log:', err?.message));
  }

  async findAll(query: { page?: number; limit?: number; entityType?: string; action?: string }) {
    const { page = 1, limit = 30, entityType, action } = query;
    const where: any = {};
    if (entityType) where.entityType = entityType;
    if (action) where.action = action;

    const [data, total] = await this.logsRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
