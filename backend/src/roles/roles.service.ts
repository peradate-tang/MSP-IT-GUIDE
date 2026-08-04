import { Injectable, NotFoundException, ConflictException, InternalServerErrorException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './role.entity';
import { User } from '../users/user.entity';
import { ActivityLogService } from '../activity-log/activity-log.service';

@Injectable()
export class RolesService implements OnModuleInit {
  constructor(
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private activityLogService: ActivityLogService,
  ) {}

  async onModuleInit() {
    // Seed default roles — ทุก user ที่สร้างคือคนที่ต้องเข้ามาเขียนบทความ (editor) หรือ admin
    // การอ่านบทความไม่ต้อง login อยู่แล้ว จึงไม่จำเป็นต้องมี role "viewer" แยกอีกต่อไป
    const adminRole = await this.rolesRepository.findOne({ where: { name: 'admin' } });
    if (!adminRole) {
      await this.rolesRepository.save([
        { name: 'admin', description: 'ผู้ดูแลระบบ — จัดการได้ทุกหมวดหมู่/บทความ/ผู้ใช้', permissions: ['*'] },
        { name: 'editor', description: 'พนักงานแผนก — สร้าง/แก้ไข/ลบบทความได้เฉพาะในหมวดหมู่ของแผนกตัวเอง', permissions: ['articles:read', 'articles:write'] },
      ]);
    }
  }

  findAll(): Promise<Role[]> {
    return this.rolesRepository.find();
  }

  async findOne(id: number): Promise<Role> {
    const role = await this.rolesRepository.findOne({ where: { id } });
    if (!role) throw new NotFoundException(`Role #${id} not found`);
    return role;
  }

  async findByName(name: string): Promise<Role> {
    return this.rolesRepository.findOne({ where: { name } });
  }

  async create(data: Partial<Role>, actor?: { userId?: number; username?: string }): Promise<Role> {
    const role = this.rolesRepository.create(data);
    const saved = await this.rolesRepository.save(role);
    this.activityLogService.log({ userId: actor?.userId, username: actor?.username, action: 'create', entityType: 'role', entityId: saved.id, entityLabel: saved.name });
    return saved;
  }

  async update(id: number, data: Partial<Role>, actor?: { userId?: number; username?: string }): Promise<Role> {
    await this.findOne(id);
    await this.rolesRepository.update(id, data);
    const updated = await this.findOne(id);
    this.activityLogService.log({ userId: actor?.userId, username: actor?.username, action: 'update', entityType: 'role', entityId: updated.id, entityLabel: updated.name });
    return updated;
  }

  async remove(id: number, actor?: { userId?: number; username?: string }): Promise<void> {
    const role = await this.findOne(id);
    const usersWithRole = await this.usersRepository.count({ where: { roleId: id } });
    if (usersWithRole > 0) {
      throw new ConflictException(
        `ไม่สามารถลบ Role นี้ได้ เนื่องจากมีผู้ใช้งาน ${usersWithRole} คนกำลังใช้งาน Role นี้อยู่ กรุณาเปลี่ยน Role ของผู้ใช้เหล่านั้นก่อน`,
      );
    }
    try {
      await this.rolesRepository.delete(id);
    } catch {
      throw new InternalServerErrorException('ไม่สามารถลบ Role นี้ได้ เนื่องจากยังมีข้อมูลอื่นในระบบอ้างอิงถึง Role นี้อยู่');
    }
    this.activityLogService.log({ userId: actor?.userId, username: actor?.username, action: 'delete', entityType: 'role', entityId: id, entityLabel: role.name });
  }
}
