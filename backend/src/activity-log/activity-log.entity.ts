import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export type ActivityAction = 'create' | 'update' | 'delete';
export type ActivityEntityType = 'article' | 'category' | 'user' | 'role';

@Entity('activity_logs')
export class ActivityLog {
  @PrimaryGeneratedColumn()
  id: number;

  // เก็บ userId + username แบบ snapshot (ไม่ใช้ FK) เพื่อให้ log ยังอ่านได้แม้ user ต้นทางถูกลบไปแล้ว
  @Column({ nullable: true })
  userId: number;

  @Column({ length: 100 })
  username: string;

  @Column({ length: 20 })
  action: ActivityAction;

  @Column({ length: 20 })
  entityType: ActivityEntityType;

  @Column({ nullable: true })
  entityId: number;

  // ชื่อของสิ่งที่ถูกกระทำ ณ ตอนนั้น เช่น ชื่อบทความ/ชื่อผู้ใช้ (เผื่อของถูกลบ/เปลี่ยนชื่อไปแล้ว)
  @Column({ length: 255, nullable: true })
  entityLabel: string;

  @Index()
  @CreateDateColumn()
  createdAt: Date;
}
