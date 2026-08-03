import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Role } from '../roles/role.entity';
import { Category } from '../categories/category.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 100 })
  username: string;

  @Column({ unique: true, length: 150 })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  fullName: string;

  // แผนกของ user = หมวดหมู่ที่ user คนนี้มีสิทธิ์สร้าง/แก้ไข/ลบบทความ (ยกเว้น admin ที่ทำได้ทุกหมวด)
  // ผูกกับ Category โดยตรงแทนข้อความอิสระเดิม กัน typo/ไม่ตรงกับหมวดหมู่จริง
  @ManyToOne(() => Category, { eager: true, nullable: true })
  @JoinColumn({ name: 'departmentCategoryId' })
  departmentCategory: Category;

  @Column({ nullable: true })
  departmentCategoryId: number;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => Role, (role) => role.users, { eager: true })
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @Column({ nullable: true })
  roleId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
