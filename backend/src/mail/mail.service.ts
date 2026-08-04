import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter | null = null;
  private readonly logger = new Logger(MailService.name);
  private fromAddress: string;

  constructor(private config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    const port = this.config.get<string>('SMTP_PORT');
    this.fromAddress = this.config.get<string>('SMTP_FROM') || user || 'no-reply@staffguide.local';

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: port ? +port : 587,
        secure: this.config.get('SMTP_SECURE') === 'true',
        auth: { user, pass },
      });
    } else {
      // ไม่ throw ตอน start — ให้แอปยังรันได้ปกติ แค่ฟีเจอร์ที่ต้องส่งอีเมล (ลืมรหัสผ่าน) จะใช้ไม่ได้จนกว่าจะตั้งค่า
      this.logger.warn(
        'SMTP ยังไม่ได้ตั้งค่า (ต้องมี SMTP_HOST, SMTP_USER, SMTP_PASS ใน env) — ฟีเจอร์ "ลืมรหัสผ่าน" ทางอีเมลจะใช้งานไม่ได้จนกว่าจะตั้งค่า',
      );
    }
  }

  get isConfigured(): boolean {
    return !!this.transporter;
  }

  async sendPasswordReset(to: string, name: string, resetUrl: string): Promise<void> {
    if (!this.transporter) {
      throw new Error('Email service not configured');
    }
    await this.transporter.sendMail({
      from: this.fromAddress,
      to,
      subject: 'รีเซ็ตรหัสผ่าน — Staff Guide',
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; color: #21301F;">
          <h2 style="margin-bottom: 4px;">รีเซ็ตรหัสผ่าน</h2>
          <p>สวัสดีคุณ ${name},</p>
          <p>มีคำขอรีเซ็ตรหัสผ่านสำหรับบัญชีของคุณใน Staff Guide คลิกปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่ (ลิงก์นี้ใช้ได้ 1 ชั่วโมง)</p>
          <p style="margin: 24px 0;">
            <a href="${resetUrl}" style="background:#A9812B;color:#FFFBF2;padding:10px 22px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;">
              ตั้งรหัสผ่านใหม่
            </a>
          </p>
          <p style="color:#8B9784;font-size:12px;">ถ้าคุณไม่ได้เป็นคนขอรีเซ็ตรหัสผ่าน สามารถเพิกเฉยต่ออีเมลนี้ได้เลย รหัสผ่านเดิมของคุณจะยังใช้งานได้ตามปกติ</p>
        </div>
      `,
    });
  }
}
