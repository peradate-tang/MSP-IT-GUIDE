import { Injectable, NotFoundException, ConflictException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './user.entity';
import { RolesService } from '../roles/roles.service';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private rolesService: RolesService,
  ) {}

  async onModuleInit() {
    // Seed default admin user
    const admin = await this.usersRepository.findOne({ where: { username: 'admin' } });
    if (!admin) {
      const adminRole = await this.rolesService.findByName('admin');
      if (adminRole) {
        const hashed = await bcrypt.hash('admin1234', 10);
        await this.usersRepository.save({
          username: 'admin',
          email: 'admin@itguide.local',
          password: hashed,
          fullName: 'System Admin',
          role: adminRole,
          roleId: adminRole.id,
        });
        console.log('✅ Default admin created: admin / admin1234');
      }
    }
  }

  private readonly safeSelect: (keyof User)[] = ['id', 'username', 'email', 'fullName', 'department', 'isActive', 'createdAt', 'updatedAt', 'roleId', 'role'];

  findAll(): Promise<User[]> {
    return this.usersRepository.find({ select: this.safeSelect });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id }, select: this.safeSelect });
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return user;
  }

  async findByUsername(username: string): Promise<User> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async findByEmail(email: string): Promise<User> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async create(data: {
    username: string;
    email: string;
    password: string;
    fullName?: string;
    department?: string;
    roleId?: number;
  }): Promise<User> {
    const exists = await this.usersRepository.findOne({ where: [{ username: data.username }, { email: data.email }] });
    if (exists) throw new ConflictException('Username or email already exists');

    const hashed = await bcrypt.hash(data.password, 10);
    const user = this.usersRepository.create({ ...data, password: hashed });
    const saved = await this.usersRepository.save(user);
    // ดึงกลับด้วย findOne เพื่อไม่ให้ password hash หลุดไปกับ response
    return this.findOne(saved.id);
  }

  async update(id: number, data: Partial<{ fullName: string; email: string; department: string; isActive: boolean; roleId: number; password: string }>): Promise<User> {
    await this.findOne(id);
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    await this.usersRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.usersRepository.delete(id);
  }

  async findDepartments(): Promise<string[]> {
    const rows = await this.usersRepository
      .createQueryBuilder('user')
      .select('DISTINCT user.department', 'department')
      .where('user.department IS NOT NULL')
      .getRawMany();
    return rows.map((r: any) => r.department).filter(Boolean);
  }
}
