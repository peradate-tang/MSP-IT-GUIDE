import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './role.entity';

@Injectable()
export class RolesService implements OnModuleInit {
  constructor(
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
  ) {}

  async onModuleInit() {
    // Seed default roles
    const adminRole = await this.rolesRepository.findOne({ where: { name: 'admin' } });
    if (!adminRole) {
      await this.rolesRepository.save([
        { name: 'admin', description: 'Administrator with full access', permissions: ['*'] },
        { name: 'editor', description: 'Can create and edit articles', permissions: ['articles:read', 'articles:write'] },
        { name: 'viewer', description: 'Read-only access', permissions: ['articles:read'] },
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

  async create(data: Partial<Role>): Promise<Role> {
    const role = this.rolesRepository.create(data);
    return this.rolesRepository.save(role);
  }

  async update(id: number, data: Partial<Role>): Promise<Role> {
    await this.findOne(id);
    await this.rolesRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.rolesRepository.delete(id);
  }
}
